"use client";
import Link from "next/link";
import { ShoppingBag, Heart, Zap } from "lucide-react";
import { isFlashSaleActive, getEffectivePrice } from "../lib/flashSale";
import CountdownTimer from "./CountdownTimer";

const rupiah = (n) => "Rp" + Number(n).toLocaleString("id-ID");

export default function ProductCard({ product, wishlisted, onToggleWishlist, onAddToCart }) {
  const flashActive = isFlashSaleActive(product);
  const harga = getEffectivePrice(product);
  const hargaCoret = flashActive ? product.harga : product.harga_diskon ? product.harga : null;
  const diskonPersen = hargaCoret && harga ? Math.round(100 - (harga / hargaCoret) * 100) : null;
  const habis = (product.stok ?? 0) <= 0;

  return (
    <div className={`card product-card ${flashActive ? "product-card-flash" : ""}`}>
      <div className="product-thumb-wrap">
        <Link href={`/product/${product.id}`} className="product-thumb-link">
          <div className="product-thumb">
            {product.foto_url ? (
              <img src={product.foto_url} alt={product.nama} className="product-photo" />
            ) : (
              <ShoppingBag size={30} />
            )}
            {flashActive ? (
              <span className="badge-flash">
                <Zap size={10} /> -{diskonPersen}%
              </span>
            ) : (
              diskonPersen && <span className="badge-discount">-{diskonPersen}%</span>
            )}
            {habis && <span className="badge-soldout">Stok habis</span>}
          </div>
        </Link>

        <button
          className={`heart-btn ${wishlisted ? "active" : ""}`}
          onClick={(e) => {
            e.preventDefault();
            onToggleWishlist?.(product);
          }}
          aria-label="Simpan ke favorit"
        >
          <Heart size={16} fill={wishlisted ? "currentColor" : "none"} />
        </button>
      </div>

      <Link href={`/product/${product.id}`}>
        <p className="product-name">{product.nama}</p>
      </Link>

      <p className="product-price">{rupiah(harga)}</p>
      {hargaCoret && <p className="product-price-old">{rupiah(hargaCoret)}</p>}

      {flashActive && (
        <p className="flash-countdown">
          <Zap size={11} /> Berakhir dalam <CountdownTimer target={product.flash_sale_selesai} />
        </p>
      )}

      <button
        className="btn-primary"
        style={{ width: "100%" }}
        disabled={habis}
        onClick={() => onAddToCart?.(product)}
      >
        {habis ? "Stok habis" : "Tambah"}
      </button>
    </div>
  );
}