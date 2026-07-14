"use client";

import Link from "next/link";
import { Calendar, Clock, MapPin, Users, User } from "lucide-react";
import type { Event } from "@/types";
import { Modal } from "@/components/ui/Modal";
import { Badge } from "@/components/ui/Badge";
import { Avatar } from "@/components/ui/Avatar";
import { formatDate, getEventStatus } from "@/lib/utils";

interface EventDetailModalProps {
  event: Event | null;
  onClose: () => void;
}

const statusLabels = {
  upcoming: { label: "Yaklaşan", variant: "info" as const },
  ongoing: { label: "Devam Ediyor", variant: "success" as const },
  completed: { label: "Tamamlandı", variant: "default" as const },
  cancelled: { label: "İptal", variant: "danger" as const },
};

export function EventDetailModal({ event, onClose }: EventDetailModalProps) {
  return (
    <Modal isOpen={!!event} onClose={onClose} title="Etkinlik Detayı" size="lg">
      {event && (
        <div className="space-y-4">
          {event.imageUrl && (
            <img
              src={event.imageUrl}
              alt={event.title}
              className="max-h-72 w-full rounded-xl object-cover"
            />
          )}

          <div className="flex items-start justify-between gap-2">
            <h3 className="text-xl font-semibold text-[var(--foreground)]">{event.title}</h3>
            <div className="flex shrink-0 flex-wrap justify-end gap-2">
              <Badge variant="info">{event.category}</Badge>
              <Badge variant={statusLabels[getEventStatus(event)].variant}>
                {statusLabels[getEventStatus(event)].label}
              </Badge>
              {event.isHidden && <Badge variant="danger">Gizli</Badge>}
              {!event.isApproved && <Badge variant="warning">Onay Bekliyor</Badge>}
            </div>
          </div>

          <p className="whitespace-pre-wrap text-sm text-[var(--foreground)]">{event.description}</p>

          <div className="space-y-2 rounded-xl border border-[var(--border)] bg-[var(--card)] p-4 text-sm text-[var(--foreground)]">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-orange-500" />
              Başlangıç: {formatDate(event.startDate)}
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-orange-500" />
              Bitiş: {formatDate(event.endDate)}
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-orange-500" />
              {event.location.address ?? event.location.city} — {event.location.city}
            </div>
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-orange-500" />
              {event.participantsCount}/{event.maxParticipants} katılımcı
              {event.waitlistCount > 0 && (
                <span className="text-amber-400">
                  (Bekleme listesi: {event.waitlistCount})
                </span>
              )}
            </div>
          </div>

          <Link
            href={`/profile/user?id=${event.organizerId}`}
            className="flex items-center gap-3 border-t border-[var(--border)] pt-4"
          >
            <Avatar src={event.organizerAvatar} name={event.organizerName} size="sm" />
            <div className="flex items-center gap-2 text-sm text-[var(--muted)]">
              <User className="h-4 w-4" />
              Organizatör: <span className="text-[var(--foreground)]">{event.organizerName}</span>
            </div>
          </Link>

          <div className="text-xs text-[var(--muted)]">
            Oluşturulma: {formatDate(event.createdAt)}
          </div>
        </div>
      )}
    </Modal>
  );
}
