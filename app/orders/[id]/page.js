"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "../../../lib/supabase";
import StarRating from "../../../components/StarRating";
import { SkeletonBlock } from "../../../components/Skeleton";
import { useToast } from "../../../components/ToastProvider";
import { ArrowLeft, ShoppingBag, CheckCircle2, XCircle, MapPin, Package, Zap } from "lucide-react";

const rupiah = (n) => "Rp" + Number(n).toLocaleString("id-ID");

const STATUS_LABEL = {
  diproses: "Pesanan diproses",
  dikirim: "Pesanan dikirim",
  selesai: "Pesanan selesai",
  batal: "Pesanan dibatalkan",
};

const FLOW = ["diproses", "dikirim", "selesai"];

export default function OrderDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const toast = useToast();
  const [order, setOrder] = useState(null);
  const [history, setHistory] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [userId, setUserId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [openReviewFor, setOpenReviewFor] = useState(null);
  const [draftRating, setDraftRating] = useState(5);
  const [draftKomentar, setDraftKomentar] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function load() {
    setLoading(true);
    const { data: session } = await supabase.auth.getSession();
    const uid = session.session?.user?.id || null;
    setUserId(uid);

    const [{ data: o }, { data: h }, { data: r }] = await Promise.all([
      supabase
        .from("orders")
        .select("*, addresses(label, alamat_lengkap, kota), order_items(id, qty, harga_saat_beli, product_id, products(nama, foto_url))")
        .eq("id", id)
        .single(),
      supabase.from("order_status_history").select("*").eq("order_id", id).order("created_at", { ascending: true }),
      supabase.from("reviews").select("*").eq("order_id", id),
    ]);

    setOrder(o || null);
    setHistory(h || []);
    setReviews(r || []);
    setLoading(false);
  }

  const reviewFor = (productId) => reviews.find((r) => r.product_id === productId);

  const startReview = (productId) => {
    setOpenReviewFor(productId);
    setDraftRating(5);
    setDraftKomentar("");
  };

  const submitReview = async (productId) => {
    if (!userId) return;
    setSubmitting(true);
    const { data, error } = await supabase
      .from("reviews")
      .insert({
        product_id: productId,
        order_id: id,
        user_id: userId,
        rating: draftRating,
        komentar: draftKomentar.trim() || null,
      })
      .select()
      .single();
    setSubmitting(false);

    if (error) {
      toast.error(error.message || "Gagal mengirim ulasan.");
      return;
    }
    setReviews((prev) => [...prev, data]);
    setOpenReviewFor(null);
    toast.success("Ulasan terkirim, terima kasih!");
  };

  if (loading) {
    return (
      <div className="page">
        <SkeletonBlock height={40} style={{ marginBottom: 16 }} />
        <div className="card" style={{ marginBottom: 14 }}>
          <SkeletonBlock height={16} width="50%" style={{ marginBottom: 14 }} />
          <SkeletonBlock height={48} style={{ marginBottom: 10 }} />
          <SkeletonBlock height={48} />
        </div>
        <SkeletonBlock height={80} radius={16} />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="page">
        <div className="empty-state">
          <div className="empty-state-icon">
            <Package size={26} color="var(--blue)" />
          </div>
          <p style={{ margin: 0, fontWeight: 600 }}>Pesanan tidak ditemukan</p>
          <p style={{ margin: "4px 0 12px", fontSize: 12.5 }}>Mungkin sudah dihapus atau linknya salah.</p>
          <Link href="/orders" className="btn-primary" style={{ display: "inline-block" }}>
            Ke riwayat pesanan
          </Link>
        </div>
      </div>
    );
  }

  const isCancelled = order.status_order === "batal";
  const currentIdx = FLOW.indexOf(order.status_order);

  return (
    <div className="page">
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
        <button className="icon-back" onClick={() => router.back()}>
          <ArrowLeft size={20} />
        </button>
        <h1 style={{ fontSize: 16, margin: 0 }}>Detail pesanan</h1>
      </div>

      <div className="card" style={{ marginBottom: 14 }}>
        <p style={{ margin: "0 0 14px", fontSize: 13, fontWeight: 700 }}>Status pesanan</p>
        <div className="tracking-timeline">
          {isCancelled ? (
            <div className="tracking-step cancelled">
              <div className="tracking-dot">
                <XCircle size={15} />
              </div>
              <div>
                <p className="tracking-label">Pesanan dibatalkan</p>
                <p className="tracking-time">
                  {new Date(history[history.length - 1]?.created_at || order.created_at).toLocaleString("id-ID")}
                </p>
              </div>
            </div>
          ) : (
            FLOW.map((step, idx) => {
              const done = idx <= currentIdx;
              const isCurrent = idx === currentIdx;
              const entry = history.find((h) => h.status === step);
              return (
                <div key={step} className={`tracking-step ${done ? "done" : ""} ${isCurrent ? "current" : ""}`}>
                  <div className="tracking-dot">{done && <CheckCircle2 size={15} />}</div>
                  <div>
                    <p className="tracking-label">{STATUS_LABEL[step]}</p>
                    <p className="tracking-time">
                      {entry ? new Date(entry.created_at).toLocaleString("id-ID") : "Menunggu"}
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {!isCancelled && order.status_order !== "selesai" && order.estimasi_tiba && (
        <div className="card" style={{ display: "flex", gap: 10, marginBottom: 14, background: "#eaf1ff", borderColor: "var(--blue)" }}>
          <Zap size={16} color="var(--blue)" style={{ flexShrink: 0, marginTop: 2 }} />
          <div>
            <p style={{ margin: "0 0 2px", fontSize: 12, fontWeight: 700, color: "var(--blue-deep)" }}>
              Sampai hari ini juga, estimasi 1-3 jam
            </p>
            <p style={{ margin: 0, fontSize: 11.5, color: "var(--ink-soft)" }}>
              Perkiraan tiba sekitar pukul{" "}
              {new Date(new Date(order.estimasi_tiba).getTime() - 2 * 60 * 60 * 1000).toLocaleTimeString("id-ID", {
                hour: "2-digit",
                minute: "2-digit",
              })}{" "}
              -{" "}
              {new Date(order.estimasi_tiba).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}
            </p>
          </div>
        </div>
      )}

      {order.addresses && (
        <div className="card" style={{ display: "flex", gap: 10, marginBottom: 14 }}>
          <MapPin size={16} color="var(--blue)" style={{ flexShrink: 0, marginTop: 2 }} />
          <div>
            <p style={{ margin: "0 0 2px", fontSize: 12, fontWeight: 700 }}>{order.addresses.label}</p>
            <p style={{ margin: 0, fontSize: 11.5, color: "var(--ink-soft)" }}>
              {order.addresses.alamat_lengkap}, {order.addresses.kota}
            </p>
          </div>
        </div>
      )}

      <p style={{ fontSize: 13, fontWeight: 700, margin: "0 0 10px" }}>Barang dipesan</p>
      {order.order_items.map((it) => {
        const existing = reviewFor(it.product_id);
        const canReview = order.status_order === "selesai" && !existing;
        const isOpen = openReviewFor === it.product_id;

        return (
          <div key={it.id} className="card" style={{ marginBottom: 10 }}>
            <div className="order-item-row">
              <div className="order-item-thumb">
                {it.products?.foto_url ? (
                  <img src={it.products.foto_url} alt={it.products?.nama || "Produk"} />
                ) : (
                  <ShoppingBag size={18} />
                )}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ margin: "0 0 2px", fontSize: 12.5, fontWeight: 600 }}>{it.products?.nama || "Produk"}</p>
                <p style={{ margin: 0, fontSize: 11.5, color: "var(--ink-soft)" }}>
                  {it.qty} x {rupiah(it.harga_saat_beli)}
                </p>
              </div>
            </div>

            {existing && (
              <div className="review-box review-existing">
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <StarRating value={existing.rating} readOnly size={14} />
                  <span style={{ fontSize: 10.5, color: "var(--ink-soft)" }}>
                    {new Date(existing.created_at).toLocaleDateString("id-ID")}
                  </span>
                </div>
                {existing.komentar && (
                  <p style={{ margin: "6px 0 0", fontSize: 12, color: "var(--ink)" }}>{existing.komentar}</p>
                )}
              </div>
            )}

            {canReview && !isOpen && (
              <button
                className="btn-secondary"
                style={{ width: "100%", marginTop: 10 }}
                onClick={() => startReview(it.product_id)}
              >
                Beri ulasan
              </button>
            )}

            {canReview && isOpen && (
              <div className="review-box">
                <p style={{ margin: "0 0 8px", fontSize: 12, fontWeight: 700 }}>Bagaimana kualitas produk ini?</p>
                <StarRating value={draftRating} onChange={setDraftRating} size={22} />
                <textarea
                  className="review-textarea"
                  placeholder="Ceritakan pengalamanmu dengan produk ini (opsional)"
                  value={draftKomentar}
                  onChange={(e) => setDraftKomentar(e.target.value)}
                />
                <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                  <button className="btn-secondary" style={{ flex: 1 }} onClick={() => setOpenReviewFor(null)}>
                    Batal
                  </button>
                  <button
                    className="btn-primary"
                    style={{ flex: 1 }}
                    disabled={submitting}
                    onClick={() => submitReview(it.product_id)}
                  >
                    {submitting ? "Mengirim..." : "Kirim ulasan"}
                  </button>
                </div>
              </div>
            )}
          </div>
        );
      })}

      <div className="card" style={{ marginTop: 4 }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6, fontSize: 12 }}>
          <span style={{ color: "var(--ink-soft)" }}>Subtotal</span>
          <span>{rupiah(order.subtotal)}</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6, fontSize: 12 }}>
          <span style={{ color: "var(--ink-soft)" }}>Ongkos kirim</span>
          <span>{rupiah(order.ongkir)}</span>
        </div>
        {order.potongan_voucher > 0 && (
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6, fontSize: 12 }}>
            <span style={{ color: "var(--ink-soft)" }}>Potongan voucher</span>
            <span>-{rupiah(order.potongan_voucher)}</span>
          </div>
        )}
        <div style={{ height: 1, background: "var(--line)", margin: "8px 0" }} />
        <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 800 }}>
          <span>Total</span>
          <span style={{ color: "var(--blue-deep)" }}>{rupiah(order.total)}</span>
        </div>
      </div>

      <button
        onClick={() => window.print()}
        className="btn-secondary"
        style={{ width: "100%", marginTop: 16 }}
      >
        Cetak struk belanja
      </button>

      <Link href="/orders" style={{ display: "block", textAlign: "center", marginTop: 12, fontSize: 12.5, fontWeight: 700, color: "var(--blue)" }}>
        Kembali ke riwayat pesanan
      </Link>
    </div>
  );
}