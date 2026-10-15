// Titik lokasi toko/gudang kamu. GANTI dengan koordinat asli tempat kamu kirim barang
// (Google Maps: klik kanan lokasi outlet > koordinat muncul di atas menu).
export const STORE_LOCATION = { lat: -0.789, lng: 113.9213 };

// Jarak dipakai kalau alamat tujuan belum punya koordinat presisi (alamat lama).
const FALLBACK_DISTANCE_KM = 5;

// Hitung jarak garis lurus antar dua titik koordinat (km) pakai formula Haversine.
export function haversineDistance(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export function getDistanceKm(address) {
  if (!address?.latitude || !address?.longitude) return FALLBACK_DISTANCE_KM;
  return haversineDistance(STORE_LOCATION.lat, STORE_LOCATION.lng, address.latitude, address.longitude);
}

// ===== Rumus harga: bertingkat, murah untuk jarak dekat, naik untuk jarak jauh =====
// 0-3km   : Rp3.000
// 3-6km   : Rp6.000
// 6-10km  : Rp10.000
// 10-15km : Rp15.000
// >15km   : Rp15.000 + Rp1.500/km tambahan tiap km di atas 15km
const roundTo500 = (n) => Math.ceil(n / 500) * 500;

export function calcNormalFee(distanceKm) {
  if (distanceKm <= 3) return 3000;
  if (distanceKm <= 6) return 6000;
  if (distanceKm <= 10) return 10000;
  if (distanceKm <= 15) return 15000;
  return roundTo500(15000 + (distanceKm - 15) * 1500);
}

// Fast delivery: 2x lipat harga normal, minimum Rp12.000.
const FAST_MULTIPLIER = 2;
const FAST_MIN = 12000;

export function calcFastFee(distanceKm) {
  return Math.max(FAST_MIN, roundTo500(calcNormalFee(distanceKm) * FAST_MULTIPLIER));
}

const SCHEDULE_FEE = 3000;

export function getShippingOptions(distanceKm) {
  const normalFee = calcNormalFee(distanceKm);
  const fastFee = calcFastFee(distanceKm);
  return [
    {
      id: "fast",
      label: "Fast Delivery",
      desc: "Tiba ~15 menit setelah pembayaran sukses",
      price: fastFee,
    },
    {
      id: "normal",
      label: "Normal Delivery",
      desc: "Estimasi 1-3 jam, tergantung ketersediaan kurir",
      price: normalFee,
    },
    {
      id: "santai",
      label: "Delivery Nyantai",
      desc: "Gratis ongkir, estimasi 1-3 jam tanpa prioritas antrean",
      price: 0,
    },
    {
      id: "jadwal",
      label: "Jadwalin Pengiriman",
      desc: "Pilih hari & jam kedatangan sendiri",
      price: normalFee + SCHEDULE_FEE,
    },
  ];
}

// ===== Slot waktu untuk fitur jadwalin =====
// Kelipatan 2 jam, slot terakhir 18:00-20:00 (maksimal jam 8 malam).
export const TIME_SLOTS = [
  "08:00 - 10:00", "10:00 - 12:00", "12:00 - 14:00",
  "14:00 - 16:00", "16:00 - 18:00", "18:00 - 20:00",
];

// Slot hari ini yang masih valid, dikasih buffer 1 jam dari sekarang.
export function availableSlotsForToday() {
  const now = new Date();
  const bufferMinutes = 60;
  return TIME_SLOTS.filter((slot) => {
    const startHour = Number(slot.split(" - ")[0].split(":")[0]);
    const slotStart = new Date(now);
    slotStart.setHours(startHour, 0, 0, 0);
    return slotStart.getTime() - now.getTime() >= bufferMinutes * 60 * 1000;
  });
}

// Ubah pilihan hari ("today"/"tomorrow") + slot ("08:00 - 10:00") jadi timestamp ISO
export function slotToTimestamp(day, slot) {
  const startHour = Number(slot.split(" - ")[0].split(":")[0]);
  const date = new Date();
  if (day === "tomorrow") date.setDate(date.getDate() + 1);
  date.setHours(startHour, 0, 0, 0);
  return date.toISOString();
}

// Estimasi tiba (dipanggil dari server setelah payment sukses)
export function calcEstimasiTiba(metode, paidAt, jadwalKirim) {
  const base = new Date(paidAt);
  if (metode === "fast") return new Date(base.getTime() + 15 * 60 * 1000);
  if (metode === "normal") return new Date(base.getTime() + 3 * 60 * 60 * 1000);
  if (metode === "santai") return new Date(base.getTime() + 3 * 60 * 60 * 1000);
  if (metode === "jadwal" && jadwalKirim) return new Date(jadwalKirim);
  return new Date(base.getTime() + 3 * 60 * 60 * 1000);
}