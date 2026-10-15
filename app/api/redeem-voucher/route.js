import { supabaseAdmin } from "../../../lib/supabaseAdmin";

export async function POST(req) {
  const { voucherId } = await req.json();
  const authHeader = req.headers.get("authorization") || "";
  const token = authHeader.replace("Bearer ", "");

  const { data: userData, error: authError } = await supabaseAdmin.auth.getUser(token);
  if (authError || !userData?.user) {
    return Response.json({ error: "Sesi tidak valid." }, { status: 401 });
  }

  const { data, error } = await supabaseAdmin.rpc("redeem_voucher", {
    p_user_id: userData.user.id,
    p_voucher_id: voucherId,
  });

  if (error) {
    return Response.json({ error: error.message }, { status: 400 });
  }

  // Set masa berlaku voucher hasil tukar poin, ambil dari kolom berlaku_hari milik voucher-nya
  const { data: voucher } = await supabaseAdmin
    .from("vouchers")
    .select("judul, berlaku_hari")
    .eq("id", voucherId)
    .single();
  const expiresAt = new Date(Date.now() + (voucher?.berlaku_hari || 30) * 24 * 60 * 60 * 1000);
  await supabaseAdmin.from("user_vouchers").update({ expires_at: expiresAt.toISOString() }).eq("id", data);

  await supabaseAdmin.from("notifications").insert({
    user_id: userData.user.id,
    judul: "Voucher berhasil ditukar",
    pesan: `Voucher "${voucher?.judul || ""}" sudah masuk ke akunmu.`,
    tipe: "voucher",
    link: "/account/vouchers",
  });

  return Response.json({ userVoucherId: data });
}