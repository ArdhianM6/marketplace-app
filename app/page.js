"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ShoppingBag } from "lucide-react";
import { supabase } from "../lib/supabase";
import { hasSeenOnboarding } from "../lib/onboarding";
import { applyReferralCode, getPendingReferralCode, clearPendingReferralCode } from "../lib/referral";

export default function RootPage() {
  const router = useRouter();
  const [fade, setFade] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function decide() {
      const { data } = await supabase.auth.getSession();
      const session = data.session;

      if (session) {
        const pendingCode = getPendingReferralCode();
        if (pendingCode) {
          await applyReferralCode(session.user.id, pendingCode);
          clearPendingReferralCode();
        }
      }

      const target = session ? "/home" : hasSeenOnboarding() ? "/login" : "/onboarding";

      // Splash tampil sebentar biar tidak "kedip" walau cek sesi sangat cepat.
      setTimeout(() => {
        if (cancelled) return;
        setFade(true);
        setTimeout(() => {
          if (!cancelled) router.replace(target);
        }, 250);
      }, 900);
    }

    decide();
    return () => {
      cancelled = true;
    };
  }, [router]);

  return (
    <div className={`splash-screen ${fade ? "splash-fade-out" : ""}`}>
      <div className="splash-logo">
        <ShoppingBag size={34} color="#fff" />
      </div>
      <p className="splash-title">Marketplace App</p>
      <p className="splash-sub">Belanja gampang, hemat, dan cepat</p>
      <div className="splash-loader" />
    </div>
  );
}