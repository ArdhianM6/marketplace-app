"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "../../../../lib/supabase";
import { SkeletonBlock } from "../../../../components/Skeleton";
import { ArrowLeft } from "lucide-react";

const inputStyle = {
  border: "1px solid var(--line)",
  borderRadius: 14,
  padding: "11px 14px",
  fontSize: 13,
  fontFamily: "inherit",
  width: "100%",
};

const EMPTY_FORM = {
  nama: "",
  category_id: "",
  harga: "",
  harga_diskon: "",
  stok: "",
  deskripsi: "",
  foto_url: "",
  flash_sale_harga: "",
  flash_sale_mulai: "",
  flash_sale_selesai: "",
};

// Format Date -> string yang dipahami <input type="datetime-local">
function toLocalInputValue(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function AdminProductFormPage() {
  const { id } = useParams();
  const router = useRouter();
  const isNew = id === "new";

  const [checking, setChecking] = useState(true);
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

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

    const { data: cats } = await supabase.from("categories").select("*");
    setCategories(cats || []);

    if (!isNew) {
      const { data: p } = await supabase.from("products").select("*").eq("id", id).single();
      if (p) {
        setForm({
          nama: p.nama || "",
          category_id: p.category_id || "",
          harga: p.harga ?? "",
          harga_diskon: p.harga_diskon ?? "",
          stok: p.stok ?? "",
          deskripsi: p.deskripsi || "",
          foto_url: p.foto_url || "",
          flash_sale_harga: p.flash_sale_harga ?? "",
          flash_sale_mulai: toLocalInputValue(p.flash_sale_mulai),
          flash_sale_selesai: toLocalInputValue(p.flash_sale_selesai),
        });
      }
      setLoading(false);
    }
  }

  const update = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  const save = async (e) => {
    e.preventDefault();
    setError("");

    if (!form.nama.trim() || !form.harga) {
      setError("Nama dan harga produk wajib diisi.");
      return;
    }

    const hasFlashSale = form.flash_sale_harga && form.flash_sale_mulai && form.flash_sale_selesai;
    if ((form.flash_sale_harga || form.flash_sale_mulai || form.flash_sale_selesai) && !hasFlashSale) {
      setError("Isi harga flash sale, waktu mulai, dan waktu selesai sekaligus (atau kosongkan ketiganya).");
      return;
    }

    setSaving(true);
    const payload = {
      nama: form.nama.trim(),
      category_id: form.category_id || null,
      harga: Number(form.harga),
      harga_diskon: form.harga_diskon ? Number(form.harga_diskon) : null,
      stok: Number(form.stok) || 0,
      deskripsi: form.deskripsi.trim() || null,
      foto_url: form.foto_url.trim() || null,
      flash_sale_harga: hasFlashSale ? Number(form.flash_sale_harga) : null,
      flash_sale_mulai: hasFlashSale ? new Date(form.flash_sale_mulai).toISOString() : null,
      flash_sale_selesai: hasFlashSale ? new Date(form.flash_sale_selesai).toISOString() : null,
    };

    const { error: saveError } = isNew
      ? await supabase.from("products").insert(payload)
      : await supabase.from("products").update(payload).eq("id", id);

    setSaving(false);
    if (saveError) {
      setError(saveError.message || "Gagal menyimpan produk.");
      return;
    }
    router.push("/admin/products");
  };

  if (checking || loading) {
    return (
      <div className="page">
        <SkeletonBlock height={40} style={{ marginBottom: 10 }} />
        <SkeletonBlock height={40} style={{ marginBottom: 10 }} />
        <SkeletonBlock height={40} />
      </div>
    );
  }

  return (
    <div className="page">
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
        <button onClick={() => router.push("/admin/products")} className="icon-back">
          <ArrowLeft size={16} />
        </button>
        <h1 style={{ fontSize: 17, margin: 0 }}>{isNew ? "Tambah produk" : "Edit produk"}</h1>
      </div>

      <form onSubmit={save} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <input placeholder="Nama produk" value={form.nama} onChange={(e) => update("nama", e.target.value)} style={inputStyle} required />

        <select value={form.category_id} onChange={(e) => update("category_id", e.target.value)} style={inputStyle}>
          <option value="">Tanpa kategori</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.nama}</option>
          ))}
        </select>

        <div style={{ display: "flex", gap: 10 }}>
          <input type="number" min="0" placeholder="Harga normal" value={form.harga} onChange={(e) => update("harga", e.target.value)} style={inputStyle} required />
          <input type="number" min="0" placeholder="Harga diskon (opsional)" value={form.harga_diskon} onChange={(e) => update("harga_diskon", e.target.value)} style={inputStyle} />
        </div>

        <input type="number" min="0" placeholder="Stok" value={form.stok} onChange={(e) => update("stok", e.target.value)} style={inputStyle} />
        <input placeholder="URL foto produk" value={form.foto_url} onChange={(e) => update("foto_url", e.target.value)} style={inputStyle} />
        <textarea placeholder="Deskripsi produk" value={form.deskripsi} onChange={(e) => update("deskripsi", e.target.value)} style={{ ...inputStyle, minHeight: 80 }} />

        <div style={{ height: 1, background: "var(--line)", margin: "6px 0" }} />
        <p style={{ margin: 0, fontSize: 12.5, fontWeight: 700 }}>Flash sale (opsional)</p>
        <p style={{ margin: "0 0 4px", fontSize: 11, color: "var(--ink-soft)" }}>
          Isi ketiganya untuk mengaktifkan flash sale, atau kosongkan semua untuk menonaktifkan.
        </p>
        <input type="number" min="0" placeholder="Harga saat flash sale" value={form.flash_sale_harga} onChange={(e) => update("flash_sale_harga", e.target.value)} style={inputStyle} />
        <div style={{ display: "flex", gap: 10 }}>
          <div style={{ flex: 1 }}>
            <p style={{ margin: "0 0 4px", fontSize: 10.5, color: "var(--ink-soft)" }}>Mulai</p>
            <input type="datetime-local" value={form.flash_sale_mulai} onChange={(e) => update("flash_sale_mulai", e.target.value)} style={inputStyle} />
          </div>
          <div style={{ flex: 1 }}>
            <p style={{ margin: "0 0 4px", fontSize: 10.5, color: "var(--ink-soft)" }}>Selesai</p>
            <input type="datetime-local" value={form.flash_sale_selesai} onChange={(e) => update("flash_sale_selesai", e.target.value)} style={inputStyle} />
          </div>
        </div>

        {error && <p style={{ color: "#c4342f", fontSize: 12 }}>{error}</p>}

        <button type="submit" className="btn-primary" disabled={saving} style={{ marginTop: 6 }}>
          {saving ? "Menyimpan..." : "Simpan produk"}
        </button>
      </form>
    </div>
  );
}