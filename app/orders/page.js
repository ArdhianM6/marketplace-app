"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "../../lib/supabase";
import BottomNav from "../../components/BottomNav";
import { Package, ChevronRight, ShoppingBag } from "lucide-react";

const rupiah = (n) => "Rp" + Number(n).toLocaleString("id-ID");

const STATUS_LABEL = {
  diproses: "Diproses",
  dikirim: "Dikirim",
  selesai: "Selesai",
  batal: "Dibatalkan",
};

export default function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    const { data: session } = await supabase.auth.getSession();
    const uid = session.session?.user?.id;
    if (!uid) {
      setLoading(false);
      return;
    }
    const { data } = await supabase
      .from("orders")
      .select("*, order_items(qty, harga_saat_beli, products(nama, foto_url))")
      .eq("user_id", uid)
      .order("created_at", { ascending: false });
    setOrders(data || []);
    setLoading(false);
  }

  return (
    <div className="page">
      <h1 style={{ fontSize: 17, margin: "0 0 16px" }}>Riwayat pesanan</h1>

      {loading ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {[1, 2, 3].map((i) => (
            <div key={i} className="card">
              <div className="skeleton" style={{ height: 14, width: "40%", marginBottom: 10 }} />
              <div className="skeleton" style={{ height: 48 }} />
            </div>
          ))}
        </div>
      ) : orders.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">
            <ShoppingBag size={26} color="var(--blue)" />
          </div>
          <p style={{ margin: 0, fontWeight: 600 }}>Belum ada pesanan</p>
          <p style={{ margin: "4px 0 0", fontSize: 12.5 }}>Yuk mulai belanja produk favoritmu.</p>
        </div>
      ) : (
        orders.map((o) => {
          const itemCount = o.order_items.reduce((s, it) => s + it.qty, 0);
          const preview = o.order_items.slice(0, 3);
          return (
            <Link key={o.id} href={`/orders/${o.id}`} className="card card-interactive order-card">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <Package size={15} color="var(--blue)" />
                  <span style={{ fontSize: 11.5, color: "var(--ink-soft)" }}>
                    {new Date(o.created_at).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                  </span>
                </div>
                <span className={`order-status-badge order-status-${o.status_order}`}>
                  {STATUS_LABEL[o.status_order] || o.status_order}
                </span>
              </div>

              <div style={{ display: "flex", gap: 6, margin: "10px 0" }}>
                {preview.map((it, idx) => (
                  <div key={idx} className="order-item-thumb">
                    {it.products?.foto_url ? (
                      <img src={it.products.foto_url} alt={it.products?.nama || "Produk"} />
                    ) : (
                      <ShoppingBag size={16} />
                    )}
                  </div>
                ))}
                {o.order_items.length > 3 && (
                  <div className="order-item-thumb" style={{ fontSize: 11, fontWeight: 700, color: "var(--ink-soft)" }}>
                    +{o.order_items.length - 3}
                  </div>
                )}
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <p style={{ margin: 0, fontSize: 11.5, color: "var(--ink-soft)" }}>{itemCount} barang</p>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <p style={{ margin: 0, fontWeight: 800, color: "var(--blue-deep)", fontSize: 13.5 }}>{rupiah(o.total)}</p>
                  <ChevronRight size={15} color="#c3cadd" />
                </div>
              </div>
            </Link>
          );
        })
      )}

      <BottomNav />
    </div>
  );
}