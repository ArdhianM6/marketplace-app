import { supabaseAdmin } from "../../../lib/supabaseAdmin";
import crypto from "crypto";
import { calcEstimasiTiba } from "../../../lib/shipping";

export async function POST(req) {
  const body = await req.json();
  const { order_id, status_code, gross_amount, signature_key, transaction_status } = body;

  const expected = crypto
    .createHash("sha512")
    .update(order_id + status_code + gross_amount + process.env.MIDTRANS_SERVER_KEY)
    .digest("hex");

  if (expected !== signature_key) {
    return Response.json({ error: "Signature tidak valid" }, { status: 403 });
  }

  const isPaid = ["settlement", "capture"].includes(transaction_status);
  const isFailed = ["deny", "cancel", "expire"].includes(transaction_status);

  if (!isPaid && !isFailed) {
    return Response.json({ ok: true });
  }

  const newStatus = isPaid ? "paid" : "failed";

  if (order_id.startsWith("order-")) {
    const updateFields = { status_bayar: newStatus };

    // Waktu pengiriman baru dihitung setelah pembayaran benar-benar sukses,
    // sesuai janji "fast delivery 15 menit setelah payment sukses".
    if (isPaid) {
      const { data: existing } = await supabaseAdmin
        .from("orders")
        .select("metode_pengiriman, jadwal_kirim")
        .eq("midtrans_order_id", order_id)
        .single();

      if (existing) {
        updateFields.estimasi_tiba = calcEstimasiTiba(
          existing.metode_pengiriman || "normal",
          new Date(),
          existing.jadwal_kirim
        ).toISOString();
      }
    }

    const { data: order } = await supabaseAdmin
      .from("orders")
      .update(updateFields)
      .eq("midtrans_order_id", order_id)
      .select("id, user_id")
      .single();

    if (order) {
      await supabaseAdmin.from("notifications").insert({
        user_id: order.user_id,
        judul: isPaid ? "Pembayaran berhasil" : "Pembayaran gagal",
        pesan: isPaid
          ? "Pesananmu sudah dibayar dan segera diproses."
          : "Pembayaran pesananmu gagal atau dibatalkan.",
        tipe: "pesanan",
        link: `/orders/${order.id}`,
      });
    }
  } else if (order_id.startsWith("topup-")) {
    const { data: topup } = await supabaseAdmin
      .from("wallet_topups")
      .update({ status: newStatus })
      .eq("midtrans_order_id", order_id)
      .select("id, user_id, jumlah")
      .single();

    if (topup) {
      await supabaseAdmin.from("notifications").insert({
        user_id: topup.user_id,
        judul: isPaid ? "Top up berhasil" : "Top up gagal",
        pesan: isPaid
          ? `Saldo kamu bertambah Rp${Number(topup.jumlah).toLocaleString("id-ID")}.`
          : "Top up saldo gagal atau dibatalkan.",
        tipe: "saldo",
        link: "/account",
      });
    }
  }

  return Response.json({ ok: true });
}