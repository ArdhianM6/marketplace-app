"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, ShoppingCart, Heart, User } from "lucide-react";
import { getCartCount, subscribeToCart } from "../lib/cart";

const ITEMS = [
  { href: "/home", label: "Beranda", icon: Home },
  { href: "/cart", label: "Keranjang", icon: ShoppingCart, showCartBadge: true },
  { href: "/wishlist", label: "Favorit", icon: Heart },
  { href: "/account", label: "Akun", icon: User },
];

export default function BottomNav() {
  const pathname = usePathname();
  const [cartCount, setCartCount] = useState(0);

  useEffect(() => {
    setCartCount(getCartCount());
    const unsubscribe = subscribeToCart((cart) => {
      setCartCount(cart.reduce((sum, i) => sum + i.qty, 0));
    });
    return unsubscribe;
  }, []);

  return (
    <div className="bottom-nav">
      {ITEMS.map(({ href, label, icon: Icon, showCartBadge }, idx) => {
        const active = pathname === href || pathname.startsWith(href + "/");
        return (
          <Link key={idx} href={href} className={`nav-item ${active ? "active" : ""}`}>
            <span className="nav-icon-wrap" style={{ position: "relative" }}>
              <Icon size={20} />
              {showCartBadge && cartCount > 0 && (
                <span
                  style={{
                    position: "absolute", top: -4, right: -8, background: "var(--coral)", color: "#fff",
                    fontSize: 9, fontWeight: 800, borderRadius: 9, minWidth: 16, height: 16,
                    display: "flex", alignItems: "center", justifyContent: "center", padding: "0 3px",
                  }}
                >
                  {cartCount > 99 ? "99+" : cartCount}
                </span>
              )}
            </span>
            <span>{label}</span>
          </Link>
        );
      })}
    </div>
  );
}