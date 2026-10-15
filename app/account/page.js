"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";
import BottomNav from "../../components/BottomNav";
import { SkeletonBlock } from "../../components/Skeleton";
import CountUp from "../../components/CountUp";
import { User, MapPin, Gift, Wallet, Package, Users, ShieldCheck, ChevronRight, LogOut } from "lucide-react";

const rupiah = (n) => "Rp" + Number(n).toLocaleString("id-ID");

export default function AccountPage() {
  const router = useRouter();
  const [profile, setProfile] = useState(null);
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      if (!data.session) {
        setLoading(false);
        return;
      }
      setEmail(data.session.user.email || "");
      const { data: p } = await supabase.from("profiles").select("*").eq("id", data.session.user.id).single();
      setProfile(p);
      setLoading(false);
    });
  }, []);

  const logout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  const menuItems = [
    { href: "/orders", label: "Riwayat pesanan", icon: Package },
    { href: "/account/edit", label: "Edit profil", icon: User },
    { href: "/account/address", label: "Alamat default", icon: MapPin },
    { href: "/account/vouchers", label: "Voucher saya", icon: Gift },
    { href: "/account/topup", label: "Top up saldo", icon: Wallet },
    { href: "/account/referral", label: "Ajak teman", icon: Users },
    ...(profile?.role === "admin" ? [{ href: "/admin", label: "Panel admin", icon: ShieldCheck }] : []),
  ];

  if (loading) {
    return (
      <div className="page">
        <SkeletonBlock height={20} width="40%" style={{ marginBottom: 16 }} />
        <div className="card" style={{ marginBottom: 18, display: "flex", alignItems: "center", gap: 12 }}>
          <SkeletonBlock height={52} width={52} radius={999} />
          <SkeletonBlock height={14} width="50%" />
        </div>
        {[1, 2, 3].map((i) => (
          <div key={i} className="card" style={{ marginBottom: 10 }}>
            <SkeletonBlock height={14} width="60%" />
          </div>
        ))}
        <BottomNav />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="page">
        <div className="empty-state">
          <div className="empty-state-icon">
            <User size={26} color="var(--blue)" />
          </div>
          <p style={{ margin: 0, fontWeight: 600 }}>Belum login</p>
          <p style={{ margin: "4px 0 12px", fontSize: 12.5 }}>Masuk untuk melihat akun kamu.</p>
          <Link href="/login" className="btn-primary" style={{ display: "inline-block" }}>
            Masuk
          </Link>
        </div>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="page">
      <h1 style={{ fontSize: 17, margin: "0 0 16px" }}>Akun saya</h1>

      <div className="card" style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 18 }}>
        <div className="avatar" style={{ width: 52, height: 52, fontSize: 16 }}>
          {(profile.nama || email).slice(0, 2).toUpperCase()}
        </div>
        <div>
          <p style={{ margin: "0 0 2px", fontSize: 14, fontWeight: 700 }}>{profile.nama || "Belum diisi"}</p>
          <p style={{ margin: 0, fontSize: 11.5, color: "var(--ink-soft)" }}>{email}</p>
        </div>
      </div>

      <div className="card" style={{ display: "flex", justifyContent: "space-between", marginBottom: 18 }}>
        <div>
          <p style={{ margin: "0 0 2px", fontSize: 11, color: "var(--ink-soft)" }}>Saldo</p>
          <p style={{ margin: 0, fontSize: 14, fontWeight: 800, color: "var(--blue-deep)" }}>
            <CountUp value={profile.saldo} format={rupiah} />
          </p>
        </div>
        <div>
          <p style={{ margin: "0 0 2px", fontSize: 11, color: "var(--ink-soft)" }}>Poin</p>
          <p style={{ margin: 0, fontSize: 14, fontWeight: 800, color: "var(--blue-deep)" }}>
            <CountUp value={profile.poin} />
          </p>
        </div>
      </div>

      {menuItems.map(({ href, label, icon: Icon }) => (
        <Link
          key={href}
          href={href}
          className="card card-interactive"
          style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Icon size={16} color="var(--blue)" />
            <span style={{ fontSize: 12.5, fontWeight: 600 }}>{label}</span>
          </div>
          <ChevronRight size={15} color="#c3cadd" />
        </Link>
      ))}

      <button
        onClick={logout}
        style={{
          marginTop: 16, width: "100%", background: "#ffecee", color: "#c4342f", border: "none",
          borderRadius: 14, padding: 12, fontSize: 12.5, fontWeight: 700, display: "flex",
          alignItems: "center", justifyContent: "center", gap: 6,
        }}
      >
        <LogOut size={14} /> Keluar akun
      </button>

      <BottomNav />
    </div>
  );
}