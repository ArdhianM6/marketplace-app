import { supabase } from "./supabase";

const PENDING_KEY = "marketplace_pending_referral";

export function setPendingReferralCode(code) {
  if (typeof window === "undefined" || !code) return;
  localStorage.setItem(PENDING_KEY, code.trim().toUpperCase());
}

export function getPendingReferralCode() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(PENDING_KEY);
}

export function clearPendingReferralCode() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(PENDING_KEY);
}

// Terapkan kode referral ke akun user. Aman dipanggil berkali-kali —
// fungsi SQL apply_referral_code memastikan hanya diterapkan sekali.
export async function applyReferralCode(userId, code) {
  if (!userId || !code) return;
  await supabase.rpc("apply_referral_code", { p_user_id: userId, p_code: code });
}