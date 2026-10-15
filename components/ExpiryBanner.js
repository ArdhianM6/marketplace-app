"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Clock, X } from "lucide-react";
import { supabase } from "../lib/supabase";

const WARNING_DAYS = 3; // tampilkan banner kalau voucher hangus dalam 3 hari ke depan

export default function ExpiryBanner() {
  const [items, setItems] = useState([]);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) return;

    const now = new Date();
    const soon = new Date(now.getTime() + WARNING_DAYS * 24 * 60 * 60 * 1000);

    const { data } = await supabase
      .from("user_vouchers")
      .select("id, expires_at, vouchers(judul)")
      .eq("user_id", session.user.id)
      .eq("status", "available")
      .gt("expires_at", now.toISOString())
      .lte("expires_at", soon.toISOString())
      .order("expires_at", { ascending: true });

    setItems(data || []);
  }

  if (dismissed || items.length === 0) return null;

  const sisaHari = (exp) =>
    Math.max(1, Math.ceil((new Date(exp) - new Date()) / (1000 * 60 * 60 * 24)));
  const first = items[0];

  return (
    <Link href="/account/vouchers" className="expiry-banner">
      <div className="expiry-banner-icon">
        <Clock size={18} />
      </div>
      <div className="expiry-banner-text">
        <p className="expiry-banner-title">
          {items.length === 1
            ? `Voucher "${first.vouchers?.judul}" segera hangus!`
            : `${items.length} voucher kamu segera hangus!`}
        </p>
        <p className="expiry-banner-sub">
          Berlaku {sisaHari(first.expires_at)} hari lagi. Yuk pakai sebelum kadaluarsa.
        </p>
      </div>
      <button
        className="expiry-banner-close"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setDismissed(true);
        }}
        aria-label="Tutup"
      >
        <X size={14} />
      </button>
    </Link>
  );
}