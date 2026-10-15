// Helper notifikasi in-app. Dipakai oleh NotificationBell dan halaman /notifications.
import { supabase } from "./supabase";

export async function getUnreadCount(userId) {
  if (!userId) return 0;
  const { count } = await supabase
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("is_read", false);
  return count || 0;
}

export async function getNotifications(userId) {
  if (!userId) return [];
  const { data, error } = await supabase
    .from("notifications")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) return [];
  return data;
}

export async function markAsRead(id) {
  await supabase.from("notifications").update({ is_read: true }).eq("id", id);
}

export async function markAllAsRead(userId) {
  if (!userId) return;
  await supabase.from("notifications").update({ is_read: true }).eq("user_id", userId).eq("is_read", false);
}

// Dengar notifikasi baru secara realtime. Panggil unsubscribe() saat komponen unmount.
export function subscribeToNotifications(userId, onChange) {
  if (!userId) return () => {};

  const channelName = `notifications-${userId}`;

  // Hindari error "cannot add postgres_changes callbacks ... after subscribe()"
  // yang muncul saat React Strict Mode / hot-reload memanggil efek dua kali,
  // sehingga channel dengan nama sama sempat ke-subscribe lebih dulu.
  const existing = supabase.getChannels().find((ch) => ch.topic === `realtime:${channelName}`);
  if (existing) {
    supabase.removeChannel(existing);
  }

  const channel = supabase
    .channel(channelName)
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "notifications", filter: `user_id=eq.${userId}` },
      onChange
    )
    .subscribe();

  return () => supabase.removeChannel(channel);
}