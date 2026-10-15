"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../../lib/supabase";
import { SkeletonBlock } from "../../../components/Skeleton";
import { ArrowLeft, User, Phone } from "lucide-react";

export default function EditProfilePage() {
  const router = useRouter();
  const [nama, setNama] = useState("");
  const [noHp, setNoHp] = useState("");
  const [saving, setSaving] = useState(false);
  const [userId, setUserId] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      if (!data.session) {
        setLoading(false);
        return;
      }
      setUserId(data.session.user.id);
      const { data: p } = await supabase.from("profiles").select("*").eq("id", data.session.user.id).single();
      setNama(p?.nama || "");
      setNoHp(p?.no_hp || "");
      setLoading(false);
    });
  }, []);

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    await supabase.from("profiles").update({ nama, no_hp: noHp }).eq("id", userId);
    setSaving(false);
    router.push("/account");
  };

  return (
    <div className="page">
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
        <button onClick={() => router.back()} style={{ background: "none", border: "none" }}>
          <ArrowLeft size={18} />
        </button>
        <h1 style={{ fontSize: 17, margin: 0 }}>Edit profil</h1>
      </div>

      {loading ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <SkeletonBlock height={44} radius={14} />
          <SkeletonBlock height={44} radius={14} />
          <SkeletonBlock height={44} radius={14} />
        </div>
      ) : (
        <form onSubmit={save} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, border: "1px solid var(--line)", borderRadius: 14, padding: "11px 14px" }}>
            <User size={15} color="#a7b0c6" />
            <input
              placeholder="Nama lengkap"
              value={nama}
              onChange={(e) => setNama(e.target.value)}
              style={{ border: "none", outline: "none", flex: 1, fontSize: 13 }}
            />
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, border: "1px solid var(--line)", borderRadius: 14, padding: "11px 14px" }}>
            <Phone size={15} color="#a7b0c6" />
            <input
              placeholder="Nomor HP"
              value={noHp}
              onChange={(e) => setNoHp(e.target.value)}
              style={{ border: "none", outline: "none", flex: 1, fontSize: 13 }}
            />
          </div>
          <button type="submit" className="btn-primary" disabled={saving}>
            {saving ? "Menyimpan..." : "Simpan perubahan"}
          </button>
        </form>
      )}
    </div>
  );
}