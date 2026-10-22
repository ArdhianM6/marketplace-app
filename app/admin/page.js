"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "../../lib/supabase";
import { SkeletonBlock } from "../../components/Skeleton";
import { Package, Tags, ShieldCheck, ArrowUpRight, Store, Sparkles } from "lucide-react";

export default function AdminDashboardPage() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    checkAccess();
  }, []);

  async function checkAccess() {
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
    setAllowed(true);
    setChecking(false);
  }

  if (checking) {
    return (
      <div className="page">
        <SkeletonBlock height={60} radius={16} style={{ marginBottom: 10 }} />
        <SkeletonBlock height={60} radius={16} />
      </div>
    );
  }

  if (!allowed) return null;

  const menu = [
    { href: "/admin/products", label: "Kelola produk", desc: "Tambah, ubah, atur flash sale & hapus produk", icon: Package },
    { href: "/admin/categories", label: "Kelola kategori", desc: "Tambah atau hapus kategori produk", icon: Tags },
  ];

  return (
    <div className="page">
      <section className="admin-welcome">
        <div className="admin-welcome-copy">
          <span className="admin-welcome-kicker"><ShieldCheck size={14} /> Ruang kerja admin</span>
          <h1>Kelola tokomu<br />dengan lebih mudah.</h1>
          <p>Atur produk dan kategori, lalu pastikan katalog selalu siap untuk pelanggan.</p>
          <Link href="/home" className="admin-welcome-link"><Store size={16} /> Lihat halaman toko <ArrowUpRight size={15} /></Link>
        </div>
        <div className="admin-welcome-art" aria-hidden="true"><div className="admin-art-circle"><Package size={34} /></div><span className="admin-art-spark"><Sparkles size={21} /></span></div>
      </section>

      <div className="admin-section-heading"><div><h2>Pengelolaan</h2><p>Pilih bagian yang ingin kamu perbarui.</p></div></div>

      {menu.map(({ href, label, desc, icon: Icon }) => (
        <Link key={href} href={href} className="card card-interactive admin-management-card">
          <div className="admin-management-icon">
            <Icon size={19} color="var(--blue-deep)" />
          </div>
          <div className="admin-management-copy">
            <p>{label}</p>
            <span>{desc}</span>
          </div>
          <span className="admin-management-arrow"><ArrowUpRight size={17} /></span>
        </Link>
      ))}
    </div>
  );
}
