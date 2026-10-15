"use client";
import { Star } from "lucide-react";

export default function StarRating({ value = 0, onChange, size = 16, readOnly = false }) {
  const stars = [1, 2, 3, 4, 5];
  const interactive = !readOnly && typeof onChange === "function";

  return (
    <div className="star-rating" role={interactive ? "radiogroup" : undefined} aria-label="Rating">
      {stars.map((s) => (
        <button
          key={s}
          type="button"
          className="star-rating-btn"
          disabled={!interactive}
          onClick={() => interactive && onChange(s)}
          aria-label={`${s} dari 5 bintang`}
        >
          <Star
            size={size}
            fill={s <= Math.round(value) ? "var(--gold)" : "none"}
            color={s <= Math.round(value) ? "var(--gold)" : "#c3cadd"}
          />
        </button>
      ))}
    </div>
  );
}