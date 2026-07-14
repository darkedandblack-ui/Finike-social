"use client";

import { useState, useEffect } from "react";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import { getFirebaseDb } from "@/lib/firebase/config";
import { postFromFirestore, eventFromFirestore } from "@/lib/firebase/converters";
import { hidePost, hideEvent } from "@/lib/firebase/firestore";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Spinner } from "@/components/ui/Spinner";
import { Modal } from "@/components/ui/Modal";
import { Avatar } from "@/components/ui/Avatar";
import { EyeOff, Eye, Calendar, Clock, MapPin, Users, User } from "lucide-react";
import { formatDate, getEventStatus } from "@/lib/utils";
import type { Post, Event } from "@/types";

const eventStatusLabels = {
  upcoming: { label: "Yaklaşan", variant: "info" as const },
  ongoing: { label: "Devam Ediyor", variant: "success" as const },
  completed: { label: "Tamamlandı", variant: "default" as const },
  cancelled: { label: "İptal", variant: "danger" as const },
};

export default function AdminContentPage() {
  const { user, profile } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"posts" | "events">("posts");
  const [detailEvent, setDetailEvent] = useState<Event | null>(null);

  const loadContent = async () => {
    const db = getFirebaseDb();
    const [postsSnap, eventsSnap] = await Promise.all([
      getDocs(query(collection(db, "posts"), orderBy("createdAt", "desc"))),
      getDocs(query(collection(db, "events"), orderBy("createdAt", "desc"))),
    ]);
    setPosts(postsSnap.docs.map(postFromFirestore));
    setEvents(eventsSnap.docs.map(eventFromFirestore));
    setLoading(false);
  };

  useEffect(() => {
    loadContent();
  }, []);

  const handleHidePost = async (postId: string) => {
    if (!user || !profile) return;
    await hidePost(postId, user.uid, profile.displayName);
    await loadContent();
  };

  const handleHideEvent = async (eventId: string) => {
    if (!user || !profile) return;
    await hideEvent(eventId, user.uid, profile.displayName);
    await loadContent();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">İçerik Moderasyonu</h1>
        <p className="text-gray-400">Gönderi ve etkinlikleri yönet</p>
      </div>

      <div className="flex gap-2">
        <Button
          variant={tab === "posts" ? "primary" : "secondary"}
          size="sm"
          onClick={() => setTab("posts")}
        >
          Gönderiler ({posts.length})
        </Button>
        <Button
          variant={tab === "events" ? "primary" : "secondary"}
          size="sm"
          onClick={() => setTab("events")}
        >
          Etkinlikler ({events.length})
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Spinner size="lg" />
        </div>
      ) : tab === "posts" ? (
        <div className="space-y-2">
          {posts.map((post) => (
            <Card key={post.id} className="flex items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-white">{post.authorName}</span>
                  {post.isHidden && <Badge variant="danger">Gizli</Badge>}
                </div>
                <p className="mt-1 truncate text-sm text-gray-400">{post.content}</p>
              </div>
              {!post.isHidden && (
                <Button variant="danger" size="sm" onClick={() => handleHidePost(post.id)}>
                  <EyeOff className="h-4 w-4" />
                  Gizle
                </Button>
              )}
            </Card>
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {events.map((event) => (
            <Card key={event.id} className="flex items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-white">{event.title}</span>
                  <Badge variant="info">{event.category}</Badge>
                  {event.isHidden && <Badge variant="danger">Gizli</Badge>}
                </div>
                <p className="mt-1 truncate text-sm text-gray-400">{event.description}</p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <Button variant="secondary" size="sm" onClick={() => setDetailEvent(event)}>
                  <Eye className="h-4 w-4" />
                  Detay
                </Button>
                {!event.isHidden && (
                  <Button variant="danger" size="sm" onClick={() => handleHideEvent(event.id)}>
                    <EyeOff className="h-4 w-4" />
                    Gizle
                  </Button>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal
        isOpen={!!detailEvent}
        onClose={() => setDetailEvent(null)}
        title="Etkinlik Detayı"
        size="lg"
      >
        {detailEvent && (
          <div className="space-y-4">
            <div className="flex items-start justify-between gap-2">
              <h3 className="text-xl font-semibold text-white">{detailEvent.title}</h3>
              <div className="flex shrink-0 gap-2">
                <Badge variant="info">{detailEvent.category}</Badge>
                <Badge variant={eventStatusLabels[getEventStatus(detailEvent)].variant}>
                  {eventStatusLabels[getEventStatus(detailEvent)].label}
                </Badge>
                {detailEvent.isHidden && <Badge variant="danger">Gizli</Badge>}
              </div>
            </div>

            <p className="whitespace-pre-wrap text-sm text-gray-300">
              {detailEvent.description}
            </p>

            <div className="space-y-2 rounded-xl border border-white/10 bg-white/5 p-4 text-sm text-gray-300">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-teal-400" />
                Başlangıç: {formatDate(detailEvent.startDate)}
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-teal-400" />
                Bitiş: {formatDate(detailEvent.endDate)}
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-teal-400" />
                {detailEvent.location.address ?? detailEvent.location.city}
                {" — "}
                {detailEvent.location.city}
              </div>
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-teal-400" />
                {detailEvent.participantsCount}/{detailEvent.maxParticipants} katılımcı
                {detailEvent.waitlistCount > 0 && (
                  <span className="text-amber-400">
                    (Bekleme listesi: {detailEvent.waitlistCount})
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-500">
                Konum: {detailEvent.location.lat.toFixed(5)}, {detailEvent.location.lng.toFixed(5)}
              </div>
            </div>

            <div className="flex items-center gap-3 border-t border-white/10 pt-4">
              <Avatar
                src={detailEvent.organizerAvatar}
                name={detailEvent.organizerName}
                size="sm"
              />
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <User className="h-4 w-4" />
                Organizatör: <span className="text-white">{detailEvent.organizerName}</span>
              </div>
            </div>

            <div className="text-xs text-gray-500">
              Oluşturulma: {formatDate(detailEvent.createdAt)}
            </div>

            <div className="flex justify-end gap-2 border-t border-white/10 pt-4">
              <Button variant="ghost" onClick={() => setDetailEvent(null)}>
                Kapat
              </Button>
              {!detailEvent.isHidden && (
                <Button
                  variant="danger"
                  onClick={async () => {
                    await handleHideEvent(detailEvent.id);
                    setDetailEvent(null);
                  }}
                >
                  <EyeOff className="h-4 w-4" />
                  Gizle
                </Button>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
