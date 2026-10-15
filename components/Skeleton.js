export function SkeletonBlock({ height = 14, width = "100%", radius = 10, style = {} }) {
  return <div className="skeleton" style={{ height, width, borderRadius: radius, ...style }} />;
}

// Beberapa baris kartu skeleton, dipakai di halaman daftar (akun, voucher, alamat, dll)
export function SkeletonCardList({ count = 3, lineHeight = 14 }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="card">
          <SkeletonBlock height={lineHeight} width="60%" style={{ marginBottom: 8 }} />
          <SkeletonBlock height={lineHeight - 2} width="90%" />
        </div>
      ))}
    </div>
  );
}