"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { PostCard } from "@/components/posts/PostCard";
import { EventCard } from "@/components/events/EventCard";
import { Spinner } from "@/components/ui/Spinner";
import { POST_CATEGORIES, cn } from "@/lib/utils";
import { getFeed, joinEvent, leaveEvent } from "@/lib/firebase/firestore";
import { useAuth } from "@/contexts/AuthContext";
import type { FeedItem, Post, Event } from "@/types";

function FeedContent() {
  const { user, profile } = useAuth();
  const searchParams = useSearchParams();
  const searchQuery = (searchParams.get("q") ?? "").trim().toLowerCase();
  const [feed, setFeed] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [category, setCategory] = useState("Tümü");
  const [joiningId, setJoiningId] = useState<string | null>(null);

  const loadFeed = async () => {
    setLoading(true);
    setError("");
    try {
      const items = await getFeed(category === "Tümü" ? undefined : category);
      setFeed(items);
    } catch (err) {
      console.error(err);
      setError(
        "Akış yüklenirken hata oluştu. Aşağıdaki adımlarla Firestore index'lerini oluştur."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFeed();
  }, [category]);

  const visibleFeed = searchQuery
    ? feed.filter((item) => {
        const title = item.type === "event" ? (item.data as Event).title : "";
        const body =
          item.type === "event"
            ? (item.data as Event).description
            : (item.data as Post).content;
        return (
          title.toLowerCase().includes(searchQuery) ||
          body.toLowerCase().includes(searchQuery)
        );
      })
    : feed;

  const handleJoinEvent = async (eventId: string) => {
    if (!user || !profile) return;
    setJoiningId(eventId);
    try {
      const result = await joinEvent(
        eventId,
        user.uid,
        profile.displayName,
        profile.avatarUrl
      );
      if (result !== "already_joined") {
        await loadFeed();
      }
    } finally {
      setJoiningId(null);
    }
  };

  const handleLeaveEvent = async (eventId: string) => {
    if (!user) return;
    setJoiningId(eventId);
    try {
      await leaveEvent(eventId, user.uid);
      await loadFeed();
    } finally {
      setJoiningId(null);
    }
  };

  const categories = ["Tümü", ...POST_CATEGORIES];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[var(--foreground)]">Akış</h1>
        <p className="text-[var(--muted)]">Finike&apos;den son paylaşımlar ve etkinlikler</p>
      </div>

      {error && (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-300">
          {error}
        </div>
      )}

      <div className="flex gap-2 overflow-x-auto pb-2">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setCategory(cat)}
            className={cn(
              "shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition-colors",
              category === cat
                ? "bg-orange-500 text-white"
                : "bg-[var(--card)] text-[var(--muted)] hover:bg-white/10"
            )}
          >
            {cat}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Spinner size="lg" />
        </div>
      ) : visibleFeed.length === 0 ? (
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-12 text-center">
          <p className="text-[var(--muted)]">
            {searchQuery
              ? "Aramanla eşleşen bir şey bulunamadı."
              : "Henüz paylaşım yok. İlk gönderiyi sen oluştur!"}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {visibleFeed.map((item) =>
            item.type === "post" ? (
              <PostCard key={`post-${item.data.id}`} post={item.data as Post} />
            ) : (
              <EventCard
                key={`event-${item.data.id}`}
                event={item.data as Event}
                onJoin={handleJoinEvent}
                onLeave={handleLeaveEvent}
                joining={joiningId === item.data.id}
              />
            )
          )}
        </div>
      )}
    </div>
  );
}

export default function FeedPage() {
  return (
    <Suspense fallback={
      <div className="flex justify-center py-12">
        <Spinner size="lg" />
      </div>
    }>
      <FeedContent />
    </Suspense>
  );
}
