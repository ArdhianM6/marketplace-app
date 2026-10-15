"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";
import { ShoppingBag, Mail, Eye, EyeOff, Facebook } from "lucide-react";

function GoogleG() {
  return (
    <svg width="16" height="16" viewBox="0 0 48 48">
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.3 29.3 35 24 35c-6.1 0-11-4.9-11-11s4.9-11 11-11c2.8 0 5.3 1 7.3 2.7l5.7-5.7C33.5 6.6 29 5 24 5 13.5 5 5 13.5 5 24s8.5 19 19 19 19-8.5 19-19c0-1.2-.1-2.4-.4-3.5z"/>
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.6 15.9 18.9 13 24 13c2.8 0 5.3 1 7.3 2.7l5.7-5.7C33.5 6.6 29 5 24 5c-7.7 0-14.3 4.4-17.7 9.7z"/>
      <path fill="#4CAF50" d="M24 43c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 34.2 26.7 35 24 35c-5.3 0-9.7-3.4-11.3-8.1l-6.5 5C9.6 38.5 16.2 43 24 43z"/>
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.3 4.3-4.3 5.6l6.2 5.2C40.5 36.2 43 30.6 43 24c0-1.2-.1-2.4-.4-3.5z"/>
    </svg>
  );
}

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const loginWithProvider = async (provider) => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: `${window.location.origin}/home` },
    });
    if (error) setError(error.message);
  };

  const submitEmail = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
    router.push("/home");
  };

  return (
    <div className="page" style={{ paddingTop: 56, paddingBottom: 40 }}>
      <div
        style={{
          width: 56, height: 56, borderRadius: 18, background: "var(--blue)",
          display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 20,
          boxShadow: "0 10px 22px rgba(47,111,237,0.35)",
        }}
      >
        <ShoppingBag size={26} color="#fff" />
      </div>

      <h1 style={{ fontSize: 23, margin: "0 0 4px", fontWeight: 800 }}>Masuk ke akun</h1>
      <p style={{ color: "var(--ink-soft)", fontSize: 12.5, margin: "0 0 22px" }}>
        Belanja kebutuhan harianmu jadi lebih mudah.
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 18 }}>
        <button
          className="btn-secondary"
          style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}
          onClick={() => loginWithProvider("google")}
        >
          <GoogleG /> Lanjutkan dengan Google
        </button>
        <button
          className="btn-secondary"
          style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}
          onClick={() => loginWithProvider("facebook")}
        >
          <Facebook size={16} color="#1877F2" /> Lanjutkan dengan Facebook
        </button>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "4px 0 18px" }}>
        <div style={{ flex: 1, height: 1, background: "var(--line)" }} />
        <span style={{ fontSize: 11, color: "#a7b0c6" }}>atau dengan email</span>
        <div style={{ flex: 1, height: 1, background: "var(--line)" }} />
      </div>

      <form onSubmit={submitEmail} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
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
            placeholder="Kata sandi"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{ border: "none", outline: "none", flex: 1, fontSize: 13 }}
          />
          <span onClick={() => setShowPw(!showPw)} style={{ cursor: "pointer" }}>
            {showPw ? <EyeOff size={15} color="#a7b0c6" /> : <Eye size={15} color="#a7b0c6" />}
          </span>
        </div>
        {error && <p style={{ color: "#c4342f", fontSize: 12 }}>{error}</p>}
        <button type="submit" className="btn-primary" style={{ marginTop: 4 }} disabled={loading}>
          {loading ? "Memproses..." : "Masuk"}
        </button>
      </form>

      <p style={{ textAlign: "center", fontSize: 12, marginTop: 16 }}>
        Belum punya akun?{" "}
        <a href="/register" style={{ color: "var(--coral)", fontWeight: 700 }}>
          Daftar
        </a>
      </p>
    </div>
  );
}