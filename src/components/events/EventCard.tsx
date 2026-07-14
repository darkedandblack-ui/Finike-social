"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Calendar, MapPin, Users, Clock } from "lucide-react";
import { motion } from "framer-motion";
import type { Event } from "@/types";
import { Card } from "@/components/ui/Card";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { formatDate, getEventStatus } from "@/lib/utils";
import { isEventParticipant } from "@/lib/firebase/firestore";
import { useAuth } from "@/contexts/AuthContext";
import { EventDetailModal } from "./EventDetailModal";

interface EventCardProps {
  event: Event;
  onJoin?: (eventId: string) => void;
  onLeave?: (eventId: string) => void;
  joining?: boolean;
}

const statusLabels = {
  upcoming: { label: "Yaklaşan", variant: "info" as const },
  ongoing: { label: "Devam Ediyor", variant: "success" as const },
  completed: { label: "Tamamlandı", variant: "default" as const },
  cancelled: { label: "İptal", variant: "danger" as const },
};

export function EventCard({ event, onJoin, onLeave, joining }: EventCardProps) {
  const { user } = useAuth();
  const [isJoined, setIsJoined] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showDetail, setShowDetail] = useState(false);

  useEffect(() => {
    if (user) {
      isEventParticipant(event.id, user.uid).then(setIsJoined);
    }
  }, [user, event.id]);

  const status = getEventStatus(event);
  const statusInfo = statusLabels[status];
  const isFull = event.participantsCount >= event.maxParticipants;

  const handleJoin = async () => {
    if (!user || loading) return;
    setLoading(true);
    try {
      if (isJoined && onLeave) {
        await onLeave(event.id);
        setIsJoined(false);
      } else if (onJoin) {
        await onJoin(event.id);
        setIsJoined(true);
      }
    } catch (error) {
      console.error("Join/leave error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card hover className="space-y-4">
        <div className="flex items-start justify-between gap-2">
          <div>
            <button onClick={() => setShowDetail(true)} className="text-left">
              <h3 className="text-lg font-semibold text-white hover:text-orange-500 transition-colors">
                {event.title}
              </h3>
            </button>
            <div className="mt-1 flex items-center gap-2">
              <Badge variant="info">{event.category}</Badge>
              <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
            </div>
          </div>
        </div>

        {event.imageUrl && (
          <img
            src={event.imageUrl}
            alt={event.title}
            className="max-h-64 w-full rounded-xl object-cover"
          />
        )}

        <p className="line-clamp-2 text-sm text-[var(--muted)]">{event.description}</p>

        <div className="space-y-2 text-sm text-[var(--muted)]">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-orange-500" />
            {formatDate(event.startDate)}
          </div>
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-orange-500" />
            {formatDate(event.endDate)}
          </div>
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-orange-500" />
            {event.location.address ?? event.location.city}
          </div>
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-orange-500" />
            {event.participantsCount}/{event.maxParticipants} katılımcı
            {isFull && (
              <span className="text-amber-400">(Bekleme listesi: {event.waitlistCount})</span>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between border-t border-[var(--border)] pt-3">
          <Link
            href={`/profile/user?id=${event.organizerId}`}
            className="flex items-center gap-2"
          >
            <Avatar
              src={event.organizerAvatar}
              name={event.organizerName}
              size="sm"
            />
            <span className="text-sm text-[var(--muted)]">{event.organizerName}</span>
          </Link>

          <div className="flex items-center gap-2">
            <Button size="sm" variant="secondary" onClick={() => setShowDetail(true)}>
              Detaylar
            </Button>
            {status === "upcoming" && onJoin && (
              <Button
                size="sm"
                onClick={handleJoin}
                loading={joining || loading}
                variant={isJoined ? "outline" : "primary"}
              >
                {isJoined ? "Katılıyorum" : (isFull ? "Bekleme Listesi" : "Katıl")}
              </Button>
            )}
          </div>
        </div>
      </Card>

      <EventDetailModal event={showDetail ? event : null} onClose={() => setShowDetail(false)} />
    </motion.div>
  );
}
