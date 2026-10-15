"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../../lib/supabase";
import { SkeletonBlock } from "../../../components/Skeleton";
import { useToast } from "../../../components/ToastProvider";
import { ArrowLeft, Trash2, Plus, Tags, Loader2 } from "lucide-react";

export default function AdminCategoriesPage() {
  const router = useRouter();
  const toast = useToast();
  const [checking, setChecking] = useState(true);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [nama, setNama] = useState("");
  const [icon, setIcon] = useState("");
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    init();
  }, []);

  async function init() {
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
    setChecking(false);
    load();
  }

  async function load() {
    setLoading(true);
    const { data } = await supabase.from("categories").select("*").order("nama");
    setCategories(data || []);
    setLoading(false);
  }

  const addCategory = async (e) => {
    e.preventDefault();
    setError("");
    if (!nama.trim()) return;
    setSaving(true);
    const { error: insertError } = await supabase.from("categories").insert({ nama: nama.trim(), icon: icon.trim() || null });
    setSaving(false);
    if (insertError) {
      setError(insertError.message || "Gagal menambah kategori.");
      toast.error("Gagal menambah kategori.");
      return;
    }
    setNama("");
    setIcon("");
    toast.success("Kategori ditambahkan.");
    load();
  };

  const remove = async (id) => {
    if (!confirm("Hapus kategori ini? Produk yang memakainya akan jadi tanpa kategori.")) return;
    setDeletingId(id);
    const { error: deleteError } = await supabase.from("categories").delete().eq("id", id);
    setDeletingId(null);
    if (deleteError) {
      toast.error(deleteError.message || "Gagal menghapus kategori.");
      return;
    }
    setCategories((prev) => prev.filter((c) => c.id !== id));
    toast.success("Kategori dihapus.");
  };

  if (checking) {
    return (
      <div className="page">
        <SkeletonBlock height={60} radius={16} />
      </div>
    );
  }

  return (
    <div className="page">
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
        <button onClick={() => router.push("/admin")} className="icon-back">
          <ArrowLeft size={16} />
        </button>
        <h1 style={{ fontSize: 17, margin: 0 }}>Kelola kategori</h1>
      </div>

      <form onSubmit={addCategory} className="card" style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        <input
          placeholder="Nama kategori baru"
          value={nama}
          onChange={(e) => setNama(e.target.value)}
          style={{ flex: 1, border: "1px solid var(--line)", borderRadius: 12, padding: "9px 12px", fontSize: 12.5 }}
        />
        <input
          placeholder="Icon (opsional)"
          value={icon}
          onChange={(e) => setIcon(e.target.value)}
          style={{ width: 100, border: "1px solid var(--line)", borderRadius: 12, padding: "9px 12px", fontSize: 12.5 }}
        />
        <button
          type="submit"
          className="btn-primary"
          disabled={saving}
          style={{ padding: "9px 14px", display: "flex", alignItems: "center", gap: 6 }}
        >
          {saving ? <Loader2 size={14} className="spin" /> : <Plus size={14} />}
        </button>
      </form>

      {error && <p style={{ color: "#c4342f", fontSize: 12, marginBottom: 12 }}>{error}</p>}

      {loading ? (
        <SkeletonBlock height={120} radius={16} />
      ) : categories.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">
            <Tags size={26} color="var(--blue)" />
          </div>
          <p style={{ margin: 0, fontWeight: 600 }}>Belum ada kategori</p>
          <p style={{ margin: "4px 0 0", fontSize: 12.5 }}>Tambahkan kategori pertama lewat form di atas.</p>
        </div>
      ) : (
        categories.map((c) => (
          <div key={c.id} className="card" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
            <span style={{ fontSize: 12.5, fontWeight: 600 }}>{c.nama}</span>
            <button
              onClick={() => remove(c.id)}
              disabled={deletingId === c.id}
              style={{ background: "none", border: "none", color: "var(--coral)", display: "flex", alignItems: "center" }}
            >
              {deletingId === c.id ? <Loader2 size={15} className="spin" /> : <Trash2 size={15} />}
            </button>
          </div>
        ))
      )}
    </div>
  );
}