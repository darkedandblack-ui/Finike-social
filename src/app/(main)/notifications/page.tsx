"use client";

import { useState, useEffect } from "react";
import { Bell, CheckCheck } from "lucide-react";
import {
  subscribeToNotifications,
  markNotificationRead,
  markAllNotificationsRead,
} from "@/lib/firebase/firestore";
import { NotificationItem } from "@/components/notifications/NotificationItem";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { useAuth } from "@/contexts/AuthContext";
import type { Notification } from "@/types";

export default function NotificationsPage() {
  const { profile } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile?.id) return;
    const unsub = subscribeToNotifications(profile.id, (notifs) => {
      setNotifications(notifs);
      setLoading(false);
    });
    return unsub;
  }, [profile?.id]);

  const handleRead = async (id: string) => {
    await markNotificationRead(id);
  };

  const handleReadAll = async () => {
    if (profile?.id) {
      await markAllNotificationsRead(profile.id);
    }
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--foreground)]">Bildirimler</h1>
          <p className="text-[var(--muted)]">
            {unreadCount > 0 ? `${unreadCount} okunmamış bildirim` : "Tüm bildirimler okundu"}
          </p>
        </div>
        {unreadCount > 0 && (
          <Button variant="outline" size="sm" onClick={handleReadAll}>
            <CheckCheck className="h-4 w-4" />
            Tümünü Okundu İşaretle
          </Button>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Spinner size="lg" />
        </div>
      ) : notifications.length === 0 ? (
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-12 text-center">
          <Bell className="mx-auto h-12 w-12 text-gray-600" />
          <p className="mt-4 text-[var(--muted)]">Henüz bildiriminiz yok.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map((notification) => (
            <NotificationItem
              key={notification.id}
              notification={notification}
              onRead={handleRead}
            />
          ))}
        </div>
      )}
    </div>
  );
}
