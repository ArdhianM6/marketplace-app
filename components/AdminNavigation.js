"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Package, Tags, Store } from "lucide-react";

const links = [
  { href: "/admin", label: "Ringkasan", icon: LayoutDashboard },
  { href: "/admin/products", label: "Produk", icon: Package },
  { href: "/admin/categories", label: "Kategori", icon: Tags },
];

export default function AdminNavigation() {
  const pathname = usePathname();
  return (
    <>
      <aside className="admin-sidebar">
        <Link className="admin-brand" href="/admin"><span className="admin-brand-icon"><Store size={19} /></span><span>Pasar<span>Kita</span><small>RUANG ADMIN</small></span></Link>
        <p className="admin-nav-caption">Workspace</p>
        <nav className="admin-nav" aria-label="Navigasi admin">
          {links.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || (href !== "/admin" && pathname.startsWith(`${href}/`));
            return <Link key={href} href={href} aria-current={active ? "page" : undefined} className={`admin-nav-link${active ? " active" : ""}`}><Icon size={18} /><span>{label}</span></Link>;
          })}
        </nav>
        <Link href="/home" className="admin-store-link"><Store size={16} /><span>Lihat halaman toko</span></Link>
      </aside>
      <nav className="admin-mobile-nav" aria-label="Navigasi admin">
        {links.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || (href !== "/admin" && pathname.startsWith(`${href}/`));
          return <Link key={href} href={href} aria-current={active ? "page" : undefined} className={`admin-mobile-link${active ? " active" : ""}`}><Icon size={19} /><span>{label}</span></Link>;
        })}
      </nav>
    </>
  );
}
