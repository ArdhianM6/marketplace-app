"use client";
import { useEffect, useRef, useState } from "react";

/**
 * Animasi angka naik dari 0 (atau nilai sebelumnya) ke nilai baru.
 * Dipakai untuk saldo, poin, jumlah item, dsb supaya perubahan angka
 * terasa hidup, bukan langsung "loncat".
 *
 * Props:
 * - value: number  -> nilai akhir yang ingin ditampilkan
 * - duration: ms    -> lama animasi (default 600ms)
 * - format: (n) => string -> fungsi format tampilan (default: angka biasa)
 */
export default function CountUp({ value = 0, duration = 600, format }) {
  const [display, setDisplay] = useState(0);
  const fromRef = useRef(0);
  const frameRef = useRef(null);

  useEffect(() => {
    const from = fromRef.current;
    const to = Number(value) || 0;
    const start = performance.now();

    if (frameRef.current) cancelAnimationFrame(frameRef.current);

    function tick(now) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      // easeOutCubic biar berhenti dengan halus, bukan tiba-tiba
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = from + (to - from) * eased;
      setDisplay(current);

      if (progress < 1) {
        frameRef.current = requestAnimationFrame(tick);
      } else {
        fromRef.current = to;
      }
    }

    frameRef.current = requestAnimationFrame(tick);
    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const rounded = Math.round(display);
  return (
    <span className="count-up-value">
      {format ? format(rounded) : rounded.toLocaleString("id-ID")}
    </span>
  );
}