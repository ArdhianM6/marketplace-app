"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "../../../lib/supabase";
import { SkeletonBlock } from "../../../components/Skeleton";
import { ArrowLeft, MapPin, Star, Plus } from "lucide-react";

export default function AddressListPage() {
  const router = useRouter();
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = () => {
    setLoading(true);
    supabase.from("addresses").select("*").order("is_default", { ascending: false })
      .then(({ data, error: queryError }) => {
        if (queryError) throw queryError;
        setAddresses(data || []);
        setError("");
      })
      .catch((err) => {
        console.error("Gagal memuat alamat:", err);
        setError("Alamat gagal dimuat. Periksa koneksi lalu muat ulang halaman.");
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const setDefault = async (id) => {
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) throw sessionError;
      if (!session?.user) throw new Error("Sesi login tidak ditemukan. Silakan login ulang.");
      const { error: clearError } = await supabase.from("addresses").update({ is_default: false }).eq("user_id", session.user.id);
      if (clearError) throw clearError;
      const { error: updateError } = await supabase.from("addresses").update({ is_default: true }).eq("id", id).eq("user_id", session.user.id);
      if (updateError) throw updateError;
      load();
    } catch (err) {
      console.error("Gagal mengubah alamat default:", err);
      setError(err?.message || "Gagal mengubah alamat default.");
    }
  };

  return (
    <div className="page">
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
        <button onClick={() => router.back()} style={{ background: "none", border: "none" }}>
          <ArrowLeft size={18} />
        </button>
        <h1 style={{ fontSize: 17, margin: 0 }}>Alamat saya</h1>
      </div>

      {loading ? (
        [1, 2].map((i) => (
          <div key={i} className="card" style={{ marginBottom: 10 }}>
            <SkeletonBlock height={14} width="50%" style={{ marginBottom: 8 }} />
            <SkeletonBlock height={11} width="85%" />
          </div>
        ))
      ) : (
        <>
        {error && <p role="alert" style={{ color: "#c4342f", fontSize: 12 }}>{error}</p>}
        {addresses.map((a) => (
          <div key={a.id} className="card" style={{ display: "flex", gap: 10, marginBottom: 10 }}>
            <MapPin size={18} color="var(--blue)" style={{ flexShrink: 0, marginTop: 2 }} />
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
                <p style={{ margin: 0, fontSize: 12.5, fontWeight: 700 }}>{a.label}</p>
                {a.is_default && (
                  <span style={{ fontSize: 9.5, fontWeight: 700, color: "var(--mint)", background: "#e6faf3", padding: "2px 6px", borderRadius: 6 }}>
                    Default
                  </span>
                )}
              </div>
              <p style={{ margin: 0, fontSize: 11.5, color: "var(--ink-soft)", lineHeight: 1.4 }}>
                {a.penerima} — {a.alamat_lengkap}, {a.kota}
              </p>
            </div>
            {!a.is_default && (
              <button onClick={() => setDefault(a.id)} style={{ background: "none", border: "none", flexShrink: 0 }}>
                <Star size={16} color="#c3cadd" />
              </button>
            )}
          </div>
        ))}
        </>
      )}

      {!loading && !error && addresses.length === 0 && (
        <div className="empty-state">
          <div className="empty-state-icon">
            <MapPin size={26} color="var(--blue)" />
          </div>
          <p style={{ margin: 0, fontWeight: 600 }}>Belum ada alamat</p>
          <p style={{ margin: "4px 0 0", fontSize: 12.5 }}>Tambahkan alamat pengiriman pertamamu.</p>
        </div>
      )}

      <Link
        href="/addresses/new"
        className="btn-secondary"
        style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginTop: 6 }}
      >
        <Plus size={15} /> Tambah alamat baru
      </Link>
    </div>
  );
}
