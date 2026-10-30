-- Apply once in Supabase SQL Editor before enabling voucher checkout.
-- The checkout RPC is the financial authority: it reads prices, checks stock,
-- reserves vouchers, and debits wallet balance in one database transaction.

alter table public.user_vouchers
  add column if not exists expires_at timestamptz,
  add column if not exists reserved_order_id uuid references public.orders(id) on delete set null;

alter table public.products
  add column if not exists flash_sale_harga bigint,
  add column if not exists flash_sale_mulai timestamptz,
  add column if not exists flash_sale_selesai timestamptz;

alter table public.orders
  add column if not exists metode_pengiriman text,
  add column if not exists jadwal_kirim timestamptz,
  add column if not exists estimasi_tiba timestamptz;

create index if not exists user_vouchers_checkout_available_idx
  on public.user_vouchers(user_id, status, expires_at)
  where status = 'available';

create or replace function public.handle_order_paid()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status_bayar = 'paid' and old.status_bayar <> 'paid' then
    update public.profiles
      set poin = poin + floor(new.total / 10000)
      where id = new.user_id;

    insert into public.point_history (user_id, jumlah, tipe, keterangan)
      values (new.user_id, floor(new.total / 10000), 'dapat', 'Belanja order ' || new.id);

    if new.user_voucher_id is not null then
      update public.user_vouchers
        set status = 'used', reserved_order_id = null
        where id = new.user_voucher_id and reserved_order_id = new.id;
    end if;
  end if;
  return new;
end;
$$;

create or replace function public.checkout_create_order_with_voucher(
  p_user_id uuid,
  p_address_id uuid,
  p_items jsonb,
  p_metode text,
  p_ongkir bigint,
  p_user_voucher_id uuid default null
)
returns public.orders
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order public.orders%rowtype;
  v_voucher record;
  v_user_voucher public.user_vouchers%rowtype;
  v_item jsonb;
  v_product public.products%rowtype;
  v_qty integer;
  v_price bigint;
  v_subtotal bigint := 0;
  v_discount bigint := 0;
  v_total bigint;
  v_balance bigint;
  v_rows integer;
begin
  if p_metode not in ('ewallet', 'bank', 'saldo') then
    raise exception 'Metode pembayaran tidak valid';
  end if;
  if p_ongkir < 0 or jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'Keranjang atau ongkos kirim tidak valid';
  end if;
  if not exists (select 1 from public.addresses where id = p_address_id and user_id = p_user_id) then
    raise exception 'Alamat pengiriman tidak ditemukan';
  end if;

  -- First pass locks every product row and derives trusted prices and subtotal.
  for v_item in select value from jsonb_array_elements(p_items)
  loop
    if coalesce(v_item->>'id', '') = '' or coalesce((v_item->>'qty')::integer, 0) < 1 then
      raise exception 'Produk atau jumlah tidak valid';
    end if;
    select * into v_product from public.products where id = (v_item->>'id')::uuid for update;
    if not found then raise exception 'Produk tidak ditemukan'; end if;
    v_qty := (v_item->>'qty')::integer;
    if v_product.stok < v_qty then raise exception 'Stok produk % tidak mencukupi', v_product.nama; end if;
    v_price := case
      when v_product.flash_sale_harga is not null
        and (v_product.flash_sale_mulai is null or v_product.flash_sale_mulai <= now())
        and (v_product.flash_sale_selesai is null or v_product.flash_sale_selesai > now()) then v_product.flash_sale_harga
      when v_product.harga_diskon is not null and v_product.harga_diskon > 0 then v_product.harga_diskon
      else v_product.harga
    end;
    if v_price < 0 then raise exception 'Harga produk tidak valid'; end if;
    v_subtotal := v_subtotal + (v_price * v_qty);
  end loop;

  if p_user_voucher_id is not null then
    select * into v_user_voucher from public.user_vouchers
      where id = p_user_voucher_id and user_id = p_user_id for update;
    if not found or v_user_voucher.status <> 'available' or v_user_voucher.reserved_order_id is not null then
      raise exception 'Voucher sudah digunakan atau sedang dipakai';
    end if;
    if v_user_voucher.expires_at is not null and v_user_voucher.expires_at <= now() then
      raise exception 'Voucher sudah kedaluwarsa';
    end if;
    select tipe, nilai into v_voucher from public.vouchers where id = v_user_voucher.voucher_id and aktif = true;
    if not found then raise exception 'Voucher tidak aktif'; end if;
    if v_voucher.tipe = 'gratis_ongkir' then
      v_discount := p_ongkir;
    elsif v_voucher.tipe = 'persen' then
      v_discount := least(v_subtotal, floor(v_subtotal * least(greatest(v_voucher.nilai, 0), 100) / 100.0));
    elsif v_voucher.tipe in ('potongan', 'nilai') then
      v_discount := least(v_subtotal, greatest(v_voucher.nilai, 0));
    else
      raise exception 'Jenis voucher tidak didukung';
    end if;
  end if;

  v_total := greatest(0, v_subtotal + p_ongkir - v_discount);
  if p_metode = 'saldo' then
    select saldo into v_balance from public.profiles where id = p_user_id for update;
    if not found or v_balance < v_total then raise exception 'Saldo tidak cukup'; end if;
  end if;

  insert into public.orders (user_id, address_id, subtotal, ongkir, potongan_voucher, total,
    metode_bayar, status_bayar, user_voucher_id)
  values (p_user_id, p_address_id, v_subtotal, p_ongkir, v_discount, v_total,
    p_metode, 'pending', p_user_voucher_id)
  returning * into v_order;

  -- Second pass writes order lines at the same trusted prices and decrements stock.
  for v_item in select value from jsonb_array_elements(p_items)
  loop
    select * into v_product from public.products where id = (v_item->>'id')::uuid;
    v_qty := (v_item->>'qty')::integer;
    v_price := case
      when v_product.flash_sale_harga is not null
        and (v_product.flash_sale_mulai is null or v_product.flash_sale_mulai <= now())
        and (v_product.flash_sale_selesai is null or v_product.flash_sale_selesai > now()) then v_product.flash_sale_harga
      when v_product.harga_diskon is not null and v_product.harga_diskon > 0 then v_product.harga_diskon
      else v_product.harga
    end;
    update public.products set stok = stok - v_qty where id = v_product.id and stok >= v_qty;
    get diagnostics v_rows = row_count;
    if v_rows = 0 then raise exception 'Stok produk % tidak mencukupi', v_product.nama; end if;
    insert into public.order_items (order_id, product_id, qty, harga_saat_beli)
      values (v_order.id, v_product.id, v_qty, v_price);
  end loop;

  if p_user_voucher_id is not null then
    update public.user_vouchers set reserved_order_id = v_order.id where id = p_user_voucher_id;
  end if;
  if p_metode = 'saldo' then
    update public.profiles set saldo = saldo - v_total where id = p_user_id;
    update public.orders set status_bayar = 'paid' where id = v_order.id returning * into v_order;
  end if;

  return v_order;
end;
$$;

revoke all on function public.checkout_create_order_with_voucher(uuid, uuid, jsonb, text, bigint, uuid) from public, anon, authenticated;
grant execute on function public.checkout_create_order_with_voucher(uuid, uuid, jsonb, text, bigint, uuid) to service_role;
