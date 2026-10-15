"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "../../../lib/supabase";
import { isFlashSaleActive } from "../../../lib/flashSale";
import { SkeletonBlock } from "../../../components/Skeleton";
import { useToast } from "../../../components/ToastProvider";
import { ArrowLeft, Plus, Pencil, Trash2, ShoppingBag, Zap, Loader2 } from "lucide-react";

const rupiah = (n) => "Rp" + Number(n).toLocaleString("id-ID");

export default function AdminProductsPage() {
  const router = useRouter();
  const toast = useToast();
  const [checking, setChecking] = useState(true);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    init();
  }, []);

  async function init() {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) {
      router.replace("/login");
      return;
    }
    const { data: profile } = await supabase.from("profiles").select("role").eq("id", session.user.id).single();
    if (profile?.role !== "admin") {
      router.replace("/home");
      return;
    }
    setChecking(false);
    load();
  }

  async function load() {
    setLoading(true);
    const { data } = await supabase.from("products").select("*, categories(nama)").order("created_at", { ascending: false });
    setProducts(data || []);
    setLoading(false);
  }

  const remove = async (id) => {
    if (!confirm("Hapus produk ini? Tindakan tidak bisa dibatalkan.")) return;
    setDeletingId(id);
    const { error } = await supabase.from("products").delete().eq("id", id);
    setDeletingId(null);
    if (error) {
      toast.error(error.message || "Gagal menghapus produk.");
      return;
    }
    setProducts((prev) => prev.filter((p) => p.id !== id));
    toast.success("Produk dihapus.");
  };

  if (checking) {
    return (
      <div className="page">
        <SkeletonBlock height={60} radius={16} />
      </div>
    );
  }

  return (
    <div className="page">
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
        <button onClick={() => router.push("/admin")} className="icon-back">
          <ArrowLeft size={16} />
        </button>
        <h1 style={{ fontSize: 17, margin: 0, flex: 1 }}>Kelola produk</h1>
        <Link href="/admin/products/new" className="btn-primary" style={{ padding: "8px 12px", fontSize: 12, display: "flex", alignItems: "center", gap: 4 }}>
          <Plus size={14} /> Tambah
        </Link>
      </div>

      {loading ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {[1, 2, 3].map((i) => (
            <div key={i} className="card">
              <SkeletonBlock height={14} width="60%" style={{ marginBottom: 8 }} />
              <SkeletonBlock height={11} width="40%" />
            </div>
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">
            <ShoppingBag size={26} color="var(--blue)" />
          </div>
          <p style={{ margin: 0, fontWeight: 600 }}>Belum ada produk</p>
          <p style={{ margin: "4px 0 12px", fontSize: 12.5 }}>Tambahkan produk pertamamu.</p>
          <Link href="/admin/products/new" className="btn-primary" style={{ display: "inline-block" }}>
            Tambah produk
          </Link>
        </div>
      ) : (
        products.map((p) => (
          <div key={p.id} className="card" style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 10 }}>
            <div className="order-item-thumb" style={{ width: 48, height: 48 }}>
              {p.foto_url ? <img src={p.foto_url} alt={p.nama} /> : <ShoppingBag size={18} />}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ margin: "0 0 2px", fontSize: 12.5, fontWeight: 700, display: "flex", alignItems: "center", gap: 6 }}>
                {p.nama}
                {isFlashSaleActive(p) && (
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 2, fontSize: 9.5, fontWeight: 800, color: "var(--coral)", background: "var(--coral-soft)", padding: "2px 6px", borderRadius: 6 }}>
                    <Zap size={10} /> Flash sale
                  </span>
                )}
              </p>
              <p style={{ margin: 0, fontSize: 11, color: "var(--ink-soft)" }}>
                {p.categories?.nama || "Tanpa kategori"} · Stok {p.stok} · {rupiah(p.harga_diskon || p.harga)}
              </p>
            </div>
            <div style={{ display: "flex", gap: 6 }}>
              <Link href={`/admin/products/${p.id}`} className="icon-back" style={{ width: 34, height: 34 }}>
                <Pencil size={14} />
              </Link>
              <button
                onClick={() => remove(p.id)}
                disabled={deletingId === p.id}
                className="icon-back"
                style={{ width: 34, height: 34, color: "var(--coral)" }}
              >
                {deletingId === p.id ? <Loader2 size={14} className="spin" /> : <Trash2 size={14} />}
              </button>
            </div>
          </div>
        ))
      )}
    </div>
  );
}