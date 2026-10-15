"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";
import { applyReferralCode, setPendingReferralCode } from "../../lib/referral";
import { UserPlus, Mail, Eye, EyeOff, Phone, User, Check, Gift } from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [nama, setNama] = useState("");
  const [noHp, setNoHp] = useState("");
  const [refCode, setRefCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const goToStep2 = (e) => {
    e.preventDefault();
    setError("");
    setStep(2);
  };

  const finishRegister = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) {
      setLoading(false);
      setError(error.message);
      return;
    }

    // Kalau project Supabase kamu mewajibkan konfirmasi email, session belum ada
    // di titik ini — user harus klik link konfirmasi dulu sebelum bisa login.
    if (data.session) {
      await supabase
        .from("profiles")
        .update({ nama, no_hp: noHp })
        .eq("id", data.user.id);

      if (refCode.trim()) {
        await applyReferralCode(data.user.id, refCode.trim());
      }

      setLoading(false);
      router.push("/home");
    } else {
      // Belum ada sesi (masih perlu verifikasi email) — simpan kode referral dulu,
      // nanti otomatis diterapkan begitu user berhasil login (lihat app/page.js).
      if (refCode.trim()) setPendingReferralCode(refCode.trim());
      setLoading(false);
      setError("Cek email kamu untuk konfirmasi akun sebelum login.");
    }
  };

  return (
    <div className="page" style={{ paddingTop: 56, paddingBottom: 40 }}>
      <div
        style={{
          width: 56, height: 56, borderRadius: 18, background: "var(--coral)",
          display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 20,
          boxShadow: "0 10px 22px rgba(255,106,77,0.35)",
        }}
      >
        <UserPlus size={26} color="#fff" />
      </div>

      <h1 style={{ fontSize: 23, margin: "0 0 4px", fontWeight: 800 }}>Buat akun baru</h1>
      <p style={{ color: "var(--ink-soft)", fontSize: 12.5, margin: "0 0 20px" }}>
        Daftar sekarang dan nikmati promo spesial member baru.
      </p>

      <div className="step-indicator">
        <div
          className="step-dot"
          style={{
            background: step >= 1 ? "var(--coral)" : "var(--line)",
            color: step >= 1 ? "#fff" : "var(--ink-soft)",
          }}
        >
          {step > 1 ? <Check size={14} /> : "1"}
        </div>
        <div className="step-line" style={{ background: step > 1 ? "var(--coral)" : "var(--line)" }} />
        <div
          className="step-dot"
          style={{
            background: step >= 2 ? "var(--coral)" : "var(--line)",
            color: step >= 2 ? "#fff" : "var(--ink-soft)",
          }}
        >
          2
        </div>
      </div>

      {step === 1 && (
        <form onSubmit={goToStep2} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <p style={{ fontSize: 12, fontWeight: 700, color: "var(--ink)", margin: 0 }}>
            Langkah 1: Email & kata sandi
          </p>
          <div style={{ display: "flex", alignItems: "center", gap: 8, border: "1px solid var(--line)", borderRadius: 14, padding: "11px 14px" }}>
            <Mail size={15} color="#a7b0c6" />
            <input
              type="email"
              required
              placeholder="Alamat email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{ border: "none", outline: "none", flex: 1, fontSize: 13 }}
            />
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, border: "1px solid var(--line)", borderRadius: 14, padding: "11px 14px" }}>
            <input
              type={showPw ? "text" : "password"}
              required
              minLength={6}
              placeholder="Buat kata sandi (min. 6 karakter)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{ border: "none", outline: "none", flex: 1, fontSize: 13 }}
            />
            <span onClick={() => setShowPw(!showPw)} style={{ cursor: "pointer" }}>
              {showPw ? <EyeOff size={15} color="#a7b0c6" /> : <Eye size={15} color="#a7b0c6" />}
            </span>
          </div>
          <button
            type="submit"
            style={{
              background: "var(--coral)", color: "#fff", border: "none", borderRadius: 14,
              padding: "12px 16px", fontWeight: 700, fontSize: 14, marginTop: 4,
              boxShadow: "0 6px 16px rgba(255,106,77,0.28)",
            }}
          >
            Lanjut
          </button>
        </form>
      )}

      {step === 2 && (
        <form onSubmit={finishRegister} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <p style={{ fontSize: 12, fontWeight: 700, color: "var(--ink)", margin: 0 }}>
            Langkah 2: Lengkapi profil
          </p>
          <div style={{ display: "flex", alignItems: "center", gap: 8, border: "1px solid var(--line)", borderRadius: 14, padding: "11px 14px" }}>
            <User size={15} color="#a7b0c6" />
            <input
              type="text"
              required
              placeholder="Nama lengkap"
              value={nama}
              onChange={(e) => setNama(e.target.value)}
              style={{ border: "none", outline: "none", flex: 1, fontSize: 13 }}
            />
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, border: "1px solid var(--line)", borderRadius: 14, padding: "11px 14px" }}>
            <Phone size={15} color="#a7b0c6" />
            <input
              type="tel"
              required
              placeholder="Nomor HP"
              value={noHp}
              onChange={(e) => setNoHp(e.target.value)}
              style={{ border: "none", outline: "none", flex: 1, fontSize: 13 }}
            />
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, border: "1px solid var(--line)", borderRadius: 14, padding: "11px 14px" }}>
            <Gift size={15} color="#a7b0c6" />
            <input
              type="text"
              placeholder="Kode referral (opsional)"
              value={refCode}
              onChange={(e) => setRefCode(e.target.value.toUpperCase())}
              style={{ border: "none", outline: "none", flex: 1, fontSize: 13, textTransform: "uppercase" }}
            />
          </div>
          {error && <p style={{ color: "#c4342f", fontSize: 12 }}>{error}</p>}
          <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
            <button
              type="button"
              onClick={() => setStep(1)}
              className="btn-secondary"
              style={{ flex: 1 }}
            >
              Kembali
            </button>
            <button
              type="submit"
              disabled={loading}
              style={{
                flex: 2, background: "var(--coral)", color: "#fff", border: "none", borderRadius: 14,
                padding: "12px 16px", fontWeight: 700, fontSize: 14,
                boxShadow: "0 6px 16px rgba(255,106,77,0.28)", opacity: loading ? 0.6 : 1,
              }}
            >
              {loading ? "Memproses..." : "Daftar"}
            </button>
          </div>
        </form>
      )}

      <p style={{ textAlign: "center", fontSize: 12, marginTop: 16 }}>
        Sudah punya akun?{" "}
        <a href="/login" style={{ color: "var(--blue)", fontWeight: 700 }}>
          Masuk
        </a>
      </p>
    </div>
  );
}