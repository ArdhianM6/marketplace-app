"use client";
import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "../../../lib/supabase";
import { addToCart } from "../../../lib/cart";
import { isWishlisted, toggleWishlist } from "../../../lib/wishlist";
import StarRating from "../../../components/StarRating";
import { ArrowLeft, ShoppingBag, Heart, Minus, Plus, MessageSquare } from "lucide-react";

const rupiah = (n) => "Rp" + Number(n).toLocaleString("id-ID");

export default function ProductDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [product, setProduct] = useState(null);
  const [category, setCategory] = useState(null);
  const [qty, setQty] = useState(1);
  const [userId, setUserId] = useState(null);
  const [wishlisted, setWishlisted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [added, setAdded] = useState(false);
  const [reviews, setReviews] = useState([]);

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function load() {
    setLoading(true);
    const [{ data: p }, { data: session }, { data: r }] = await Promise.all([
      supabase.from("products").select("*").eq("id", id).single(),
      supabase.auth.getSession(),
      supabase
        .from("reviews")
        .select("id, rating, komentar, created_at, profiles(nama)")
        .eq("product_id", id)
        .order("created_at", { ascending: false }),
    ]);
    setProduct(p);
    setReviews(r || []);
    if (p?.category_id) {
      const { data: c } = await supabase.from("categories").select("*").eq("id", p.category_id).single();
      setCategory(c);
    }
    const uid = session.session?.user?.id || null;
    setUserId(uid);
    if (uid && p) setWishlisted(await isWishlisted(uid, p.id));
    setLoading(false);
  }

  const avgRating = useMemo(() => {
    if (reviews.length === 0) return 0;
    return reviews.reduce((s, r) => s + r.rating, 0) / reviews.length;
  }, [reviews]);

  const habis = (product?.stok ?? 0) <= 0;
  const maxQty = product?.stok ?? 1;

  const handleToggleWishlist = async () => {
    if (!userId) {
      alert("Login dulu untuk menyimpan produk favorit ya.");
      return;
    }
    try {
      const nowIn = await toggleWishlist(userId, product.id, wishlisted);
      setWishlisted(nowIn);
    } catch (e) {
      alert(e.message || "Gagal memperbarui favorit");
    }
  };

  const handleAddToCart = () => {
    if (habis) return;
    for (let i = 0; i < qty; i++) addToCart(product);
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  };

  if (loading) {
    return (
      <div className="page">
        <div className="skeleton" style={{ height: 240, borderRadius: 24, marginBottom: 16 }} />
        <div className="skeleton" style={{ height: 16, width: "70%", marginBottom: 10 }} />
        <div className="skeleton" style={{ height: 20, width: "40%" }} />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="page">
        <p>Produk tidak ditemukan.</p>
        <Link href="/home" className="btn-primary" style={{ display: "inline-block", marginTop: 12 }}>
          Kembali ke beranda
        </Link>
      </div>
    );
  }

  const diskonPersen =
    product.harga_diskon && product.harga
      ? Math.round(100 - (product.harga_diskon / product.harga) * 100)
      : null;

  return (
    <div className="page" style={{ paddingBottom: 120 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
        <button className="icon-back" onClick={() => router.back()}>
          <ArrowLeft size={20} />
        </button>
        <button
          className={`heart-btn heart-btn-static ${wishlisted ? "active" : ""}`}
          onClick={handleToggleWishlist}
        >
          <Heart size={18} fill={wishlisted ? "currentColor" : "none"} />
        </button>
      </div>

      <div className="product-detail-photo">
        {product.foto_url ? (
          <img src={product.foto_url} alt={product.nama} />
        ) : (
          <ShoppingBag size={64} />
        )}
        {diskonPersen && <span className="badge-discount">-{diskonPersen}%</span>}
      </div>

      {category && (
        <p
          style={{
            margin: "16px 0 4px",
            fontSize: 11.5,
            fontWeight: 700,
            color: "var(--blue)",
            textTransform: "uppercase",
          }}
        >
          {category.nama}
        </p>
      )}
      <h1 style={{ fontSize: 18, margin: "0 0 8px" }}>{product.nama}</h1>

      {reviews.length > 0 && (
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
          <StarRating value={avgRating} readOnly size={15} />
          <span style={{ fontSize: 12.5, fontWeight: 700 }}>{avgRating.toFixed(1)}</span>
          <span style={{ fontSize: 12, color: "var(--ink-soft)" }}>({reviews.length} ulasan)</span>
        </div>
      )}

      <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 4 }}>
        <p style={{ fontSize: 20, fontWeight: 800, color: "var(--blue-deep)", margin: 0 }}>
          {rupiah(product.harga_diskon || product.harga)}
        </p>
        {product.harga_diskon && (
          <p style={{ fontSize: 13, color: "var(--ink-soft)", textDecoration: "line-through", margin: 0 }}>
            {rupiah(product.harga)}
          </p>
        )}
      </div>

      <p
        style={{
          fontSize: 12,
          color: habis ? "var(--coral-deep)" : "var(--mint)",
          fontWeight: 700,
          margin: "0 0 16px",
        }}
      >
        {habis ? "Stok habis" : `Stok tersedia: ${product.stok}`}
      </p>

      <div className="card" style={{ marginBottom: 16 }}>
        <p style={{ margin: "0 0 6px", fontSize: 13, fontWeight: 700 }}>Deskripsi produk</p>
        <p style={{ margin: 0, fontSize: 13, color: "var(--ink-soft)", lineHeight: 1.6 }}>
          {product.deskripsi || "Belum ada deskripsi untuk produk ini."}
        </p>
      </div>

      <div className="section-title" style={{ margin: "0 0 12px" }}>
        <span>Rating & ulasan</span>
      </div>

      {reviews.length === 0 ? (
        <div className="empty-state" style={{ padding: "28px 20px" }}>
          <div className="empty-state-icon" style={{ width: 52, height: 52 }}>
            <MessageSquare size={22} color="var(--blue)" />
          </div>
          <p style={{ margin: 0, fontSize: 12.5 }}>Belum ada ulasan untuk produk ini.</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 16 }}>
          {reviews.map((r) => (
            <div key={r.id} className="card">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                <p style={{ margin: 0, fontSize: 12.5, fontWeight: 700 }}>{r.profiles?.nama || "Pengguna"}</p>
                <span style={{ fontSize: 10.5, color: "var(--ink-soft)" }}>
                  {new Date(r.created_at).toLocaleDateString("id-ID")}
                </span>
              </div>
              <StarRating value={r.rating} readOnly size={13} />
              {r.komentar && (
                <p style={{ margin: "8px 0 0", fontSize: 12.5, color: "var(--ink)", lineHeight: 1.5 }}>{r.komentar}</p>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="product-detail-bar">
        <div className="qty-stepper">
          <button onClick={() => setQty((q) => Math.max(1, q - 1))} disabled={habis}>
            <Minus size={14} />
          </button>
          <span>{qty}</span>
          <button onClick={() => setQty((q) => Math.min(maxQty, q + 1))} disabled={habis || qty >= maxQty}>
            <Plus size={14} />
          </button>
        </div>
        <button className="btn-primary" style={{ flex: 1 }} disabled={habis} onClick={handleAddToCart}>
          {habis ? "Stok habis" : added ? "Ditambahkan ✓" : "Tambah ke keranjang"}
        </button>
      </div>
    </div>
  );
}