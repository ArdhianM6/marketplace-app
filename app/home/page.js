"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { supabase } from "../../lib/supabase";
import { addToCart } from "../../lib/cart";
import { useToast } from "../../components/ToastProvider";
import { getWishlistIds, toggleWishlist } from "../../lib/wishlist";
import { isFlashSaleActive } from "../../lib/flashSale";
import BottomNav from "../../components/BottomNav";
import ProductCard from "../../components/ProductCard";
import NotificationBell from "../../components/NotificationBell";
import ExpiryBanner from "../../components/ExpiryBanner";
import {
  Search,
  ShoppingBag,
  Coffee,
  UtensilsCrossed,
  Droplets,
  Cookie,
  HeartPulse,
  Smartphone,
  Gift,
  X,
  Zap,
  LayoutDashboard,
} from "lucide-react";

const CATEGORY_ICONS = {
  minuman: Coffee,
  makanan: UtensilsCrossed,
  "alat mandi": Droplets,
  snack: Cookie,
  kesehatan: HeartPulse,
  elektronik: Smartphone,
};

export default function HomePage() {
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [name, setName] = useState("");
  const [userId, setUserId] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [wishlistIds, setWishlistIds] = useState([]);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    const [{ data: cats }, { data: prods }, { data: session }] = await Promise.all([
      supabase.from("categories").select("*"),
      supabase.from("products").select("*").order("created_at", { ascending: false }),
      supabase.auth.getSession(),
    ]);
    setCategories(cats || []);
    setProducts(prods || []);
    const uid = session.session?.user?.id || null;
    if (uid) {
      const { data: profile } = await supabase.from("profiles").select("role").eq("id", uid).maybeSingle();
      setIsAdmin(profile?.role === "admin");
    }
    setUserId(uid);
    setName(
      session.session?.user?.user_metadata?.full_name ||
        session.session?.user?.email?.split("@")[0] ||
        ""
    );
    if (uid) setWishlistIds(await getWishlistIds(uid));
    setLoading(false);
  }

  const handleAddToCart = (p) => {
    if ((p.stok ?? 0) <= 0) return;
    addToCart(p);
  };

  const handleToggleWishlist = async (p) => {
    if (!userId) {
      alert("Login dulu untuk menyimpan produk favorit ya.");
      return;
    }
    const currentlyIn = wishlistIds.includes(p.id);
    try {
      const nowIn = await toggleWishlist(userId, p.id, currentlyIn);
      setWishlistIds((prev) => (nowIn ? [...prev, p.id] : prev.filter((id) => id !== p.id)));
    } catch (e) {
      alert(e.message || "Gagal memperbarui favorit");
    }
  };

  const flashSaleProducts = useMemo(() => products.filter(isFlashSaleActive), [products]);
  const discountedProducts = useMemo(() => products.filter((p) => p.harga_diskon), [products]);

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchSearch =
        search.trim() === "" || p.nama?.toLowerCase().includes(search.trim().toLowerCase());
      const matchCategory = !selectedCategory || p.category_id === selectedCategory;
      return matchSearch && matchCategory;
    });
  }, [products, search, selectedCategory]);

  const isSearching = search.trim() !== "" || !!selectedCategory;

  return (
    <div className="page">
      <div className="topbar">
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div className="avatar">{name.slice(0, 2).toUpperCase() || "US"}</div>
          <div>
            <p style={{ margin: 0, fontSize: 12, color: "var(--ink-soft)" }}>Halo, selamat datang</p>
            <p style={{ margin: 0, fontSize: 14, fontWeight: 700 }}>{name || "Pengguna"}</p>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {isAdmin && (
            <Link
              href="/admin"
              className="chip"
              style={{ display: "inline-flex", alignItems: "center", gap: 6, minHeight: 38, padding: "0 10px", textDecoration: "none", color: "var(--blue-deep)", fontSize: 11, fontWeight: 700 }}
            >
              <LayoutDashboard size={15} />
              Panel admin
            </Link>
          )}
          <NotificationBell />
        </div>
      </div>

      <ExpiryBanner />

      <div className="card search-bar">
        <Search size={16} color="#a7b0c6" />
        <input
          className="search-input"
          placeholder="Cari produk favoritmu"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        {search && (
          <button className="search-clear" onClick={() => setSearch("")} aria-label="Hapus pencarian">
            <X size={14} />
          </button>
        )}
      </div>

      {!isSearching && (
        <div className="hero-banner">
          <p style={{ margin: "0 0 4px", fontSize: 11.5, opacity: 0.85 }}>Promo hari ini</p>
          <p style={{ margin: "0 0 12px", fontSize: 18, fontWeight: 800, maxWidth: 220 }}>
            Diskon hingga 50% untuk kebutuhan harianmu
          </p>
          <ShoppingBag size={18} />
        </div>
      )}

      {!isSearching && flashSaleProducts.length > 0 && (
        <>
          <div className="section-title">
            <span style={{ display: "flex", alignItems: "center", gap: 6, color: "var(--coral)" }}>
              <Zap size={15} /> Flash Sale
            </span>
          </div>
          <div className="product-grid">
            {flashSaleProducts.map((p) => (
              <ProductCard
                key={p.id}
                product={p}
                wishlisted={wishlistIds.includes(p.id)}
                onToggleWishlist={handleToggleWishlist}
                onAddToCart={handleAddToCart}
              />
            ))}
          </div>
        </>
      )}

      <div className="section-title">
        <span>Kategori</span>
        {selectedCategory && (
          <button className="link-reset" onClick={() => setSelectedCategory(null)}>
            Reset
          </button>
        )}
      </div>
      <div style={{ display: "flex", gap: 12, overflowX: "auto", paddingBottom: 4 }}>
        {categories.map((c) => {
          const Icon = CATEGORY_ICONS[c.nama?.toLowerCase()] || Gift;
          const active = selectedCategory === c.id;
          return (
            <button
              key={c.id}
              className="chip chip-button"
              onClick={() => setSelectedCategory(active ? null : c.id)}
            >
              <div className={`chip-icon ${active ? "chip-icon-active" : ""}`}>
                <Icon size={22} />
              </div>
              <span
                style={{
                  fontSize: 10.5,
                  fontWeight: 600,
                  textAlign: "center",
                  color: active ? "var(--blue)" : "inherit",
                }}
              >
                {c.nama}
              </span>
            </button>
          );
        })}
        {categories.length === 0 && (
          <p style={{ fontSize: 12, color: "var(--ink-soft)" }}>
            Belum ada kategori — tambahkan di tabel categories.
          </p>
        )}
      </div>

      {!isSearching && discountedProducts.length > 0 && (
        <>
          <div className="section-title">
            <span>Produk diskon</span>
          </div>
          <div className="product-grid">
            {discountedProducts.map((p) => (
              <ProductCard
                key={p.id}
                product={p}
                wishlisted={wishlistIds.includes(p.id)}
                onToggleWishlist={handleToggleWishlist}
                onAddToCart={handleAddToCart}
              />
            ))}
          </div>
        </>
      )}

      <div className="section-title">
        <span>{isSearching ? "Hasil pencarian" : "Semua produk"}</span>
      </div>

      {loading ? (
        <div className="product-grid">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="card">
              <div className="skeleton" style={{ height: 90, borderRadius: 16, marginBottom: 8 }} />
              <div className="skeleton" style={{ height: 12, width: "80%", marginBottom: 6 }} />
              <div className="skeleton" style={{ height: 14, width: "50%" }} />
            </div>
          ))}
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">
            <Search size={26} color="var(--blue)" />
          </div>
          <p style={{ margin: 0, fontWeight: 600 }}>Produk tidak ditemukan</p>
          <p style={{ margin: "4px 0 0", fontSize: 12.5 }}>Coba kata kunci atau kategori lain.</p>
        </div>
      ) : (
        <div className="product-grid">
          {filteredProducts.map((p) => (
            <ProductCard
              key={p.id}
              product={p}
              wishlisted={wishlistIds.includes(p.id)}
              onToggleWishlist={handleToggleWishlist}
              onAddToCart={handleAddToCart}
            />
          ))}
        </div>
      )}

      <BottomNav />
    </div>
  );
}
