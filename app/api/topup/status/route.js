import { supabaseAdmin } from "../../../../lib/supabaseAdmin";

// Dipanggil berulang (polling) dari halaman QRIS untuk cek apakah pembayaran
// sudah dikonfirmasi lewat webhook Midtrans.
export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const topupId = searchParams.get("topupId");

  const authHeader = req.headers.get("authorization") || "";
  const token = authHeader.replace("Bearer ", "");
  const { data: userData, error: authError } = await supabaseAdmin.auth.getUser(token);
  if (authError || !userData?.user) {
    return Response.json({ error: "Sesi tidak valid." }, { status: 401 });
  }

  const { data, error } = await supabaseAdmin
    .from("wallet_topups")
    .select("status, jumlah, qr_url")
    .eq("id", topupId)
    .eq("user_id", userData.user.id)
    .single();

  if (error || !data) {
    return Response.json({ error: "Transaksi tidak ditemukan." }, { status: 404 });
  }

  return Response.json(data);
}