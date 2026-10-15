// Wishlist tersimpan di Supabase (tabel wishlists), tersinkron ke akun user
// jadi bisa dibuka dari HP mana pun selama login dengan akun yang sama.
import { supabase } from "./supabase";

export async function getWishlistIds(userId) {
  if (!userId) return [];
  const { data, error } = await supabase.from("wishlists").select("product_id").eq("user_id", userId);
  if (error) return [];
  return data.map((w) => w.product_id);
}

export async function isWishlisted(userId, productId) {
  if (!userId) return false;
  const { data } = await supabase
    .from("wishlists")
    .select("id")
    .eq("user_id", userId)
    .eq("product_id", productId)
    .maybeSingle();
  return !!data;
}

// Toggle: kalau lagi ke-simpan, dihapus. Kalau belum, disimpan.
// Return: true kalau sekarang jadi tersimpan, false kalau sekarang jadi terhapus.
export async function toggleWishlist(userId, productId, currentlyWishlisted) {
  if (!userId) throw new Error("Harus login untuk menyimpan favorit");

  if (currentlyWishlisted) {
    const { error } = await supabase
      .from("wishlists")
      .delete()
      .eq("user_id", userId)
      .eq("product_id", productId);
    if (error) throw error;
    return false;
  } else {
    const { error } = await supabase
      .from("wishlists")
      .insert({ user_id: userId, product_id: productId });
    if (error) throw error;
    return true;
  }
}