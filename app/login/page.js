"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "../../lib/supabase";
import { ShoppingBag, Mail, Eye, EyeOff, ArrowRight, ShieldCheck, Sparkles, Facebook } from "lucide-react";

function GoogleG() {
  return <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true"><path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.3 29.3 35 24 35c-6.1 0-11-4.9-11-11s4.9-11 11-11c2.8 0 5.3 1 7.3 2.7l5.7-5.7C33.5 6.6 29 5 24 5 13.5 5 5 13.5 5 24s8.5 19 19 19 19-8.5 19-19c0-1.2-.1-2.4-.4-3.5z"/><path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.6 15.9 18.9 13 24 13c2.8 0 5.3 1 7.3 2.7l5.7-5.7C33.5 6.6 29 5 24 5c-7.7 0-14.3 4.4-17.7 9.7z"/><path fill="#4CAF50" d="M24 43c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 34.2 26.7 35 24 35c-5.3 0-9.7-3.4-11.3-8.1l-6.5 5C9.6 38.5 16.2 43 24 43z"/><path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.3 4.3-4.3 5.6l6.2 5.2C40.5 36.2 43 30.6 43 24c0-1.2-.1-2.4-.4-3.5z"/></svg>;
}

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const loginWithProvider = async (provider) => {
    setError("");
    const { error: authError } = await supabase.auth.signInWithOAuth({ provider, options: { redirectTo: `${window.location.origin}/home` } });
    if (authError) setError(authError.message);
  };

  const submitEmail = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const { data, error: authError } = await supabase.auth.signInWithPassword({ email, password });
    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }
    const { data: profile } = await supabase.from("profiles").select("role").eq("id", data.user.id).maybeSingle();
    router.replace(profile?.role === "admin" ? "/admin" : "/home");
  };

  return (
    <main className="auth-page">
      <section className="auth-story" aria-label="Marketplace">
        <Link href="/" className="auth-brand"><span className="auth-brand-mark"><ShoppingBag size={21} /></span><span>Pasar<span className="auth-brand-accent">Kita</span></span></Link>
        <div className="auth-story-copy">
          <span className="auth-story-kicker"><Sparkles size={14} /> Belanja jadi lebih mudah</span>
          <h1>Hal baik<br />dimulai dari<br /><span>keranjangmu.</span></h1>
          <p>Temukan kebutuhan harian pilihan, promo menarik, dan pengalaman belanja yang nyaman di satu tempat.</p>
        </div>
        <div className="auth-story-note"><span className="auth-note-icon"><ShieldCheck size={17} /></span><span><strong>Akunmu tetap aman</strong><small>Masuk untuk melihat pesanan dan favoritmu.</small></span></div>
        <div className="auth-orbit auth-orbit-one" /><div className="auth-orbit auth-orbit-two" /><div className="auth-orbit auth-orbit-three" />
      </section>

      <section className="auth-panel">
        <div className="auth-form-wrap">
          <div className="auth-mobile-brand"><span className="auth-brand-mark"><ShoppingBag size={20} /></span>Pasar<span className="auth-brand-accent">Kita</span></div>
          <div className="auth-heading"><span className="auth-overline">Selamat datang kembali</span><h2>Masuk ke akunmu</h2><p>Lanjutkan belanja dan cek aktivitas terbarumu.</p></div>

          <div className="auth-socials">
            <button type="button" className="auth-social-button" onClick={() => loginWithProvider("google")}><GoogleG /> Lanjutkan dengan Google</button>
            <button type="button" className="auth-social-button" onClick={() => loginWithProvider("facebook")}><Facebook size={18} fill="#1877F2" color="#1877F2" /> Lanjutkan dengan Facebook</button>
          </div>

          <div className="auth-divider"><span>atau masuk dengan email</span></div>

          <form onSubmit={submitEmail} className="auth-form">
            <label className="auth-field"><span>Email</span><span className="auth-input-wrap"><Mail size={17} /><input type="email" autoComplete="email" required placeholder="nama@email.com" value={email} onChange={(e) => setEmail(e.target.value)} /></span></label>
            <label className="auth-field"><span>Kata sandi</span><span className="auth-input-wrap"><input type={showPw ? "text" : "password"} autoComplete="current-password" required minLength={6} placeholder="Masukkan kata sandi" value={password} onChange={(e) => setPassword(e.target.value)} /><button type="button" className="auth-password-toggle" onClick={() => setShowPw(!showPw)} aria-label={showPw ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"}>{showPw ? <EyeOff size={17} /> : <Eye size={17} />}</button></span></label>
            {error && <p className="auth-error" role="alert">{error}</p>}
            <button type="submit" className="auth-submit" disabled={loading}>{loading ? "Memeriksa akun…" : <>Masuk <ArrowRight size={17} /></>}</button>
          </form>

          <p className="auth-register">Belum punya akun? <Link href="/register">Daftar sekarang</Link></p>
          <p className="auth-terms">Dengan masuk, kamu menyetujui ketentuan layanan dan kebijakan privasi kami.</p>
        </div>
      </section>
    </main>
  );
}
