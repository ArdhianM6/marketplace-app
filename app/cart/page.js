"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getCart, updateQty, removeFromCart, clearCart } from "../../lib/cart";
import { supabase } from "../../lib/supabase";
import BottomNav from "../../components/BottomNav";
import { useToast } from "../../components/ToastProvider";
import { getDistanceKm, getShippingOptions, availableSlotsForToday, TIME_SLOTS, slotToTimestamp } from "../../lib/shipping";
import { MapPin, Smartphone, Landmark, Wallet, Minus, Plus, ShoppingCart, Plus as PlusIcon, Trash2, Zap, Clock, Leaf, CalendarClock } from "lucide-react";

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

  const loadAddresses = () => {
    supabase.from("addresses").select("*").then(({ data }) => {
      setAddresses(data || []);
      const def = data?.find((a) => a.is_default) || data?.[0];
      if (def) setAddressId(def.id);
    });
  };

  useEffect(() => {
    setCart(getCart());
    loadAddresses();
  }, []);

  const change = (id, delta) => setCart(updateQty(id, delta));

  const remove = (id, nama) => {
    setCart(removeFromCart(id));
    toast.info(`${nama} dihapus dari keranjang`);
  };

  const selectedAddress = addresses.find((a) => a.id === addressId);
  const distanceKm = useMemo(() => getDistanceKm(selectedAddress), [selectedAddress]);
  const shippingOptions = useMemo(() => getShippingOptions(distanceKm), [distanceKm]);
  const chosenShipping = shippingOptions.find((o) => o.id === shippingId) || shippingOptions[1];

  const todaySlots = availableSlotsForToday();

  const subtotal = cart.reduce((s, i) => s + i.harga * i.qty, 0);
  const ongkir = cart.length ? chosenShipping.price : 0;
  const total = subtotal + ongkir;

  const paymentOptions = [
    { id: "ewallet", label: "E-Wallet", icon: Smartphone },
    { id: "bank", label: "Bank", icon: Landmark },
    { id: "saldo", label: "Saldo", icon: Wallet },
  ];

  const checkout = async () => {
    if (!addressId) {
      toast.error("Tambahkan alamat pengiriman dulu.");
      return;
    }
    if (shippingId === "jadwal" && !scheduleSlot) {
      toast.error("Pilih jam pengiriman dulu.");
      return;
    }

    setLoading(true);
    const {
      data: { session },
    } = await supabase.auth.getSession();

    const jadwalKirim = shippingId === "jadwal" ? slotToTimestamp(scheduleDay, scheduleSlot) : null;

    const res = await fetch("/api/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${session?.access_token}` },
      body: JSON.stringify({ items: cart, addressId, metode, metodePengiriman: shippingId, jadwalKirim }),
    });
    const data = await res.json();
    setLoading(false);

    if (data.error) {
      toast.error(data.error);
      return;
    }

    if (data.redirectUrl) {
      clearCart();
      window.location.href = data.redirectUrl;
    } else if (data.order) {
      clearCart();
      toast.success("Pesanan berhasil dibuat!");
      router.push(`/orders/${data.order.id}`);
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
          {addresses.length > 0 ? (
            <select
              value={addressId || ""}
              onChange={(e) => setAddressId(e.target.value)}
              style={{ width: "100%", border: "none", fontSize: 11.5, color: "var(--ink-soft)", padding: 0 }}
            >
              {addresses.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.label} — {a.alamat_lengkap}
                </option>
              ))}
            </select>
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
      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        {paymentOptions.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setMetode(id)}
            style={{
              flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 6, padding: "10px 4px",
              borderRadius: 12, cursor: "pointer",
              border: metode === id ? "1.5px solid var(--blue)" : "1px solid var(--line)",
              background: metode === id ? "#eaf1ff" : "#fff",
            }}
          >
            <Icon size={17} color={metode === id ? "var(--blue)" : "var(--ink-soft)"} />
            <span style={{ fontSize: 10.5, fontWeight: 700, color: metode === id ? "var(--blue)" : "var(--ink-soft)" }}>{label}</span>
          </button>
        ))}
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
        <div style={{ height: 1, background: "var(--line)", margin: "8px 0" }} />
        <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 800 }}>
          <span>Total</span>
          <span style={{ color: "var(--blue-deep)" }}>{rupiah(total)}</span>
        </div>
      </div>

      <button className="btn-primary" style={{ width: "100%", marginTop: 14 }} onClick={checkout} disabled={loading || !cart.length}>
        {loading ? "Memproses..." : "Bayar sekarang"}
      </button>

      <BottomNav />
    </div>
  );
}