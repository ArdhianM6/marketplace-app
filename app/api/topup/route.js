import { supabaseAdmin } from "../../../lib/supabaseAdmin";
import midtransClient from "midtrans-client";

const MIN_TOPUP = 15000;
const MAX_TOPUP = 500000;

// Route ini membuat transaksi QRIS lewat Midtrans Core API (bukan Snap),
// supaya QR code-nya bisa ditampilkan langsung di halaman kita sendiri
// tanpa redirect ke halaman Midtrans.
export async function POST(req) {
  try {
    const { amount } = await req.json();

    if (!amount || amount < MIN_TOPUP || amount > MAX_TOPUP) {
      return Response.json(
        { error: `Jumlah top up harus antara Rp${MIN_TOPUP.toLocaleString("id-ID")} dan Rp${MAX_TOPUP.toLocaleString("id-ID")}.` },
        { status: 400 }
      );
    }

    const authHeader = req.headers.get("authorization") || "";
    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: authError } = await supabaseAdmin.auth.getUser(token);
    if (authError || !userData?.user) {
      return Response.json({ error: "Sesi tidak valid, silakan login ulang." }, { status: 401 });
    }
    const userId = userData.user.id;

    // Simpan record top up dengan status pending dulu
    const { data: topup, error: insertError } = await supabaseAdmin
      .from("wallet_topups")
      .insert({ user_id: userId, jumlah: amount, status: "pending" })
      .select()
      .single();

    if (insertError) {
      return Response.json({ error: "Gagal membuat transaksi top up." }, { status: 500 });
    }

    const midtransOrderId = `topup-${topup.id}`;

    const core = new midtransClient.CoreApi({
      isProduction: process.env.MIDTRANS_IS_PRODUCTION === "true",
      serverKey: process.env.MIDTRANS_SERVER_KEY,
      clientKey: process.env.MIDTRANS_CLIENT_KEY,
    });

    const charge = await core.charge({
      payment_type: "qris",
      transaction_details: { order_id: midtransOrderId, gross_amount: amount },
    });

    // Midtrans mengembalikan beberapa "actions", kita ambil yang generate-qr-code
    const qrAction = charge.actions?.find((a) => a.name === "generate-qr-code");
    const qrUrl = qrAction?.url || null;

    await supabaseAdmin
      .from("wallet_topups")
      .update({ midtrans_order_id: midtransOrderId, qr_url: qrUrl })
      .eq("id", topup.id);

    return Response.json({ topupId: topup.id, qrUrl, amount });
  } catch (err) {
    console.error(err);
    return Response.json({ error: "Gagal membuat QRIS top up." }, { status: 500 });
  }
}