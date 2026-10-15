"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ShoppingBag, Truck, Gift, ChevronRight } from "lucide-react";
import { setOnboardingDone } from "../../lib/onboarding";

const SLIDES = [
  {
    icon: ShoppingBag,
    title: "Belanja kebutuhan harian",
    desc: "Ribuan produk minuman, makanan, hingga alat mandi tinggal beberapa ketukan dari rumahmu.",
  },
  {
    icon: Truck,
    title: "Pesanan cepat sampai",
    desc: "Lacak status pesananmu secara langsung, dari diproses sampai diterima.",
  },
  {
    icon: Gift,
    title: "Poin & voucher tiap belanja",
    desc: "Kumpulkan poin dari setiap transaksi lalu tukar dengan voucher menarik.",
  },
];

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);

  const isLast = step === SLIDES.length - 1;
  const slide = SLIDES[step];
  const Icon = slide.icon;

  const finish = () => {
    setOnboardingDone();
    router.replace("/login");
  };

  const next = () => {
    if (isLast) finish();
    else setStep((s) => s + 1);
  };

  return (
    <div className="page onboarding-page">
      <div style={{ textAlign: "right" }}>
        {!isLast && (
          <button className="link-reset" onClick={finish}>
            Lewati
          </button>
        )}
      </div>

      <div className="onboarding-art">
        <Icon size={64} color="#fff" />
      </div>

      <h1 className="onboarding-title">{slide.title}</h1>
      <p className="onboarding-desc">{slide.desc}</p>

      <div className="onboarding-dots">
        {SLIDES.map((_, i) => (
          <span key={i} className={`onboarding-dot ${i === step ? "onboarding-dot-active" : ""}`} />
        ))}
      </div>

      <button className="btn-primary onboarding-next" onClick={next}>
        {isLast ? "Mulai sekarang" : "Lanjut"}
        <ChevronRight size={16} />
      </button>
    </div>
  );
}