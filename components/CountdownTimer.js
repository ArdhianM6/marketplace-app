"use client";
import { useEffect, useState } from "react";

function getRemaining(target) {
  const diff = new Date(target).getTime() - Date.now();
  return Math.max(0, diff);
}

function formatDuration(ms) {
  const totalSeconds = Math.floor(ms / 1000);
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  const pad = (n) => String(n).padStart(2, "0");
  return h > 0 ? `${pad(h)}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
}

export default function CountdownTimer({ target, onExpire, className = "" }) {
  const [remaining, setRemaining] = useState(() => getRemaining(target));

  useEffect(() => {
    const interval = setInterval(() => {
      const left = getRemaining(target);
      setRemaining(left);
      if (left <= 0) {
        clearInterval(interval);
        onExpire?.();
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [target, onExpire]);

  if (remaining <= 0) return null;

  return <span className={className}>{formatDuration(remaining)}</span>;
}