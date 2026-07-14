"use client";

import Link from "next/link";
import { Bell, Heart, MessageCircle, UserPlus, Calendar } from "lucide-react";
import type { Notification } from "@/types";
import { formatRelative } from "@/lib/utils";
import { Avatar } from "@/components/ui/Avatar";
import { cn } from "@/lib/utils";

interface NotificationItemProps {
  notification: Notification;
  onRead: (id: string) => void;
}

const iconMap = {
  like: Heart,
  comment: MessageCircle,
  message: MessageCircle,
  event_join: UserPlus,
  event_created: Calendar,
  event_reminder: Calendar,
  follow: UserPlus,
  system: Bell,
};

export function NotificationItem({ notification, onRead }: NotificationItemProps) {
  const Icon = iconMap[notification.type] ?? Bell;

  const content = (
    <div
      className={cn(
        "flex gap-3 rounded-xl p-4 transition-colors",
        notification.isRead
          ? "bg-transparent"
          : "bg-orange-500/10 border border-orange-500/20"
      )}
      onClick={() => !notification.isRead && onRead(notification.id)}
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/10">
        {notification.actorName ? (
          <Avatar src={undefined} name={notification.actorName} size="sm" />
        ) : (
          <Icon className="h-5 w-5 text-orange-500" />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="font-medium text-[var(--foreground)]">{notification.title}</p>
        <p className="text-sm text-[var(--muted)]">{notification.body}</p>
        <p className="mt-1 text-xs text-[var(--muted)]">
          {formatRelative(notification.createdAt)}
        </p>
      </div>
      {!notification.isRead && (
        <div className="h-2 w-2 shrink-0 rounded-full bg-orange-500" />
      )}
    </div>
  );

  if (notification.link) {
    return <Link href={notification.link}>{content}</Link>;
  }

  return content;
}
