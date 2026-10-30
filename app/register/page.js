"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "../../lib/supabase";
import { applyReferralCode, setPendingReferralCode } from "../../lib/referral";
import { ShoppingBag, Mail, Eye, EyeOff, Phone, User, Check, Gift, ArrowLeft, ArrowRight, Sparkles, ShieldCheck, X, CircleCheck } from "lucide-react";

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
  const [notice, setNotice] = useState(null);

  const goToStep2 = (e) => {
    e.preventDefault();
    setError("");
    setStep(2);
  };

  const finishRegister = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: nama, phone: noHp } },
    });

    if (signUpError) {
      setLoading(false);
      setError(signUpError.message);
      return;
    }

    if (data.session) {
      await supabase.from("profiles").update({ nama, no_hp: noHp }).eq("id", data.user.id);
      if (refCode.trim()) await applyReferralCode(data.user.id, refCode.trim());
      setLoading(false);
      setNotice({
        title: "Akunmu siap!",
        message: "Profil berhasil dibuat. Kamu bisa mulai menjelajahi produk dan promo sekarang.",
        action: () => router.replace("/home"),
      });
    } else {
      if (refCode.trim()) setPendingReferralCode(refCode.trim());
      setLoading(false);
      setNotice({
        title: "Cek email untuk konfirmasi",
        message: `Kami mengirim tautan verifikasi ke ${email}. Konfirmasi emailmu sebelum masuk ke akun.`,
        action: () => router.replace("/login"),
        actionLabel: "Kembali ke masuk",
      });
    }
  };

  return (
    <main className="auth-page register-page">
      <section className="auth-story register-story" aria-label="PasarKita">
        <Link href="/" className="auth-brand"><span className="auth-brand-mark"><ShoppingBag size={20} /></span><span>Pasar<span className="auth-brand-accent">Kita</span></span></Link>
        <div className="auth-story-copy">
          <span className="auth-story-kicker"><Sparkles size={14} /> Awali belanja lebih hemat</span>
          <h1>Belanja nyaman,<br /><span>untungnya terasa.</span></h1>
          <p>Buat akun untuk menyimpan favorit, memantau pesanan, dan menikmati promo khusus pelanggan.</p>
        </div>
        <div className="auth-story-note"><span className="auth-note-icon"><ShieldCheck size={17} /></span><span><strong>Data akunmu terlindungi</strong><small>Informasi hanya digunakan untuk pengalaman belanja.</small></span></div>
        <div className="auth-orbit auth-orbit-one" /><div className="auth-orbit auth-orbit-two" /><div className="auth-orbit auth-orbit-three" />
      </section>

      <section className="auth-panel register-panel">
        <div className="auth-form-wrap register-form-wrap">
          <Link href="/" className="auth-mobile-brand"><span className="auth-brand-mark"><ShoppingBag size={20} /></span>Pasar<span className="auth-brand-accent">Kita</span></Link>
          <div className="auth-heading register-heading"><span className="auth-overline">Bergabung dengan PasarKita</span><h2>Buat akun baru</h2><p>Hanya beberapa langkah untuk mulai belanja.</p></div>

          <div className="register-progress" aria-label={`Langkah ${step} dari 2`}>
            <div className={`register-progress-step ${step === 1 ? "active" : "complete"}`}><span>{step > 1 ? <Check size={14} /> : "1"}</span><div><strong>Akun</strong><small>Email dan kata sandi</small></div></div>
            <div className={`register-progress-line ${step === 2 ? "complete" : ""}`} />
            <div className={`register-progress-step ${step === 2 ? "active" : ""}`}><span>2</span><div><strong>Profil</strong><small>Nama dan nomor HP</small></div></div>
          </div>

          {step === 1 ? (
            <form onSubmit={goToStep2} className="auth-form register-form">
              <label className="auth-field"><span>Email</span><span className="auth-input-wrap"><Mail size={17} /><input type="email" required autoComplete="email" placeholder="nama@email.com" value={email} onChange={(e) => setEmail(e.target.value)} /></span></label>
              <label className="auth-field"><span>Kata sandi</span><span className="auth-input-wrap"><input type={showPw ? "text" : "password"} required minLength={6} autoComplete="new-password" placeholder="Minimal 6 karakter" value={password} onChange={(e) => setPassword(e.target.value)} /><button type="button" className="auth-password-toggle" onClick={() => setShowPw(!showPw)} aria-label={showPw ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"}>{showPw ? <EyeOff size={17} /> : <Eye size={17} />}</button></span><small className="register-field-hint">Gunakan minimal 6 karakter.</small></label>
              {error && <p className="auth-error" role="alert">{error}</p>}
              <button type="submit" className="auth-submit">Lanjut isi profil <ArrowRight size={17} /></button>
            </form>
          ) : (
            <form onSubmit={finishRegister} className="auth-form register-form">
              <label className="auth-field"><span>Nama lengkap</span><span className="auth-input-wrap"><User size={17} /><input type="text" required autoComplete="name" placeholder="Nama yang ingin kami gunakan" value={nama} onChange={(e) => setNama(e.target.value)} /></span></label>
              <label className="auth-field"><span>Nomor ponsel</span><span className="auth-input-wrap"><Phone size={17} /><input type="tel" required autoComplete="tel" inputMode="tel" placeholder="08xxxxxxxxxx" value={noHp} onChange={(e) => setNoHp(e.target.value)} /></span></label>
              <label className="auth-field"><span>Kode referral <em>Opsional</em></span><span className="auth-input-wrap"><Gift size={17} /><input type="text" autoCapitalize="characters" placeholder="Masukkan kode teman" value={refCode} onChange={(e) => setRefCode(e.target.value.toUpperCase())} /></span></label>
              {error && <p className="auth-error" role="alert">{error}</p>}
              <div className="register-actions"><button type="button" className="btn-secondary register-back" onClick={() => { setError(""); setStep(1); }}><ArrowLeft size={15} /> Kembali</button><button type="submit" className="auth-submit" disabled={loading}>{loading ? "Membuat akun�" : <>Buat akun <ArrowRight size={17} /></>}</button></div>
            </form>
          )}

          <p className="auth-register">Sudah punya akun? <Link href="/login">Masuk</Link></p>
          <p className="auth-terms">Dengan mendaftar, kamu menyetujui ketentuan layanan dan kebijakan privasi kami.</p>
        </div>
      </section>

      {notice && <div className="register-modal-backdrop" onClick={() => setNotice(null)}><section className="register-modal" role="dialog" aria-modal="true" aria-labelledby="register-modal-title" onClick={(e) => e.stopPropagation()}><button className="register-modal-close" onClick={() => setNotice(null)} aria-label="Tutup"><X size={18} /></button><span className="register-modal-icon"><CircleCheck size={25} /></span><h2 id="register-modal-title">{notice.title}</h2><p>{notice.message}</p><button className="auth-submit" onClick={notice.action}>{notice.actionLabel || "Mulai belanja"}<ArrowRight size={17} /></button></section></div>}
    </main>
  );
}

