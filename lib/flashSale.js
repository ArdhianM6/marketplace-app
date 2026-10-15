// Helper flash sale: cek status aktif & hitung harga akhir yang berlaku.
export function isFlashSaleActive(product) {
  if (!product?.flash_sale_harga || !product?.flash_sale_mulai || !product?.flash_sale_selesai) {
    return false;
  }
  const now = Date.now();
  return (
    now >= new Date(product.flash_sale_mulai).getTime() &&
    now < new Date(product.flash_sale_selesai).getTime()
  );
}

// Harga yang berlaku sekarang: flash sale > harga diskon > harga normal
export function getEffectivePrice(product) {
  if (isFlashSaleActive(product)) return product.flash_sale_harga;
  return product.harga_diskon || product.harga;
}