import { supabaseAdmin } from "../../../lib/supabaseAdmin";
import midtransClient from "midtrans-client";
import { getDistanceKm, getShippingOptions, calcEstimasiTiba } from "../../../lib/shipping";

export async function POST(req) {
  try {
    const body = await req.json();
    const { items, addressId, metode, metodePengiriman, jadwalKirim, userVoucherId = null } = body;

    const authHeader = req.headers.get("authorization") || "";
    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: authError } = await supabaseAdmin.auth.getUser(token);
    if (authError || !userData?.user) {
      return Response.json({ error: "Sesi tidak valid, silakan login ulang." }, { status: 401 });
    }
    const userId = userData.user.id;

    if (!items?.length) {
      return Response.json({ error: "Keranjang kosong." }, { status: 400 });
    }
    if (!["ewallet", "bank", "saldo"].includes(metode)) {
      return Response.json({ error: "Metode pembayaran tidak valid." }, { status: 400 });
    }

    const { data: address } = await supabaseAdmin
      .from("addresses")
      .select("*")
      .eq("id", addressId)
      .eq("user_id", userId)
      .single();

    if (!address) {
      return Response.json({ error: "Alamat pengiriman tidak ditemukan." }, { status: 400 });
    }

    // Hitung ongkir di server (bukan percaya angka dari client) berdasarkan
    // jarak alamat ke toko dan metode pengiriman yang dipilih.
    const distanceKm = getDistanceKm(address);
    const shippingOptions = getShippingOptions(distanceKm);
    const chosen = shippingOptions.find((o) => o.id === metodePengiriman);

    if (!chosen) {
      return Response.json({ error: "Metode pengiriman tidak valid." }, { status: 400 });
    }

    if (chosen.id === "jadwal") {
      if (!jadwalKirim || new Date(jadwalKirim).getTime() < Date.now()) {
        return Response.json({ error: "Pilih jadwal pengiriman yang valid." }, { status: 400 });
      }
      const jamKirim = new Date(jadwalKirim).getHours();
      if (jamKirim < 8 || jamKirim >= 20) {
        return Response.json({ error: "Jadwal pengiriman hanya tersedia 08:00 - 20:00." }, { status: 400 });
      }
    }

    const ongkir = chosen.price;

    const { data: order, error: rpcError } = await supabaseAdmin
      .rpc("checkout_create_order_with_voucher", {
        p_user_id: userId,
        p_address_id: addressId,
        p_items: items.map((i) => ({ id: i.id, harga: i.harga, qty: i.qty })),
        p_metode: metode,
        p_ongkir: ongkir,
        p_user_voucher_id: userVoucherId,
      })
      .single();

    if (rpcError) {
      const message = rpcError.message || "Gagal memproses checkout.";
      return Response.json({ error: message.includes("Saldo tidak cukup") ? "Saldo tidak cukup untuk membayar pesanan ini." : message }, { status: 400 });
    }

    // Simpan metode & jadwal pengiriman terpisah dari fungsi checkout_create_order,
    // supaya tidak perlu mengubah fungsi database yang sudah ada.
    const extraFields = {
      metode_pengiriman: chosen.id,
      jadwal_kirim: chosen.id === "jadwal" ? jadwalKirim : null,
    };

    // Kalau bayar pakai saldo, status_bayar langsung 'paid' di dalam fungsi checkout_create_order,
    // jadi estimasi tiba bisa langsung dihitung sekarang.
    if (metode === "saldo") {
      extraFields.estimasi_tiba = calcEstimasiTiba(chosen.id, new Date(), jadwalKirim).toISOString();
    }

    const { error: orderUpdateError } = await supabaseAdmin.from("orders").update(extraFields).eq("id", order.id);
    if (orderUpdateError) throw orderUpdateError;

    if (metode === "saldo") {
      return Response.json({ order });
    }

    const snap = new midtransClient.Snap({
      isProduction: process.env.MIDTRANS_IS_PRODUCTION === "true",
      serverKey: process.env.MIDTRANS_SERVER_KEY,
      clientKey: process.env.MIDTRANS_CLIENT_KEY,
    });

    const midtransOrderId = `order-${order.id}`;
    let transaction;
    try {
      transaction = await snap.createTransaction({
        transaction_details: { order_id: midtransOrderId, gross_amount: order.total },
        enabled_payments: metode === "ewallet" ? ["gopay", "qris", "shopeepay"] : ["bank_transfer"],
      });
    } catch (paymentError) {
      await supabaseAdmin.from("orders").update({ status_bayar: "failed" }).eq("id", order.id);
      await supabaseAdmin.from("user_vouchers").update({ reserved_order_id: null }).eq("reserved_order_id", order.id);
      throw paymentError;
    }

    await supabaseAdmin.from("orders").update({ midtrans_order_id: midtransOrderId }).eq("id", order.id);

    return Response.json({ order, redirectUrl: transaction.redirect_url });
  } catch (err) {
    console.error(err);
    return Response.json({ error: "Gagal memproses checkout." }, { status: 500 });
  }
}
