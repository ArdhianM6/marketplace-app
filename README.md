# Marketplace App — Starter (Next.js + Supabase + Midtrans)

Starter project supaya kamu mengerti cara kerja tiap bagian, bukan produk jadi 100%.
Beberapa halaman (kategori admin, detail produk, riwayat order) sengaja belum dibuat
supaya kamu bisa latihan menambahkannya sendiri dengan pola yang sama seperti halaman
yang sudah ada.

## Struktur folder

```
marketplace-app/
  supabase/schema.sql        <- jalankan ini di Supabase SQL Editor
  lib/supabase.js            <- client Supabase untuk browser
  lib/supabaseAdmin.js       <- client Supabase untuk server (service role)
  lib/cart.js                <- keranjang sederhana (localStorage)
  app/login/page.js          <- login Google/Facebook/email
  app/home/page.js           <- daftar produk diskon + kategori
  app/cart/page.js           <- keranjang, alamat, metode bayar, checkout
  app/account/page.js        <- poin, saldo, tukar voucher
  app/api/checkout/route.js       <- bikin order + transaksi Midtrans
  app/api/payment-webhook/route.js <- terima notifikasi pembayaran Midtrans
  app/api/redeem-voucher/route.js  <- tukar poin jadi voucher
```

## Langkah setup dari nol

### 1. Buat project Supabase
1. Daftar di https://supabase.com, buat project baru (pilih region Singapore biar cepat).
2. Buka **SQL Editor**, tempel isi `supabase/schema.sql`, klik Run. Ini membuat semua
   tabel, trigger poin otomatis, function tukar voucher, dan Row Level Security.
3. Buka **Settings > API**, catat `Project URL`, `anon public key`, dan `service_role key`.

### 2. Aktifkan login Google & Facebook
1. Buka **Authentication > Providers** di Supabase.
2. Toggle **Google** → isi Client ID & Secret dari https://console.cloud.google.com
   (buat OAuth Client ID jenis "Web application", masukkan Redirect URI yang
   ditampilkan Supabase).
3. Toggle **Facebook** → sama, ambil App ID & Secret dari https://developers.facebook.com.

### 3. Siapkan Midtrans (untuk e-wallet, bank, QRIS)
1. Daftar di https://dashboard.midtrans.com (mode Sandbox dulu untuk testing, gratis).
2. Buka **Settings > Access Keys**, catat Server Key dan Client Key sandbox.
3. Setelah nanti deploy online, isi **Settings > Configuration > Payment Notification URL**
   dengan `https://domainmu.com/api/payment-webhook`.

### 4. Jalankan project di komputer
```bash
cd marketplace-app
cp .env.example .env.local
# buka .env.local, isi dengan URL/key dari langkah 1 dan 3

npm install
npm run dev
```
Buka http://localhost:3000 — kamu akan diarahkan ke halaman login.

### 5. Isi data awal
Di Supabase, buka tab **Table Editor**:
- Tambah beberapa baris di tabel `products` (isi `harga_diskon` supaya muncul di beranda).
- Tambah baris di `vouchers` untuk voucher yang bisa ditukar poin.
- Setelah kamu login pertama kali di app, tambahkan baris di `addresses` dengan
  `user_id` = id akunmu (lihat di tabel `profiles`) supaya bisa checkout.

### 6. Coba alur lengkap
1. Daftar/login lewat Google di `/login`.
2. Lihat produk diskon di `/home`, klik "Tambah" untuk masuk keranjang.
3. Buka `/cart`, pilih alamat & metode bayar, klik "Bayar sekarang".
4. Untuk e-wallet/bank kamu akan diarahkan ke halaman Midtrans Snap (sandbox) —
   pakai [data simulasi Midtrans](https://docs.midtrans.com/docs/testing-payment-on-sandbox)
   untuk coba bayar.
5. Setelah pembayaran sukses, webhook otomatis mengubah status order jadi "paid" dan
   trigger database menambah poin ke akunmu — cek di `/account`.

### 7. Deploy ke internet (gratis)
1. Push folder ini ke repository GitHub.
2. Buka https://vercel.com, klik **Add New Project**, pilih repo tadi.
3. Di **Environment Variables**, masukkan semua isi `.env.local`.
4. Klik Deploy. Setelah selesai, update Payment Notification URL di Midtrans dengan
   domain Vercel kamu.

## Yang masih perlu kamu tambahkan sendiri (latihan)

- Halaman detail produk (`app/product/[id]/page.js`).
- Halaman admin untuk tambah/edit produk (cek `role` di tabel `profiles`).
- Halaman kelola alamat (form tambah/edit, bukan hardcode dari Table Editor).
- Top up saldo lewat QRIS (mirip pola `app/api/checkout/route.js`, tapi menyimpan ke
  tabel `wallet_topups`).
- Riwayat order (`select * from orders where user_id = ...`).

Pola kodenya konsisten di semua halaman: ambil data lewat `supabase.from(...)` di
client component, dan taruh logika yang butuh keamanan (uang, poin) di `app/api/**/route.js`
yang pakai `supabaseAdmin`. Kalau kamu paham pola ini, menambah fitur baru tinggal
mengulang pola yang sama.
