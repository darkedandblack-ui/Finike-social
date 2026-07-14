"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { MessageCircle } from "lucide-react";
import { getConversations } from "@/lib/firebase/firestore";
import { useAuth } from "@/contexts/AuthContext";
import { Avatar } from "@/components/ui/Avatar";
import { Spinner } from "@/components/ui/Spinner";
import { formatRelative } from "@/lib/utils";
import type { Conversation } from "@/types";

export default function MessagesPage() {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user) return;
    getConversations(user.uid)
      .then((convos) => {
        setConversations(convos);
      })
      .catch((err) => {
        console.error(err);
        setError("Mesajlar yüklenemedi.");
      })
      .finally(() => setLoading(false));
  }, [user]);

  const getOtherParticipant = (conv: Conversation) => {
    const otherId = conv.participantIds.find((id) => id !== user?.uid) ?? "";
    return {
      id: otherId,
      name: conv.participantNames[otherId] ?? "Kullanıcı",
      avatar: conv.participantAvatars[otherId],
    };
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[var(--foreground)]">Mesajlar</h1>
        <p className="text-[var(--muted)]">Sohbetleriniz</p>
      </div>

      {error && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-12">
          <Spinner size="lg" />
        </div>
      ) : conversations.length === 0 ? (
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-12 text-center">
          <MessageCircle className="mx-auto h-12 w-12 text-gray-600" />
          <p className="mt-4 text-[var(--muted)]">Henüz mesajınız yok.</p>
          <p className="mt-2 text-sm text-[var(--muted)]">
            Bir kullanıcının profiline gidip &quot;Mesaj&quot; butonuna basarak sohbet başlatın.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {conversations.map((conv) => {
            const other = getOtherParticipant(conv);
            const unread = conv.unreadCounts[user?.uid ?? ""] ?? 0;
            return (
              <Link
                key={conv.id}
                href={`/messages/chat?id=${conv.id}`}
                className="flex items-center gap-3 rounded-xl border border-[var(--border)] bg-[var(--card)] p-4 transition-colors hover:bg-white/10"
              >
                <Avatar src={other.avatar} name={other.name} size="md" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <p className="font-medium text-[var(--foreground)]">{other.name}</p>
                    {conv.lastMessageAt && (
                      <span className="text-xs text-[var(--muted)]">
                        {formatRelative(conv.lastMessageAt)}
                      </span>
                    )}
                  </div>
                  <p className="truncate text-sm text-[var(--muted)]">
                    {conv.lastMessage ?? "Sohbet başlatın"}
                  </p>
                </div>
                {unread > 0 && (
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-orange-500 text-xs text-white">
                    {unread}
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
