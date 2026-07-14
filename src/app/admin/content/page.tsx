"use client";

import { useState, useEffect } from "react";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import { getFirebaseDb } from "@/lib/firebase/config";
import { postFromFirestore, eventFromFirestore } from "@/lib/firebase/converters";
import { hidePost, hideEvent, getPendingEvents, approveEvent, rejectEvent } from "@/lib/firebase/firestore";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Spinner } from "@/components/ui/Spinner";
import { Avatar } from "@/components/ui/Avatar";
import { EventDetailModal } from "@/components/events/EventDetailModal";
import { EyeOff, Eye, Calendar, MapPin, Users, Check, X, Clock } from "lucide-react";
import { formatDate } from "@/lib/utils";
import type { Post, Event } from "@/types";

type Tab = "pending" | "posts" | "events";

export default function AdminContentPage() {
  const { user, profile } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [pendingEvents, setPendingEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("pending");
  const [detailEvent, setDetailEvent] = useState<Event | null>(null);
  const [actioningId, setActioningId] = useState<string | null>(null);

  const loadContent = async () => {
    const db = getFirebaseDb();
    const [postsSnap, eventsSnap, pending] = await Promise.all([
      getDocs(query(collection(db, "posts"), orderBy("createdAt", "desc"))),
      getDocs(query(collection(db, "events"), orderBy("createdAt", "desc"))),
      getPendingEvents(),
    ]);
    setPosts(postsSnap.docs.map(postFromFirestore));
    setEvents(eventsSnap.docs.map(eventFromFirestore));
    setPendingEvents(pending);
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

  const handleApprove = async (eventId: string) => {
    setActioningId(eventId);
    try {
      await approveEvent(eventId);
      await loadContent();
    } finally {
      setActioningId(null);
    }
  };

  const handleReject = async (eventId: string) => {
    setActioningId(eventId);
    try {
      await rejectEvent(eventId);
      await loadContent();
    } finally {
      setActioningId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[var(--foreground)]">İçerik Moderasyonu</h1>
        <p className="text-[var(--muted)]">Gönderi ve etkinlikleri onayla, reddet veya yönet</p>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button
          variant={tab === "pending" ? "primary" : "secondary"}
          size="sm"
          onClick={() => setTab("pending")}
        >
          <Clock className="h-4 w-4" />
          Onay Bekleyenler ({pendingEvents.length})
        </Button>
        <Button
          variant={tab === "posts" ? "primary" : "secondary"}
          size="sm"
          onClick={() => setTab("posts")}
        >
          Tüm Gönderiler ({posts.length})
        </Button>
        <Button
          variant={tab === "events" ? "primary" : "secondary"}
          size="sm"
          onClick={() => setTab("events")}
        >
          Tüm Etkinlikler ({events.length})
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Spinner size="lg" />
        </div>
      ) : tab === "pending" ? (
        pendingEvents.length === 0 ? (
          <Card className="py-12 text-center text-[var(--muted)]">
            Onay bekleyen içerik yok. 🎉
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {pendingEvents.map((event) => (
              <Card key={event.id} className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-lg font-semibold text-[var(--foreground)]">{event.title}</h3>
                  <Badge variant="info">{event.category}</Badge>
                </div>

                {event.imageUrl && (
                  <img
                    src={event.imageUrl}
                    alt={event.title}
                    className="max-h-56 w-full rounded-xl object-cover"
                  />
                )}

                <p className="line-clamp-3 text-sm text-[var(--muted)]">{event.description}</p>

                <div className="space-y-1.5 text-sm text-[var(--muted)]">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-orange-500" />
                    {formatDate(event.startDate)}
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-orange-500" />
                    {event.location.address ?? event.location.city}
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-orange-500" />
                    0/{event.maxParticipants} katılımcı
                  </div>
                </div>

                <div className="flex items-center justify-between border-t border-[var(--border)] pt-3">
                  <div className="flex items-center gap-2">
                    <Avatar src={event.organizerAvatar} name={event.organizerName} size="sm" />
                    <span className="text-sm text-[var(--muted)]">{event.organizerName}</span>
                  </div>
                  <Button variant="secondary" size="sm" onClick={() => setDetailEvent(event)}>
                    <Eye className="h-4 w-4" />
                    Detaylar
                  </Button>
                </div>

                <div className="flex gap-2 border-t border-[var(--border)] pt-3">
                  <Button
                    className="flex-1"
                    size="sm"
                    loading={actioningId === event.id}
                    onClick={() => handleApprove(event.id)}
                  >
                    <Check className="h-4 w-4" />
                    Onayla
                  </Button>
                  <Button
                    className="flex-1"
                    variant="danger"
                    size="sm"
                    loading={actioningId === event.id}
                    onClick={() => handleReject(event.id)}
                  >
                    <X className="h-4 w-4" />
                    Reddet
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )
      ) : tab === "posts" ? (
        <div className="space-y-2">
          {posts.map((post) => (
            <Card key={post.id} className="flex items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-[var(--foreground)]">{post.authorName}</span>
                  {post.isHidden && <Badge variant="danger">Gizli</Badge>}
                </div>
                <p className="mt-1 truncate text-sm text-[var(--muted)]">{post.content}</p>
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
                  <span className="font-medium text-[var(--foreground)]">{event.title}</span>
                  <Badge variant="info">{event.category}</Badge>
                  {!event.isApproved && <Badge variant="warning">Onay Bekliyor</Badge>}
                  {event.isHidden && <Badge variant="danger">Gizli</Badge>}
                </div>
                <p className="mt-1 truncate text-sm text-[var(--muted)]">{event.description}</p>
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

      <EventDetailModal event={detailEvent} onClose={() => setDetailEvent(null)} />
    </div>
  );
}
