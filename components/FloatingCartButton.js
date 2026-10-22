"use client";
import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { ShoppingCart, X, Minus, Plus, Trash2 } from "lucide-react";
import { getCart, subscribeToCart, updateQty, removeFromCart } from "../lib/cart";
import { useToast } from "./ToastProvider";

const rupiah = (n) => "Rp" + Number(n).toLocaleString("id-ID");

// Halaman-halaman yang tidak perlu tombol keranjang mengambang, supaya
// tidak tumpang tindih dengan halaman yang memang isinya keranjang/checkout
// atau halaman sebelum login.
const HIDDEN_ON = ["/cart", "/login", "/register", "/onboarding", "/", "/admin"];

export default function FloatingCartButton() {
  const router = useRouter();
  const pathname = usePathname();
  const toast = useToast();
  const [cart, setCart] = useState([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setCart(getCart());
    const unsubscribe = subscribeToCart(setCart);
    return unsubscribe;
  }, []);

  // Tutup popup otomatis kalau pindah halaman
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  const change = (id, delta) => setCart(updateQty(id, delta));

  const remove = (id, nama) => {
    setCart(removeFromCart(id));
    toast.info(`${nama} dihapus dari keranjang`);
  };

  const count = cart.reduce((s, i) => s + i.qty, 0);
  const total = cart.reduce((s, i) => s + i.harga * i.qty, 0);

  if (HIDDEN_ON.includes(pathname) || pathname.startsWith("/admin/") || count === 0) return null;

  return (
    <>
      {open && (
        <div
          onClick={() => setOpen(false)}
          style={{ position: "fixed", inset: 0, background: "rgba(15,34,68,0.35)", zIndex: 40 }}
        />
      )}

      <div
        style={{
          position: "fixed", bottom: open ? 0 : 88, right: open ? 0 : 18, left: open ? 0 : "auto",
          zIndex: 50, transition: "all 0.2s ease",
          maxWidth: open ? 480 : "auto", margin: open ? "0 auto" : 0,
        }}
      >
        {open && (
          <div
            style={{
              background: "#fff", borderRadius: "20px 20px 0 0", padding: 16,
              boxShadow: "0 -8px 24px rgba(15,46,115,0.15)", maxHeight: "65vh", overflowY: "auto",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <p style={{ margin: 0, fontSize: 14, fontWeight: 700 }}>Keranjang ({count} barang)</p>
              <button onClick={() => setOpen(false)} style={{ background: "none", border: "none" }}>
                <X size={18} />
              </button>
            </div>

            {cart.length === 0 ? (
              <p style={{ fontSize: 12.5, color: "var(--ink-soft)", textAlign: "center", padding: "20px 0" }}>
                Keranjang kosong
              </p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 14 }}>
                {cart.map((i) => (
                  <div key={i.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ margin: "0 0 2px", fontSize: 12.5, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {i.nama}
                      </p>
                      <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: "var(--blue-deep)" }}>{rupiah(i.harga)}</p>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
                      <button
                        onClick={() => change(i.id, -1)}
                        aria-label={`Kurangi ${i.nama}`}
                        style={{ width: 24, height: 24, borderRadius: 6, border: "1px solid var(--line)", background: "#fff" }}
                      >
                        <Minus size={11} />
                      </button>
                      <span style={{ fontSize: 12, fontWeight: 700, minWidth: 14, textAlign: "center" }}>{i.qty}</span>
                      <button
                        onClick={() => change(i.id, 1)}
                        aria-label={`Tambah ${i.nama}`}
                        style={{ width: 24, height: 24, borderRadius: 6, border: "none", background: "var(--blue)", color: "#fff" }}
                      >
                        <Plus size={11} />
                      </button>
                    </div>
                    <button
                      onClick={() => remove(i.id, i.nama)}
                      aria-label={`Hapus ${i.nama} dari keranjang`}
                      style={{ background: "none", border: "none", padding: 4, flexShrink: 0 }}
                    >
                      <Trash2 size={15} color="#c4342f" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12, paddingTop: 10, borderTop: "1px solid var(--line)" }}>
              <span style={{ fontSize: 13, fontWeight: 700 }}>Subtotal</span>
              <span style={{ fontSize: 14, fontWeight: 800, color: "var(--blue-deep)" }}>{rupiah(total)}</span>
            </div>

            <button
              className="btn-primary"
              style={{ width: "100%" }}
              disabled={cart.length === 0}
              onClick={() => router.push("/cart")}
            >
              Lanjutkan
            </button>
          </div>
        )}

        {!open && (
          <button
            onClick={() => setOpen(true)}
            aria-label={`Buka ringkasan keranjang, ${count} barang`}
            style={{
              width: 56, height: 56, borderRadius: "50%", background: "var(--blue)", border: "none",
              display: "flex", alignItems: "center", justifyContent: "center", position: "relative",
              boxShadow: "0 10px 22px rgba(47,111,237,0.4)", cursor: "pointer",
            }}
          >
            <ShoppingCart size={22} color="#fff" />
            <span
              style={{
                position: "absolute", top: -4, right: -4, background: "var(--coral)", color: "#fff",
                fontSize: 10, fontWeight: 800, borderRadius: 10, minWidth: 18, height: 18,
                display: "flex", alignItems: "center", justifyContent: "center", padding: "0 4px",
                border: "2px solid #fff",
              }}
            >
              {count > 99 ? "99+" : count}
            </span>
          </button>
        )}
      </div>
    </>
  );
}
