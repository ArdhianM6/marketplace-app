"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../../lib/supabase";
import { reverseGeocode } from "../../../lib/geocode";
import { MapPin, LocateFixed } from "lucide-react";

const inputStyle = {
  border: "1px solid var(--line)",
  borderRadius: 14,
  padding: "11px 14px",
  fontSize: 13,
  fontFamily: "inherit",
};

export default function NewAddressPage() {
  const router = useRouter();
  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const markerRef = useRef(null);
  const [coords, setCoords] = useState(null);
  const [loadingLocation, setLoadingLocation] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    label: "Rumah",
    penerima: "",
    no_hp: "",
    alamat_lengkap: "",
    kota: "",
    kode_pos: "",
  });

  // Inisialisasi peta sekali saja, hanya jalan di browser (Leaflet butuh window)
  useEffect(() => {
    import("leaflet").then((L) => {
      if (mapInstance.current) return;
      const defaultCenter = [-0.789, 113.9213]; // titik tengah Indonesia sebagai default
      const map = L.map(mapRef.current).setView(defaultCenter, 5);

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "&copy; OpenStreetMap contributors",
      }).addTo(map);

      const icon = L.icon({
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
        iconSize: [25, 41],
        iconAnchor: [12, 41],
      });

      // Pengguna juga bisa tap langsung di peta untuk pindah titik lokasi manual
      map.on("click", async (e) => {
        placeMarker(L, map, icon, e.latlng.lat, e.latlng.lng);
        await fillAddressFromCoords(e.latlng.lat, e.latlng.lng);
      });

      mapInstance.current = map;
      mapInstance.current._L = L;
      mapInstance.current._icon = icon;
    });

    return () => {
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }
    };
  }, []);

  const placeMarker = (L, map, icon, lat, lng) => {
    if (markerRef.current) {
      markerRef.current.setLatLng([lat, lng]);
    } else {
      markerRef.current = L.marker([lat, lng], { icon }).addTo(map);
    }
    map.setView([lat, lng], 16);
    setCoords({ lat, lng });
  };

  const fillAddressFromCoords = async (lat, lng) => {
    try {
      const alamat = await reverseGeocode(lat, lng);
      setForm((f) => ({ ...f, ...alamat }));
    } catch {
      setError("Titik lokasi tersimpan, tapi gagal mengambil nama alamatnya otomatis. Isi manual ya.");
    }
  };

  // Tombol utama: minta izin GPS ke browser/HP
  const useCurrentLocation = () => {
    if (!navigator.geolocation) {
      setError("Perangkat atau browser kamu tidak mendukung deteksi lokasi.");
      return;
    }
    setLoadingLocation(true);
    setError("");
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        const map = mapInstance.current;
        if (map) placeMarker(map._L, map, map._icon, latitude, longitude);
        await fillAddressFromCoords(latitude, longitude);
        setLoadingLocation(false);
      },
      (err) => {
        setLoadingLocation(false);
        if (err.code === err.PERMISSION_DENIED) {
          setError("Izin lokasi ditolak. Aktifkan izin lokasi untuk situs ini di pengaturan browser/HP kamu.");
        } else {
          setError("Gagal mendapatkan lokasi: " + err.message);
        }
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    const {
      data: { session },
    } = await supabase.auth.getSession();

    const { error } = await supabase.from("addresses").insert({
      user_id: session.user.id,
      ...form,
      latitude: coords?.lat ?? null,
      longitude: coords?.lng ?? null,
    });
    setSaving(false);
    if (error) {
      setError(error.message);
      return;
    }
    router.push("/cart");
  };

  return (
    <div className="page">
      <h1 style={{ fontSize: 17, margin: "0 0 4px" }}>Tambah alamat</h1>
      <p style={{ fontSize: 12, color: "var(--ink-soft)", margin: "0 0 16px" }}>
        Aktifkan lokasi supaya alamat terisi otomatis, atau ketuk peta untuk pindah titik.
      </p>

      <button
        type="button"
        onClick={useCurrentLocation}
        className="btn-secondary"
        style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, width: "100%", marginBottom: 12 }}
        disabled={loadingLocation}
      >
        <LocateFixed size={16} color="var(--blue)" />
        {loadingLocation ? "Mendeteksi lokasi..." : "Gunakan lokasi saat ini"}
      </button>

      <div
        ref={mapRef}
        style={{ width: "100%", height: 220, borderRadius: 16, marginBottom: 12, border: "1px solid var(--line)" }}
      />

      {coords && (
        <p style={{ fontSize: 11, color: "var(--ink-soft)", display: "flex", alignItems: "center", gap: 4, marginBottom: 12 }}>
          <MapPin size={12} /> Titik koordinat: {coords.lat.toFixed(6)}, {coords.lng.toFixed(6)}
        </p>
      )}

      {error && <p style={{ color: "#c4342f", fontSize: 12, marginBottom: 12 }}>{error}</p>}

      <form onSubmit={save} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <input placeholder="Label (Rumah/Kantor)" value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} style={inputStyle} required />
        <input placeholder="Nama penerima" value={form.penerima} onChange={(e) => setForm({ ...form, penerima: e.target.value })} style={inputStyle} required />
        <input placeholder="Nomor HP" value={form.no_hp} onChange={(e) => setForm({ ...form, no_hp: e.target.value })} style={inputStyle} required />
        <textarea placeholder="Alamat lengkap" value={form.alamat_lengkap} onChange={(e) => setForm({ ...form, alamat_lengkap: e.target.value })} style={{ ...inputStyle, minHeight: 70 }} required />
        <input placeholder="Kota" value={form.kota} onChange={(e) => setForm({ ...form, kota: e.target.value })} style={inputStyle} required />
        <input placeholder="Kode pos" value={form.kode_pos} onChange={(e) => setForm({ ...form, kode_pos: e.target.value })} style={inputStyle} />
        <button type="submit" className="btn-primary" disabled={saving}>
          {saving ? "Menyimpan..." : "Simpan alamat"}
        </button>
      </form>
    </div>
  );
}