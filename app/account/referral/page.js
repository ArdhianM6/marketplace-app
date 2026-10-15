"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../../lib/supabase";
import { SkeletonBlock } from "../../../components/Skeleton";
import { useToast } from "../../../components/ToastProvider";
import { ArrowLeft, Copy, Share2, Users, Gift, Check } from "lucide-react";

export default function ReferralPage() {
  const router = useRouter();
  const toast = useToast();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) {
      router.replace("/login");
      return;
    }
    const { data: p } = await supabase.from("profiles").select("*").eq("id", session.user.id).single();
    setProfile(p);
    setLoading(false);
  }

  const shareText = profile
    ? `Yuk belanja di Marketplace App! Pakai kode referral ${profile.kode_referral} saat daftar, kita berdua dapat voucher diskon.`
    : "";

  const copyCode = async () => {
    if (!profile?.kode_referral) return;
    await navigator.clipboard.writeText(profile.kode_referral);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const share = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ text: shareText });
      } catch {
        // pengguna membatalkan share, tidak perlu ditangani
      }
    } else {
      await navigator.clipboard.writeText(shareText);
      toast.info("Teks ajakan sudah disalin, tinggal tempel ke chat teman kamu.");
    }
  };

  if (loading) {
    return (
      <div className="page">
        <SkeletonBlock height={40} style={{ marginBottom: 16 }} />
        <SkeletonBlock height={140} radius={20} />
      </div>
    );
  }

  return (
    <div className="page">
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
        <button onClick={() => router.back()} className="icon-back">
          <ArrowLeft size={16} />
        </button>
        <h1 style={{ fontSize: 17, margin: 0 }}>Ajak teman</h1>
      </div>

      <div className="hero-banner" style={{ textAlign: "center" }}>
        <Users size={22} style={{ marginBottom: 8 }} />
        <p style={{ margin: "0 0 4px", fontSize: 12, opacity: 0.85 }}>Kode referral kamu</p>
        <p style={{ margin: "0 0 14px", fontSize: 26, fontWeight: 800, letterSpacing: 2 }}>{profile?.kode_referral}</p>
        <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
          <button
            onClick={copyCode}
            style={{ display: "flex", alignItems: "center", gap: 6, background: "rgba(255,255,255,0.18)", border: "none", color: "#fff", borderRadius: 12, padding: "9px 14px", fontSize: 12, fontWeight: 700 }}
          >
            {copied ? <Check size={13} /> : <Copy size={13} />} {copied ? "Tersalin" : "Salin kode"}
          </button>
          <button
            onClick={share}
            style={{ display: "flex", alignItems: "center", gap: 6, background: "rgba(255,255,255,0.18)", border: "none", color: "#fff", borderRadius: 12, padding: "9px 14px", fontSize: 12, fontWeight: 700 }}
          >
            <Share2 size={13} /> Bagikan
          </button>
        </div>
      </div>

      <div className="card" style={{ display: "flex", gap: 10, marginTop: 16 }}>
        <div style={{ width: 40, height: 40, borderRadius: 12, background: "#eaf1ff", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <Gift size={18} color="var(--blue-deep)" />
        </div>
        <div>
          <p style={{ margin: "0 0 4px", fontSize: 12.5, fontWeight: 700 }}>Bagaimana cara kerjanya?</p>
          <p style={{ margin: 0, fontSize: 11.5, color: "var(--ink-soft)", lineHeight: 1.6 }}>
            Temanmu memasukkan kode ini saat daftar akun baru dan langsung dapat voucher diskon.
            Begitu temanmu belanja pertama kali, kamu juga dapat voucher diskon sebagai bonus.
          </p>
        </div>
      </div>
    </div>
  );
}