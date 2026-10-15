// Reverse geocoding gratis pakai Nominatim (OpenStreetMap).
// Catatan: layanan gratis ini ada batas 1 request/detik, cukup untuk skala kecil.
// Kalau nanti trafik besar, pertimbangkan pindah ke Google Geocoding API (berbayar).
export async function reverseGeocode(lat, lon) {
  const res = await fetch(
    `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&addressdetails=1`
  );
  if (!res.ok) throw new Error("Gagal mengambil nama alamat dari lokasi.");
  const data = await res.json();
  return {
    alamat_lengkap: data.display_name || "",
    kota:
      data.address?.city ||
      data.address?.town ||
      data.address?.county ||
      data.address?.village ||
      "",
    kode_pos: data.address?.postcode || "",
  };
}