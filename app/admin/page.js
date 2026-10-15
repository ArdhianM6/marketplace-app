"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "../../lib/supabase";
import BottomNav from "../../components/BottomNav";
import { SkeletonBlock } from "../../components/Skeleton";
import { ArrowLeft, Package, Tags, ShieldCheck } from "lucide-react";

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
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
        <button onClick={() => router.push("/account")} className="icon-back">
          <ArrowLeft size={16} />
        </button>
        <h1 style={{ fontSize: 17, margin: 0 }}>Panel admin</h1>
      </div>
      <p style={{ fontSize: 12, color: "var(--ink-soft)", margin: "4px 0 18px" }}>
        <ShieldCheck size={13} style={{ verticalAlign: "-2px", marginRight: 4 }} />
        Khusus akun dengan peran admin.
      </p>

      {menu.map(({ href, label, desc, icon: Icon }) => (
        <Link key={href} href={href} className="card card-interactive" style={{ display: "flex", gap: 12, marginBottom: 10 }}>
          <div style={{ width: 42, height: 42, borderRadius: 12, background: "#eaf1ff", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <Icon size={19} color="var(--blue-deep)" />
          </div>
          <div>
            <p style={{ margin: "0 0 2px", fontSize: 13, fontWeight: 700 }}>{label}</p>
            <p style={{ margin: 0, fontSize: 11.5, color: "var(--ink-soft)" }}>{desc}</p>
          </div>
        </Link>
      ))}

      <BottomNav />
    </div>
  );
}