"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";
import { markAllAsRead } from "../../lib/notifications";
import BottomNav from "../../components/BottomNav";
import { ArrowLeft, Bell, Package, Gift, Coins, Wallet, Megaphone, CheckCheck } from "lucide-react";

const TYPE_ICON = {
  pesanan: Package,
  voucher: Gift,
  poin: Coins,
  saldo: Wallet,
  promo: Megaphone,
  info: Bell,
};

const formatWaktu = (iso) => {
  const d = new Date(iso);
  return d.toLocaleString("id-ID", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
};

export default function NotificationsPage() {
  const router = useRouter();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState(null);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) {
      router.replace("/login");
      return;
    }
    setUserId(session.user.id);

    const { data } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", session.user.id)
      .order("created_at", { ascending: false });

    setItems(data || []);
    setLoading(false);
  }

  const openNotif = async (n) => {
    if (!n.is_read) {
      await supabase.from("notifications").update({ is_read: true }).eq("id", n.id);
      setItems((prev) => prev.map((it) => (it.id === n.id ? { ...it, is_read: true } : it)));
    }
    if (n.link) router.push(n.link);
  };

  const handleMarkAllRead = async () => {
    if (!userId) return;
    await markAllAsRead(userId);
    setItems((prev) => prev.map((it) => ({ ...it, is_read: true })));
  };

  const unreadCount = items.filter((i) => !i.is_read).length;

  return (
    <div className="page">
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
        <button onClick={() => router.back()} className="icon-back">
          <ArrowLeft size={16} />
        </button>
        <h1 style={{ fontSize: 17, margin: 0, flex: 1 }}>Notifikasi</h1>
        {unreadCount > 0 && (
          <button className="link-reset" onClick={handleMarkAllRead}>
            <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <CheckCheck size={13} /> Tandai semua dibaca
            </span>
          </button>
        )}
      </div>

      {loading ? (
        <div>
          {[1, 2, 3].map((i) => (
            <div key={i} className="card" style={{ marginBottom: 8 }}>
              <div className="skeleton" style={{ height: 14, width: "60%", marginBottom: 8 }} />
              <div className="skeleton" style={{ height: 11, width: "90%" }} />
            </div>
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">
            <Bell size={26} color="var(--blue)" />
          </div>
          <p style={{ margin: 0, fontWeight: 600 }}>Belum ada notifikasi</p>
          <p style={{ margin: "4px 0 0", fontSize: 12.5 }}>
            Kabar terbaru soal pesanan, voucher, dan poin bakal muncul di sini.
          </p>
        </div>
      ) : (
        items.map((n) => {
          const Icon = TYPE_ICON[n.tipe] || Bell;
          return (
            <button key={n.id} onClick={() => openNotif(n)} className="notif-item-wrap">
              <div className={`notif-item ${n.is_read ? "" : "notif-item-unread"}`}>
                <div className={`notif-item-icon notif-item-icon-${n.tipe}`}>
                  <Icon size={17} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p className="notif-item-title">{n.judul}</p>
                  {n.pesan && <p className="notif-item-msg">{n.pesan}</p>}
                  <p className="notif-item-time">{formatWaktu(n.created_at)}</p>
                </div>
                {!n.is_read && <span className="notif-dot" />}
              </div>
            </button>
          );
        })
      )}

      <BottomNav />
    </div>
  );
}