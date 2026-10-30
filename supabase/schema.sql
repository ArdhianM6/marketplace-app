-- Jalankan file ini di Supabase Dashboard > SQL Editor > New query
-- Urutan penting karena ada foreign key antar tabel.

create extension if not exists "uuid-ossp";

-- ========== PROFILES ==========
-- Supabase Auth sudah punya tabel auth.users bawaan (email, google, facebook).
-- Kita buat tabel profiles untuk data tambahan (poin, saldo, role) yang terhubung 1-1.
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  nama text,
  no_hp text,
  role text not null default 'user' check (role in ('user','admin')),
  poin integer not null default 0,
  saldo bigint not null default 0,
  created_at timestamptz not null default now()
);

-- Otomatis bikin row profiles setiap ada user baru daftar
create function handle_new_user() returns trigger as $$
begin
  insert into public.profiles (id, nama)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', new.email));
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();

-- ========== ADDRESSES ==========
create table addresses (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references profiles(id) on delete cascade,
  label text not null default 'Rumah',
  penerima text not null,
  no_hp text not null,
  alamat_lengkap text not null,
  kota text not null,
  kode_pos text,
  latitude double precision,
  longitude double precision,
  is_default boolean not null default false,
  created_at timestamptz not null default now()
);

-- ========== CATEGORIES ==========
create table categories (
  id uuid primary key default uuid_generate_v4(),
  nama text not null,
  icon text
);

-- ========== PRODUCTS ==========
create table products (
  id uuid primary key default uuid_generate_v4(),
  nama text not null,
  category_id uuid references categories(id),
  harga bigint not null,
  harga_diskon bigint,
  stok integer not null default 0,
  deskripsi text,
  foto_url text,
  created_at timestamptz not null default now()
);

-- ========== VOUCHERS ==========
create table vouchers (
  id uuid primary key default uuid_generate_v4(),
  judul text not null,
  tipe text not null check (tipe in ('potongan','persen','gratis_ongkir')),
  nilai bigint not null default 0,
  biaya_poin integer not null default 0,
  aktif boolean not null default true
);

-- Voucher yang sudah ditukar oleh user, siap dipakai saat checkout
create table user_vouchers (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references profiles(id) on delete cascade,
  voucher_id uuid not null references vouchers(id),
  status text not null default 'available' check (status in ('available','used')),
  redeemed_at timestamptz not null default now()
);

-- ========== ORDERS ==========
create table orders (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references profiles(id) on delete cascade,
  address_id uuid references addresses(id),
  subtotal bigint not null,
  ongkir bigint not null default 0,
  potongan_voucher bigint not null default 0,
  total bigint not null,
  metode_bayar text not null check (metode_bayar in ('ewallet','bank','saldo')),
  status_bayar text not null default 'pending' check (status_bayar in ('pending','paid','failed')),
  status_order text not null default 'diproses' check (status_order in ('diproses','dikirim','selesai','batal')),
  user_voucher_id uuid references user_vouchers(id),
  midtrans_order_id text,
  created_at timestamptz not null default now()
);

create table order_items (
  id uuid primary key default uuid_generate_v4(),
  order_id uuid not null references orders(id) on delete cascade,
  product_id uuid not null references products(id),
  qty integer not null,
  harga_saat_beli bigint not null
);

-- ========== WALLET TOPUP ==========
create table wallet_topups (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references profiles(id) on delete cascade,
  jumlah bigint not null,
  status text not null default 'pending' check (status in ('pending','paid','failed')),
  midtrans_order_id text,
  created_at timestamptz not null default now()
);

-- ========== POINT HISTORY ==========
create table point_history (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references profiles(id) on delete cascade,
  jumlah integer not null,
  tipe text not null check (tipe in ('dapat','tukar')),
  keterangan text,
  created_at timestamptz not null default now()
);

-- ========== FUNCTION: tambah poin & saldo otomatis saat order jadi 'paid' ==========
create function handle_order_paid() returns trigger as $$
begin
  if new.status_bayar = 'paid' and old.status_bayar <> 'paid' then
    -- 1 poin tiap kelipatan Rp10.000 belanja
    update profiles
      set poin = poin + floor(new.total / 10000)
      where id = new.user_id;

    insert into point_history (user_id, jumlah, tipe, keterangan)
      values (new.user_id, floor(new.total / 10000), 'dapat', 'Belanja order ' || new.id);

    if new.user_voucher_id is not null then
      update user_vouchers set status = 'used' where id = new.user_voucher_id;
    end if;
  end if;
  return new;
end;
$$ language plpgsql security definer;

create trigger on_order_paid
  after update on orders
  for each row execute procedure handle_order_paid();

-- ========== FUNCTION: tukar poin dengan voucher ==========
create function redeem_voucher(p_user_id uuid, p_voucher_id uuid)
returns uuid as $$
declare
  v_cost integer;
  v_poin integer;
  v_new_id uuid;
begin
  select biaya_poin into v_cost from vouchers where id = p_voucher_id and aktif = true;
  if v_cost is null then
    raise exception 'Voucher tidak ditemukan atau tidak aktif';
  end if;

  select poin into v_poin from profiles where id = p_user_id for update;
  if v_poin < v_cost then
    raise exception 'Poin tidak cukup';
  end if;

  update profiles set poin = poin - v_cost where id = p_user_id;
  insert into point_history (user_id, jumlah, tipe, keterangan)
    values (p_user_id, v_cost, 'tukar', 'Tukar voucher ' || p_voucher_id);

  insert into user_vouchers (user_id, voucher_id) values (p_user_id, p_voucher_id)
    returning id into v_new_id;

  return v_new_id;
end;
$$ language plpgsql security definer;

-- ========== ROW LEVEL SECURITY ==========
alter table profiles enable row level security;
alter table addresses enable row level security;
alter table orders enable row level security;
alter table order_items enable row level security;
alter table wallet_topups enable row level security;
alter table point_history enable row level security;
alter table user_vouchers enable row level security;
alter table products enable row level security;
alter table categories enable row level security;
alter table vouchers enable row level security;

-- Produk, kategori, voucher: boleh dibaca semua orang (termasuk yang belum login)
create policy "products readable by all" on products for select using (true);
create policy "categories readable by all" on categories for select using (true);
create policy "vouchers readable by all" on vouchers for select using (true);

-- Data pribadi: user hanya boleh akses miliknya sendiri
create policy "own profile" on profiles for select using (auth.uid() = id);
create policy "update own profile" on profiles for update using (auth.uid() = id);
create policy "own addresses" on addresses for all using (auth.uid() = user_id);
create policy "own orders" on orders for all using (auth.uid() = user_id);
create policy "own order items" on order_items for select using (
  exists (select 1 from orders where orders.id = order_items.order_id and orders.user_id = auth.uid())
);
create policy "own wallet topups" on wallet_topups for all using (auth.uid() = user_id);
create policy "own point history" on point_history for select using (auth.uid() = user_id);
create policy "own vouchers" on user_vouchers for all using (auth.uid() = user_id);

-- Admin (role='admin' di profiles) boleh kelola produk & kategori
create policy "admin manage products" on products for all using (
  exists (select 1 from profiles where profiles.id = auth.uid() and profiles.role = 'admin')
);
create policy "admin manage categories" on categories for all using (
  exists (select 1 from profiles where profiles.id = auth.uid() and profiles.role = 'admin')
);

-- ========== DATA CONTOH (opsional, boleh dihapus) ==========
insert into categories (nama, icon) values
  ('Minuman', 'coffee'), ('Makanan', 'utensils'), ('Alat Mandi', 'droplet'),
  ('Snack', 'cookie'), ('Kesehatan', 'heart-pulse'), ('Elektronik', 'smartphone');
