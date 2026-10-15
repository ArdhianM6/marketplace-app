// Keranjang sederhana disimpan di localStorage. Untuk aplikasi yang lebih besar,
// pindahkan ke tabel "cart_items" di Supabase supaya tersinkron antar perangkat.
const KEY = "marketplace_cart";
const EVENT = "cart-updated";

// Setiap kali keranjang berubah, kita broadcast event custom di window supaya
// komponen lain (badge di BottomNav, tombol keranjang mengambang) bisa langsung
// update tanpa perlu passing state manual antar halaman.
function notify(cart) {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(EVENT, { detail: cart }));
  }
}

export function getCart() {
  if (typeof window === "undefined") return [];
  return JSON.parse(localStorage.getItem(KEY) || "[]");
}

export function getCartCount() {
  return getCart().reduce((sum, i) => sum + i.qty, 0);
}

// Dipanggil dari komponen React untuk "berlangganan" perubahan keranjang.
// Return function unsubscribe untuk dipanggil di cleanup useEffect.
export function subscribeToCart(callback) {
  if (typeof window === "undefined") return () => {};
  const handler = (e) => callback(e.detail);
  window.addEventListener(EVENT, handler);
  return () => window.removeEventListener(EVENT, handler);
}

export function addToCart(product) {
  const cart = getCart();
  const found = cart.find((i) => i.id === product.id);
  if (found) {
    found.qty += 1;
  } else {
    cart.push({ id: product.id, nama: product.nama, harga: product.harga_diskon || product.harga, qty: 1 });
  }
  localStorage.setItem(KEY, JSON.stringify(cart));
  notify(cart);
  return cart;
}

export function updateQty(id, delta) {
  const cart = getCart()
    .map((i) => (i.id === id ? { ...i, qty: Math.max(1, i.qty + delta) } : i));
  localStorage.setItem(KEY, JSON.stringify(cart));
  notify(cart);
  return cart;
}

export function removeFromCart(id) {
  const cart = getCart().filter((i) => i.id !== id);
  localStorage.setItem(KEY, JSON.stringify(cart));
  notify(cart);
  return cart;
}

export function clearCart() {
  localStorage.setItem(KEY, "[]");
  notify([]);
}