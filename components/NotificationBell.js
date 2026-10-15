"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Bell } from "lucide-react";
import { supabase } from "../lib/supabase";
import { getUnreadCount, subscribeToNotifications } from "../lib/notifications";

export default function NotificationBell() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let unsubscribe = () => {};
    let cancelled = false;

    async function init() {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session || cancelled) return;

      const uid = session.user.id;
      setCount(await getUnreadCount(uid));

      unsubscribe = subscribeToNotifications(uid, async () => {
        setCount(await getUnreadCount(uid));
      });
    }

    init();
    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, []);

  return (
    <Link href="/notifications" className="notif-bell" aria-label="Notifikasi">
      <Bell size={18} />
      {count > 0 && <span className="notif-bell-badge">{count > 9 ? "9+" : count}</span>}
    </Link>
  );
}