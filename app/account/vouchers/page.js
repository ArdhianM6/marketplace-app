"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../../lib/supabase";
import { SkeletonBlock } from "../../../components/Skeleton";
import { useToast } from "../../../components/ToastProvider";
import { ArrowLeft, Gift, Clock, Loader2 } from "lucide-react";

const formatSisaHari = (expiresAt) => {
  if (!expiresAt) return null;
  const hari = Math.ceil((new Date(expiresAt) - new Date()) / (1000 * 60 * 60 * 24));
  return hari <= 0 ? "Kadaluarsa" : `Berlaku ${hari} hari lagi`;
};

export default function VouchersPage() {
  const router = useRouter();
  const toast = useToast();
  const [profile, setProfile] = useState(null);
  const [myVouchers, setMyVouchers] = useState([]);
  const [redeemableVouchers, setRedeemableVouchers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [redeemingId, setRedeemingId] = useState(null);

  const load = async () => {
    setLoading(true);
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) {
      setLoading(false);
      return;
    }

    const { data: p } = await supabase.from("profiles").select("*").eq("id", session.user.id).single();
    setProfile(p);

    const { data: mine } = await supabase
      .from("user_vouchers")
      .select("*, vouchers(*)")
      .eq("user_id", session.user.id)
      .eq("status", "available")
      .gt("expires_at", new Date().toISOString());
    setMyVouchers(mine || []);

    const { data: v } = await supabase.from("vouchers").select("*").eq("aktif", true).eq("auto_grant", false);
    setRedeemableVouchers(v || []);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const redeem = async (voucherId) => {
    setRedeemingId(voucherId);
    const {
      data: { session },
    } = await supabase.auth.getSession();

    const res = await fetch("/api/redeem-voucher", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` },
      body: JSON.stringify({ voucherId }),
    });
    const data = await res.json();
    setRedeemingId(null);

    if (data.error) {
      toast.error(data.error);
    } else {
      toast.success("Voucher berhasil ditukar!");
      load();
    }
  };

  if (loading) {
    return (
      <div className="page">
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
          <SkeletonBlock height={40} width={40} radius={999} />
          <SkeletonBlock height={18} width="40%" />
        </div>
        {[1, 2, 3].map((i) => (
          <div key={i} className="card" style={{ marginBottom: 8 }}>
            <SkeletonBlock height={14} width="70%" />
          </div>
        ))}
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="page">
        <div className="empty-state">
          <div className="empty-state-icon">
            <Gift size={26} color="var(--blue)" />
          </div>
          <p style={{ margin: 0, fontWeight: 600 }}>Belum login</p>
          <p style={{ margin: "4px 0 12px", fontSize: 12.5 }}>Masuk dulu untuk melihat voucher kamu.</p>
          <button onClick={() => router.push("/login")} className="btn-primary">
            Masuk
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
        <button onClick={() => router.back()} style={{ background: "none", border: "none" }}>
          <ArrowLeft size={18} />
        </button>
        <h1 style={{ fontSize: 17, margin: 0 }}>Voucher saya</h1>
        <span style={{ marginLeft: "auto", fontSize: 12, fontWeight: 700, color: "var(--blue-deep)" }}>{profile.poin} poin</span>
      </div>

      <p style={{ fontWeight: 700, fontSize: 13, margin: "0 0 10px" }}>Voucher aktif</p>
      {myVouchers.length === 0 ? (
        <div className="empty-state" style={{ padding: "24px 16px", marginBottom: 8 }}>
          <div className="empty-state-icon" style={{ width: 48, height: 48 }}>
            <Gift size={20} color="var(--blue)" />
          </div>
          <p style={{ margin: 0, fontWeight: 600, fontSize: 12.5 }}>Belum ada voucher aktif</p>
          <p style={{ margin: "4px 0 0", fontSize: 11.5 }}>Tukar poin kamu jadi voucher di bawah ini.</p>
        </div>
      ) : (
        myVouchers.map((uv) => (
          <div key={uv.id} className="card" style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8, borderColor: "var(--coral)" }}>
            <div style={{ width: 42, height: 42, borderRadius: 12, background: "var(--coral-soft)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <Gift size={19} color="var(--coral)" />
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ margin: "0 0 2px", fontSize: 12, fontWeight: 700 }}>{uv.vouchers.judul}</p>
              <p style={{ margin: 0, fontSize: 10.5, color: "var(--ink-soft)", display: "flex", alignItems: "center", gap: 4 }}>
                <Clock size={11} /> {formatSisaHari(uv.expires_at)}
              </p>
            </div>
          </div>
        ))
      )}

      <p style={{ fontWeight: 700, fontSize: 13, margin: "20px 0 10px" }}>Tukar poin dengan voucher</p>
      {redeemableVouchers.length === 0 ? (
        <div className="empty-state" style={{ padding: "24px 16px" }}>
          <div className="empty-state-icon" style={{ width: 48, height: 48 }}>
            <Gift size={20} color="var(--blue)" />
          </div>
          <p style={{ margin: 0, fontWeight: 600, fontSize: 12.5 }}>Belum ada voucher yang bisa ditukar</p>
          <p style={{ margin: "4px 0 0", fontSize: 11.5 }}>Cek lagi nanti, promo baru bisa muncul kapan saja.</p>
        </div>
      ) : (
        redeemableVouchers.map((v) => (
          <div key={v.id} className="card" style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
            <div style={{ width: 42, height: 42, borderRadius: 12, background: "#eaf1ff", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <Gift size={19} color="var(--blue)" />
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ margin: "0 0 2px", fontSize: 12, fontWeight: 700 }}>{v.judul}</p>
              <p style={{ margin: 0, fontSize: 10.5, color: "var(--ink-soft)" }}>{v.biaya_poin} poin</p>
            </div>
            <button
              className="btn-primary"
              disabled={profile.poin < v.biaya_poin || redeemingId === v.id}
              onClick={() => redeem(v.id)}
              style={{ display: "flex", alignItems: "center", gap: 6 }}
            >
              {redeemingId === v.id && <Loader2 size={14} className="spin" />}
              {redeemingId === v.id ? "Menukar..." : "Tukar"}
            </button>
          </div>
        ))
      )}
    </div>
  );
}