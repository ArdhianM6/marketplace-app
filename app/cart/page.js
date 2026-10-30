"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getCart, updateQty, removeFromCart, clearCart } from "../../lib/cart";
import { supabase } from "../../lib/supabase";
import BottomNav from "../../components/BottomNav";
import { useToast } from "../../components/ToastProvider";
import { getDistanceKm, getShippingOptions, availableSlotsForToday, TIME_SLOTS, slotToTimestamp } from "../../lib/shipping";
import { MapPin, Smartphone, Landmark, Wallet, Minus, Plus, ShoppingCart, Plus as PlusIcon, Trash2, Zap, Clock, Leaf, CalendarClock, TicketPercent, X, Check, ArrowRight, ShieldCheck, ChevronDown, Search } from "lucide-react";

const rupiah = (n) => "Rp" + Number(n).toLocaleString("id-ID");

const SHIPPING_ICONS = { fast: Zap, normal: Clock, santai: Leaf, jadwal: CalendarClock };

export default function CartPage() {
  const router = useRouter();
  const toast = useToast();
  const [cart, setCart] = useState([]);
  const [metode, setMetode] = useState("ewallet");
  const [addressId, setAddressId] = useState(null);
  const [addresses, setAddresses] = useState([]);
  const [shippingId, setShippingId] = useState("normal");
  const [scheduleDay, setScheduleDay] = useState("today");
  const [scheduleSlot, setScheduleSlot] = useState(null);
  const [loading, setLoading] = useState(false);
  const [vouchers, setVouchers] = useState([]);
  const [voucherId, setVoucherId] = useState("");
  const [receiptOpen, setReceiptOpen] = useState(false);
  const [addressPickerOpen, setAddressPickerOpen] = useState(false);
  const [voucherPickerOpen, setVoucherPickerOpen] = useState(false);
  const [addressSearch, setAddressSearch] = useState("");
  const [saldo, setSaldo] = useState(null);

  const loadAddresses = () => {
    supabase.from("addresses").select("*").then(({ data }) => {
      setAddresses(data || []);
      const def = data?.find((a) => a.is_default) || data?.[0];
      if (def) setAddressId(def.id);
    });
  };

  const loadCheckoutData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const [{ data: voucherRows }, { data: profile }] = await Promise.all([
      supabase.from("user_vouchers").select("id, expires_at, vouchers(id, judul, tipe, nilai)").eq("user_id", user.id).eq("status", "available").is("reserved_order_id", null),
      supabase.from("profiles").select("saldo").eq("id", user.id).single(),
    ]);
    const now = Date.now();
    setVouchers((voucherRows || []).filter((v) => v.vouchers && (!v.expires_at || new Date(v.expires_at).getTime() > now)));
    setSaldo(profile?.saldo ?? null);
  };

  useEffect(() => {
    setCart(getCart());
    loadAddresses();
    loadCheckoutData();
  }, []);

  useEffect(() => {
    if (!receiptOpen && !addressPickerOpen && !voucherPickerOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKeyDown = (event) => {
      if (event.key === "Escape" && !loading) {
        setReceiptOpen(false);
        setAddressPickerOpen(false);
        setVoucherPickerOpen(false);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [receiptOpen, addressPickerOpen, voucherPickerOpen, loading]);

  const change = (id, delta) => setCart(updateQty(id, delta));

  const remove = (id, nama) => {
    setCart(removeFromCart(id));
    toast.info(`${nama} dihapus dari keranjang`);
  };

  const selectedAddress = addresses.find((a) => a.id === addressId);
  const filteredAddresses = addresses.filter((address) =>
    `${address.label} ${address.penerima} ${address.alamat_lengkap} ${address.kota}`.toLowerCase().includes(addressSearch.toLowerCase())
  );
  const distanceKm = useMemo(() => getDistanceKm(selectedAddress), [selectedAddress]);
  const shippingOptions = useMemo(() => getShippingOptions(distanceKm), [distanceKm]);
  const chosenShipping = shippingOptions.find((o) => o.id === shippingId) || shippingOptions[1];

  const todaySlots = availableSlotsForToday();

  const subtotal = cart.reduce((s, i) => s + i.harga * i.qty, 0);
  const ongkir = cart.length ? chosenShipping.price : 0;
  const selectedVoucher = vouchers.find((v) => v.id === voucherId);
  const voucherDiscount = useMemo(() => {
    if (!selectedVoucher?.vouchers) return 0;
    const voucher = selectedVoucher.vouchers;
    if (voucher.tipe === "gratis_ongkir") return ongkir;
    if (voucher.tipe === "persen") return Math.min(subtotal, Math.floor(subtotal * Number(voucher.nilai) / 100));
    return Math.min(subtotal, Number(voucher.nilai) || 0);
  }, [selectedVoucher, subtotal, ongkir]);
  const total = Math.max(0, subtotal + ongkir - voucherDiscount);

  const paymentOptions = [
    { id: "ewallet", label: "E-Wallet", detail: "QRIS, GoPay, ShopeePay", icon: Smartphone },
    { id: "bank", label: "Transfer bank", detail: "Virtual account", icon: Landmark },
    { id: "saldo", label: "Saldo PasarKita", detail: saldo == null ? "Bayar dari saldo" : `Tersedia ${rupiah(saldo)}`, icon: Wallet },
  ];

  const openReceipt = () => {
    if (!addressId) {
      toast.error("Tambahkan alamat pengiriman dulu.");
      return;
    }
    if (shippingId === "jadwal" && !scheduleSlot) {
      toast.error("Pilih jam pengiriman dulu.");
      return;
    }
    if (metode === "saldo" && saldo != null && saldo < total) {
      toast.error("Saldo belum cukup. Pilih metode pembayaran lain atau isi saldo.");
      return;
    }
    setReceiptOpen(true);
  };

  const checkout = async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error("Sesi login berakhir. Silakan masuk kembali.");
        return;
      }
      const jadwalKirim = shippingId === "jadwal" ? slotToTimestamp(scheduleDay, scheduleSlot) : null;
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({ items: cart, addressId, metode, metodePengiriman: shippingId, jadwalKirim, userVoucherId: voucherId || null }),
      });
      const data = await res.json();
      if (data.error) {
        toast.error(data.error);
        return;
      }
      if (data.redirectUrl) {
        clearCart();
        setReceiptOpen(false);
        window.location.href = data.redirectUrl;
      } else if (data.order) {
        clearCart();
        setReceiptOpen(false);
        toast.success("Pesanan berhasil dibuat!");
        router.push(`/orders/${data.order.id}`);
      }
    } catch {
      toast.error("Checkout belum berhasil. Periksa koneksi dan coba lagi.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page">
      <h1 style={{ fontSize: 17, margin: "0 0 8px" }}>Keranjang saya</h1>
      <div style={{
        display: "inline-flex", alignItems: "center", gap: 6, background: "#e6faf3", color: "#0f8f5f",
        fontSize: 11, fontWeight: 700, padding: "6px 10px", borderRadius: 10, marginBottom: 16,
      }}>
        ⚡ Pilih kecepatan pengiriman sesuai kebutuhanmu
      </div>

      <div className="card" style={{ display: "flex", gap: 10, marginBottom: 8 }}>
        <MapPin size={18} color="var(--blue)" style={{ flexShrink: 0, marginTop: 2 }} />
        <div style={{ flex: 1 }}>
          <p style={{ margin: "0 0 4px", fontSize: 12, fontWeight: 700 }}>Alamat pengiriman</p>
          {selectedAddress ? (
            <button type="button" className="checkout-address-trigger" onClick={() => setAddressPickerOpen(true)}>
              <span><strong>{selectedAddress.label}</strong>{selectedAddress.is_default && <small>Alamat utama</small>}<span>{selectedAddress.alamat_lengkap}, {selectedAddress.kota}</span></span>
              <span className="checkout-change">Ubah <ChevronDown size={14} /></span>
            </button>
          ) : addresses.length > 0 ? (
            <button type="button" className="checkout-address-trigger" onClick={() => setAddressPickerOpen(true)}>
              <span><strong>Pilih alamat pengiriman</strong><span>{addresses.length} alamat tersimpan</span></span><ChevronDown size={16} />
            </button>
          ) : (
            <p style={{ fontSize: 11.5, color: "var(--ink-soft)", margin: 0 }}>Belum ada alamat tersimpan.</p>
          )}
        </div>
      </div>

      <Link
        href="/addresses/new"
        style={{
          display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
          fontSize: 12, fontWeight: 700, color: "var(--blue)", padding: "8px 0", marginBottom: 14,
        }}
      >
        <PlusIcon size={14} /> Tambah alamat baru pakai lokasi saat ini
      </Link>

      {cart.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">
            <ShoppingCart size={28} color="#a7b0c6" />
          </div>
          <p style={{ fontSize: 13 }}>Keranjang masih kosong</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 20 }}>
          {cart.map((i) => (
            <div key={i.id} className="card" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <p style={{ fontWeight: 600, fontSize: 12.5, margin: "0 0 2px" }}>{i.nama}</p>
                <p style={{ fontWeight: 800, color: "var(--blue-deep)", margin: 0 }}>{rupiah(i.harga)}</p>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <button onClick={() => change(i.id, -1)} style={{ width: 24, height: 24, borderRadius: 6, border: "1px solid var(--line)", background: "#fff" }}>
                    <Minus size={11} />
                  </button>
                  <span style={{ fontSize: 12, fontWeight: 700 }}>{i.qty}</span>
                  <button onClick={() => change(i.id, 1)} style={{ width: 24, height: 24, borderRadius: 6, border: "none", background: "var(--blue)", color: "#fff" }}>
                    <Plus size={11} />
                  </button>
                </div>
                <button
                  onClick={() => remove(i.id, i.nama)}
                  aria-label={`Hapus ${i.nama} dari keranjang`}
                  style={{ background: "none", border: "none", padding: 4 }}
                >
                  <Trash2 size={16} color="#c4342f" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <p style={{ fontSize: 13, fontWeight: 700, margin: "0 0 10px" }}>Metode pengiriman</p>
      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 16 }}>
        {shippingOptions.map((opt) => {
          const Icon = SHIPPING_ICONS[opt.id];
          const active = shippingId === opt.id;
          return (
            <button
              key={opt.id}
              onClick={() => setShippingId(opt.id)}
              style={{
                display: "flex", alignItems: "center", gap: 10, padding: "12px 14px", textAlign: "left",
                borderRadius: 14, cursor: "pointer",
                border: active ? "1.5px solid var(--blue)" : "1px solid var(--line)",
                background: active ? "#eaf1ff" : "#fff",
              }}
            >
              <div style={{
                width: 36, height: 36, borderRadius: 10, flexShrink: 0, display: "flex",
                alignItems: "center", justifyContent: "center", background: active ? "var(--blue)" : "#eaf1ff",
              }}>
                <Icon size={17} color={active ? "#fff" : "var(--blue)"} />
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ margin: "0 0 2px", fontSize: 12.5, fontWeight: 700, color: "var(--ink)" }}>{opt.label}</p>
                <p style={{ margin: 0, fontSize: 10.5, color: "var(--ink-soft)" }}>{opt.desc}</p>
              </div>
              <p style={{ margin: 0, fontSize: 12.5, fontWeight: 800, color: opt.price === 0 ? "var(--mint)" : "var(--blue-deep)" }}>
                {opt.price === 0 ? "Gratis" : rupiah(opt.price)}
              </p>
            </button>
          );
        })}
      </div>

      {shippingId === "jadwal" && (
        <div className="card" style={{ marginBottom: 16 }}>
          <p style={{ margin: "0 0 10px", fontSize: 12.5, fontWeight: 700 }}>Pilih hari & jam kedatangan</p>
          <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
            {[
              { id: "today", label: "Hari ini" },
              { id: "tomorrow", label: "Besok" },
            ].map((d) => (
              <button
                key={d.id}
                onClick={() => {
                  setScheduleDay(d.id);
                  setScheduleSlot(null);
                }}
                style={{
                  flex: 1, padding: "8px 0", borderRadius: 10, fontSize: 12, fontWeight: 700,
                  border: scheduleDay === d.id ? "1.5px solid var(--blue)" : "1px solid var(--line)",
                  background: scheduleDay === d.id ? "#eaf1ff" : "#fff",
                  color: scheduleDay === d.id ? "var(--blue)" : "var(--ink-soft)",
                }}
              >
                {d.label}
              </button>
            ))}
          </div>

          {scheduleDay === "today" && todaySlots.length === 0 ? (
            <p style={{ fontSize: 11.5, color: "var(--coral)", margin: 0 }}>
              Slot hari ini sudah tutup (pengiriman terakhir jam 20:00). Pilih "Besok" ya.
            </p>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              {(scheduleDay === "today" ? todaySlots : TIME_SLOTS).map((slot) => (
                <button
                  key={slot}
                  onClick={() => setScheduleSlot(slot)}
                  style={{
                    padding: "8px 4px", borderRadius: 10, fontSize: 11.5, fontWeight: 700,
                    border: scheduleSlot === slot ? "1.5px solid var(--blue)" : "1px solid var(--line)",
                    background: scheduleSlot === slot ? "#eaf1ff" : "#fff",
                    color: scheduleSlot === slot ? "var(--blue)" : "var(--ink-soft)",
                  }}
                >
                  {slot}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      <p style={{ fontSize: 13, fontWeight: 700, margin: "4px 0 10px" }}>Metode pembayaran</p>
      <div className="checkout-payment-options">
        {paymentOptions.map(({ id, label, detail, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setMetode(id)}
            className={`checkout-payment-option ${metode === id ? "selected" : ""}`}
            aria-pressed={metode === id}
          >
            <span className="checkout-payment-icon"><Icon size={19} /></span>
            <span className="checkout-payment-copy"><strong>{label}</strong><small>{detail}</small></span>
            <span className="checkout-radio">{metode === id && <Check size={13} />}</span>
          </button>
        ))}
      </div>

      <div className="checkout-voucher card">
        <div className="checkout-voucher-heading"><span className="checkout-voucher-icon"><TicketPercent size={18} /></span><span><strong>Pakai voucher</strong><small>{vouchers.length ? `${vouchers.length} voucher tersedia` : "Voucher belanja kamu"}</small></span></div>
        <button type="button" className={`checkout-voucher-trigger ${selectedVoucher ? "is-applied" : ""}`} onClick={() => setVoucherPickerOpen(true)}>
          <span className="checkout-voucher-ticket"><TicketPercent size={17} /></span>
          <span><strong>{selectedVoucher ? selectedVoucher.vouchers.judul : "Pilih voucher"}</strong><small>{selectedVoucher ? "Voucher diterapkan pada pesanan ini" : vouchers.length ? `${vouchers.length} voucher siap digunakan` : "Lihat voucher yang tersedia"}</small></span>
          <ChevronDown size={16} />
        </button>
        {selectedVoucher && <p className="checkout-voucher-applied"><Check size={14} /> Hemat {rupiah(voucherDiscount)} dari {selectedVoucher.vouchers.judul}</p>}
      </div>

      <div className="card">
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6, fontSize: 12 }}>
          <span style={{ color: "var(--ink-soft)" }}>Subtotal</span>
          <span>{rupiah(subtotal)}</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6, fontSize: 12 }}>
          <span style={{ color: "var(--ink-soft)" }}>Ongkos kirim ({chosenShipping.label})</span>
          <span>{ongkir === 0 ? "Gratis" : rupiah(ongkir)}</span>
        </div>
        {selectedVoucher && <div className="checkout-total-row discount"><span>Voucher · {selectedVoucher.vouchers.judul}</span><span>− {rupiah(voucherDiscount)}</span></div>}
        <div style={{ height: 1, background: "var(--line)", margin: "8px 0" }} />
        <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 800 }}>
          <span>Total</span>
          <span style={{ color: "var(--blue-deep)" }}>{rupiah(total)}</span>
        </div>
      </div>

      <button className="btn-primary checkout-continue" style={{ width: "100%", marginTop: 14 }} onClick={openReceipt} disabled={loading || !cart.length}>
        Lanjut ke pembayaran <ArrowRight size={17} />
      </button>

      {receiptOpen && <div className="checkout-modal-backdrop" onClick={() => !loading && setReceiptOpen(false)}><section className="checkout-modal" role="dialog" aria-modal="true" aria-labelledby="receipt-title" onClick={(e) => e.stopPropagation()}><button className="checkout-modal-close" onClick={() => setReceiptOpen(false)} aria-label="Tutup" disabled={loading}><X size={19} /></button><div className="receipt-success-icon"><ShieldCheck size={24} /></div><span className="receipt-eyebrow">RINGKASAN PESANAN</span><h2 id="receipt-title">Periksa sebelum membayar</h2><p className="receipt-address"><MapPin size={15} /> {selectedAddress?.label || "Alamat"} · {selectedAddress?.alamat_lengkap || "Alamat pengiriman"}</p><div className="receipt-items">{cart.map((item) => <div className="receipt-item" key={item.id}><span>{item.nama}<small>{item.qty} × {rupiah(item.harga)}</small></span><strong>{rupiah(item.harga * item.qty)}</strong></div>)}</div><div className="receipt-totals"><div><span>Subtotal barang</span><strong>{rupiah(subtotal)}</strong></div><div><span>Ongkos kirim · {chosenShipping.label}</span><strong>{ongkir ? rupiah(ongkir) : "Gratis"}</strong></div>{selectedVoucher && <div className="discount"><span>Potongan voucher</span><strong>− {rupiah(voucherDiscount)}</strong></div>}<div className="receipt-grand-total"><span>Total pembayaran</span><strong>{rupiah(total)}</strong></div></div><div className="receipt-method"><span className="checkout-payment-icon">{metode === "ewallet" ? <Smartphone size={18} /> : metode === "bank" ? <Landmark size={18} /> : <Wallet size={18} />}</span><span><small>Metode pembayaran</small><strong>{paymentOptions.find((item) => item.id === metode)?.label}</strong></span>{metode === "saldo" && saldo != null && <small>Saldo {rupiah(saldo)}</small>}</div><button className="btn-primary receipt-pay" onClick={checkout} disabled={loading}>{loading ? "Memproses pesanan…" : <>Konfirmasi & bayar {rupiah(total)} <ArrowRight size={17} /></>}</button><button className="receipt-edit" onClick={() => setReceiptOpen(false)} disabled={loading}>Kembali, ubah pesanan</button></section></div>}

      {addressPickerOpen && (
        <div className="checkout-modal-backdrop picker-backdrop" onClick={() => setAddressPickerOpen(false)}>
          <section className="checkout-picker" role="dialog" aria-modal="true" aria-labelledby="address-picker-title" onClick={(event) => event.stopPropagation()}>
            <div className="picker-grab" />
            <div className="picker-heading"><span className="picker-heading-icon address"><MapPin size={19} /></span><div><h2 id="address-picker-title">Pilih alamat</h2><p>Tentukan tujuan pengiriman pesananmu.</p></div><button className="checkout-modal-close" onClick={() => setAddressPickerOpen(false)} aria-label="Tutup"><X size={18} /></button></div>
            <label className="picker-search"><Search size={16} /><input value={addressSearch} onChange={(event) => setAddressSearch(event.target.value)} placeholder="Cari nama atau kota" /></label>
            <div className="picker-options address-options">
              {filteredAddresses.map((address) => <button type="button" key={address.id} className={`picker-option address-option ${addressId === address.id ? "selected" : ""}`} onClick={() => { setAddressId(address.id); setAddressPickerOpen(false); setAddressSearch(""); }}><span className="picker-option-icon"><MapPin size={17} /></span><span className="picker-option-copy"><strong>{address.label}{address.is_default && <em>Utama</em>}</strong><small>{address.penerima} · {address.no_hp}</small><span>{address.alamat_lengkap}, {address.kota}{address.kode_pos ? ` ${address.kode_pos}` : ""}</span></span><span className="picker-check">{addressId === address.id && <Check size={14} />}</span></button>)}
              {filteredAddresses.length === 0 && <div className="picker-empty"><MapPin size={23} /><strong>Alamat tidak ditemukan</strong><span>Coba kata kunci lain.</span></div>}
            </div>
            <Link href="/addresses/new" className="picker-add-address" onClick={() => setAddressPickerOpen(false)}><PlusIcon size={16} /> Tambah alamat baru</Link>
          </section>
        </div>
      )}

      {voucherPickerOpen && (
        <div className="checkout-modal-backdrop picker-backdrop" onClick={() => setVoucherPickerOpen(false)}>
          <section className="checkout-picker voucher-picker" role="dialog" aria-modal="true" aria-labelledby="voucher-picker-title" onClick={(event) => event.stopPropagation()}>
            <div className="picker-grab" />
            <div className="picker-heading"><span className="picker-heading-icon voucher"><TicketPercent size={19} /></span><div><h2 id="voucher-picker-title">Voucher kamu</h2><p>Pilih satu untuk mengurangi total belanja.</p></div><button className="checkout-modal-close" onClick={() => setVoucherPickerOpen(false)} aria-label="Tutup"><X size={18} /></button></div>
            <div className="picker-options voucher-options">
              <button type="button" className={`voucher-option ${!voucherId ? "selected" : ""}`} onClick={() => { setVoucherId(""); setVoucherPickerOpen(false); }}><span className="voucher-ticket muted"><X size={16} /></span><span className="picker-option-copy"><strong>Tanpa voucher</strong><small>Lanjutkan tanpa potongan</small></span><span className="picker-check">{!voucherId && <Check size={14} />}</span></button>
              {vouchers.map((voucher) => { const info = voucher.vouchers; const label = info.tipe === "persen" ? `Diskon ${info.nilai}%` : info.tipe === "gratis_ongkir" ? "Gratis ongkos kirim" : `Potongan ${rupiah(info.nilai)}`; const active = voucherId === voucher.id; return <button type="button" key={voucher.id} className={`voucher-option ${active ? "selected" : ""}`} onClick={() => { setVoucherId(voucher.id); setVoucherPickerOpen(false); }}><span className="voucher-ticket"><TicketPercent size={17} /></span><span className="picker-option-copy"><strong>{info.judul}</strong><small>{label}{voucher.expires_at ? ` · Berlaku sampai ${new Date(voucher.expires_at).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}` : ""}</small></span><span className="picker-check">{active && <Check size={14} />}</span></button>; })}
              {vouchers.length === 0 && <div className="picker-empty"><TicketPercent size={23} /><strong>Belum ada voucher tersedia</strong><span>Voucher aktif akan muncul di sini.</span></div>}
            </div>
          </section>
        </div>
      )}

      <BottomNav />
    </div>
  );
}
