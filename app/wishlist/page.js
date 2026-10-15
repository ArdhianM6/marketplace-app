"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "../../lib/supabase";
import { addToCart } from "../../lib/cart";
import { toggleWishlist } from "../../lib/wishlist";
import BottomNav from "../../components/BottomNav";
import ProductCard from "../../components/ProductCard";
import { Heart } from "lucide-react";

export default function WishlistPage() {
  const [userId, setUserId] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    const { data: session } = await supabase.auth.getSession();
    const uid = session.session?.user?.id || null;
    setUserId(uid);
    if (!uid) {
      setLoading(false);
      return;
    }
    const { data } = await supabase
      .from("wishlists")
      .select("product_id, products(*)")
      .eq("user_id", uid)
      .order("created_at", { ascending: false });
    setProducts((data || []).map((w) => w.products).filter(Boolean));
    setLoading(false);
  }

  const handleRemove = async (p) => {
    try {
      await toggleWishlist(userId, p.id, true);
      setProducts((prev) => prev.filter((item) => item.id !== p.id));
    } catch (e) {
      alert(e.message || "Gagal menghapus favorit");
    }
  };

  const handleAddToCart = (p) => {
    if ((p.stok ?? 0) <= 0) return;
    addToCart(p);
  };

  return (
    <div className="page">
      <h1 style={{ fontSize: 17, margin: "0 0 16px" }}>Produk favorit</h1>

      {loading ? (
        <div className="product-grid">
          {[1, 2].map((i) => (
            <div key={i} className="card">
              <div className="skeleton" style={{ height: 90, borderRadius: 16, marginBottom: 8 }} />
              <div className="skeleton" style={{ height: 12, width: "80%" }} />
            </div>
          ))}
        </div>
      ) : !userId ? (
        <div className="empty-state">
          <div className="empty-state-icon">
            <Heart size={26} color="var(--blue)" />
          </div>
          <p style={{ margin: 0, fontWeight: 600 }}>Login dulu, yuk</p>
          <p style={{ margin: "4px 0 12px", fontSize: 12.5 }}>Masuk untuk melihat produk favoritmu.</p>
          <Link href="/login" className="btn-primary" style={{ display: "inline-block" }}>
            Masuk
          </Link>
        </div>
      ) : products.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">
            <Heart size={26} color="var(--blue)" />
          </div>
          <p style={{ margin: 0, fontWeight: 600 }}>Belum ada favorit</p>
          <p style={{ margin: "4px 0 0", fontSize: 12.5 }}>
            Ketuk ikon hati di produk untuk menyimpannya di sini.
          </p>
        </div>
      ) : (
        <div className="product-grid">
          {products.map((p) => (
            <ProductCard
              key={p.id}
              product={p}
              wishlisted={true}
              onToggleWishlist={handleRemove}
              onAddToCart={handleAddToCart}
            />
          ))}
        </div>
      )}

      <BottomNav />
    </div>
  );
}