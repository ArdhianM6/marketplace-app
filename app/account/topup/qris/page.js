"use client";
import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "../../../../lib/supabase";
import { CheckCircle2, Loader2 } from "lucide-react";

const rupiah = (n) => "Rp" + Number(n).toLocaleString("id-ID");

export default function TopupQrisPage() {
  return (
    <Suspense fallback={<div className="page">Memuat QRIS...</div>}>
      <TopupQrisContent />
    </Suspense>
  );
}

function TopupQrisContent() {
  const router = useRouter();
  const params = useSearchParams();
  const topupId = params.get("topupId");
  const [data, setData] = useState(null);
  const [status, setStatus] = useState("pending");
  const pollRef = useRef(null);

  const checkStatus = async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    const res = await fetch(`/api/topup/status?topupId=${topupId}`, {
      headers: { Authorization: `Bearer ${session.access_token}` },
    });
    const json = await res.json();
    if (!json.error) {
      setData(json);
      setStatus(json.status);
    }
  };

  useEffect(() => {
    checkStatus();
    // Cek status pembayaran tiap 3 detik selama masih pending.
    // Butuh webhook Midtrans sudah terhubung ke domain aktif (bukan localhost)
    // supaya status ini benar-benar berubah otomatis setelah dibayar.
    pollRef.current = setInterval(checkStatus, 3000);
    return () => clearInterval(pollRef.current);
  }, [topupId]);

  useEffect(() => {
    if (status === "paid" && pollRef.current) {
      clearInterval(pollRef.current);
    }
  }, [status]);

  if (!data) return <div className="page">Memuat QRIS...</div>;

  if (status === "paid") {
    return (
      <div className="page" style={{ textAlign: "center", paddingTop: 60 }}>
        <CheckCircle2 size={56} color="var(--mint)" style={{ marginBottom: 16 }} />
        <h1 style={{ fontSize: 18, margin: "0 0 6px" }}>Top up berhasil!</h1>
        <p style={{ fontSize: 13, color: "var(--ink-soft)", marginBottom: 24 }}>
          Saldo {rupiah(data.jumlah)} sudah masuk ke akun kamu.
        </p>
        <button className="btn-primary" style={{ width: "100%" }} onClick={() => router.push("/account")}>
          Kembali ke akun
        </button>
      </div>
    );
  }

  return (
    <div className="page" style={{ textAlign: "center" }}>
      <h1 style={{ fontSize: 17, margin: "0 0 4px" }}>Scan untuk bayar</h1>
      <p style={{ fontSize: 12, color: "var(--ink-soft)", marginBottom: 16 }}>
        Buka aplikasi e-wallet/mobile banking kamu, pilih scan QRIS.
      </p>

      <div className="card" style={{ display: "inline-block", padding: 16, marginBottom: 16 }}>
        {data.qr_url ? (
          <img src={data.qr_url} alt="QR code pembayaran" width={220} height={220} />
        ) : (
          <p style={{ fontSize: 12, color: "var(--ink-soft)" }}>QR tidak tersedia.</p>
        )}
      </div>

      <p style={{ fontSize: 20, fontWeight: 800, color: "var(--blue-deep)", marginBottom: 6 }}>{rupiah(data.jumlah)}</p>
      <p style={{ fontSize: 11, color: "var(--ink-soft)", marginBottom: 20 }}>QR berlaku sekitar 15 menit</p>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, fontSize: 12.5, color: "var(--ink-soft)" }}>
        <Loader2 size={14} className="spin" /> Menunggu pembayaran...
      </div>
    </div>
  );
}