// Menyimpan status "sudah lihat onboarding" di localStorage.
// Dipakai supaya slide onboarding cuma muncul sekali di HP yang sama.
const KEY = "marketplace_onboarding_done";

export function hasSeenOnboarding() {
  if (typeof window === "undefined") return true;
  return localStorage.getItem(KEY) === "1";
}

export function setOnboardingDone() {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY, "1");
}