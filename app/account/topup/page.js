"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../../lib/supabase";
import { ArrowLeft } from "lucide-react";

const MIN_TOPUP = 15000;
const MAX_TOPUP = 500000;
const PRESETS = [15000, 25000, 50000, 100000, 250000, 500000];

const rupiah = (n) => "Rp" + Number(n).toLocaleString("id-ID");

export default function TopupPage() {
  const router = useRouter();
  const [amount, setAmount] = useState(50000);
  const [custom, setCustom] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const chooseCustom = (val) => {
    const num = Number(val.replace(/[^0-9]/g, ""));
    setCustom(val.replace(/[^0-9]/g, ""));
    setAmount(num);
  };

  const submit = async () => {
    setError("");
    if (!amount || amount < MIN_TOPUP) {
      setError(`Minimum top up ${rupiah(MIN_TOPUP)}.`);
      return;
    }
    if (amount > MAX_TOPUP) {
      setError(`Maksimum top up ${rupiah(MAX_TOPUP)}.`);
      return;
    }

    setLoading(true);
    const {
      data: { session },
    } = await supabase.auth.getSession();

    const res = await fetch("/api/topup", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` },
      body: JSON.stringify({ amount }),
    });
    const data = await res.json();
    setLoading(false);

    if (data.error) {
      setError(data.error);
      return;
    }
    router.push(`/account/topup/qris?topupId=${data.topupId}`);
  };

  return (
    <div className="page">
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
        <button onClick={() => router.back()} style={{ background: "none", border: "none" }}>
          <ArrowLeft size={18} />
        </button>
        <h1 style={{ fontSize: 17, margin: 0 }}>Top up saldo</h1>
      </div>

      <p style={{ fontSize: 12, color: "var(--ink-soft)", margin: "0 0 14px" }}>
        Minimum {rupiah(MIN_TOPUP)}, maksimum {rupiah(MAX_TOPUP)} per transaksi.
      </p>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 14 }}>
        {PRESETS.map((p) => (
          <button
            key={p}
            onClick={() => {
              setAmount(p);
              setCustom("");
            }}
            style={{
              padding: "14px 8px", borderRadius: 14, fontSize: 13, fontWeight: 700,
              border: amount === p && !custom ? "1.5px solid var(--blue)" : "1px solid var(--line)",
              background: amount === p && !custom ? "#eaf1ff" : "#fff",
              color: amount === p && !custom ? "var(--blue)" : "var(--ink)",
            }}
          >
            {rupiah(p)}
          </button>
        ))}
      </div>

      <p style={{ fontSize: 12, fontWeight: 700, margin: "0 0 8px" }}>Atau masukkan jumlah lain</p>
      <div style={{ display: "flex", alignItems: "center", gap: 8, border: "1px solid var(--line)", borderRadius: 14, padding: "11px 14px", marginBottom: 16 }}>
        <span style={{ fontSize: 13, color: "var(--ink-soft)" }}>Rp</span>
        <input
          type="text"
          inputMode="numeric"
          placeholder="Nominal bebas"
          value={custom}
          onChange={(e) => chooseCustom(e.target.value)}
          style={{ border: "none", outline: "none", flex: 1, fontSize: 13 }}
        />
      </div>

      <div className="card" style={{ marginBottom: 16, textAlign: "center" }}>
        <p style={{ margin: "0 0 2px", fontSize: 11, color: "var(--ink-soft)" }}>Jumlah top up</p>
        <p style={{ margin: 0, fontSize: 20, fontWeight: 800, color: "var(--blue-deep)" }}>{rupiah(amount || 0)}</p>
      </div>

      {error && <p style={{ color: "#c4342f", fontSize: 12, marginBottom: 12 }}>{error}</p>}

      <button className="btn-primary" style={{ width: "100%" }} onClick={submit} disabled={loading}>
        {loading ? "Membuat QRIS..." : "Lanjut ke pembayaran QRIS"}
      </button>
    </div>
  );
}