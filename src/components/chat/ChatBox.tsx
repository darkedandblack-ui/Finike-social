"use client";

import { useState, useRef, useEffect } from "react";
import { Send } from "lucide-react";
import type { Message } from "@/types";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { formatRelative } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { sendMessage } from "@/lib/firebase/firestore";
import { ensureUserProfile } from "@/lib/firebase/auth";

interface ChatBoxProps {
  conversationId: string;
  messages: Message[];
  recipientId: string;
  recipientName: string;
}

export function ChatBox({
  conversationId,
  messages,
  recipientId,
  recipientName,
}: ChatBoxProps) {
  const { user, profile } = useAuth();
  const [content, setContent] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || !user || !profile || sending) return;

    setSending(true);
    setError("");
    try {
      await ensureUserProfile(user);
      await sendMessage({
        conversationId,
        senderId: user.uid,
        senderName: profile.displayName,
        content: content.trim(),
        recipientId,
      });
      setContent("");
    } catch (err) {
      console.error("Send message failed:", err);
      const code = (err as { code?: string })?.code;
      if (code === "permission-denied") {
        setError("Mesaj izni yok. Çıkış yapıp tekrar giriş yapın.");
      } else {
        setError("Mesaj gönderilemedi. Tekrar deneyin.");
      }
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex h-full min-h-[400px] flex-col rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl">
      <div className="border-b border-white/10 px-4 py-3">
        <h3 className="font-semibold text-white">{recipientName}</h3>
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto p-4">
        {messages.length === 0 && (
          <p className="text-center text-sm text-gray-500">
            Henüz mesaj yok. İlk mesajı gönderin!
          </p>
        )}
        {messages.map((message) => {
          const isOwn = message.senderId === user?.uid;
          return (
            <div
              key={message.id}
              className={`flex gap-2 ${isOwn ? "flex-row-reverse" : ""}`}
            >
              {!isOwn && (
                <Avatar src={undefined} name={message.senderName} size="sm" />
              )}
              <div
                className={`max-w-[75%] rounded-2xl px-4 py-2 ${
                  isOwn
                    ? "bg-gradient-to-r from-teal-500 to-cyan-500 text-white"
                    : "bg-white/10 text-gray-200"
                }`}
              >
                <p className="text-sm">{message.content}</p>
                <p
                  className={`mt-1 text-xs ${isOwn ? "text-white/70" : "text-gray-500"}`}
                >
                  {formatRelative(message.createdAt)}
                </p>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {error && (
        <div className="mx-4 mb-2 rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-400">
          {error}
        </div>
      )}

      <form
        onSubmit={handleSend}
        className="flex items-center gap-2 border-t border-white/10 p-4"
      >
        <Input
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Mesajınızı yazın..."
          className="flex-1"
          disabled={sending}
        />
        <Button
          type="submit"
          size="icon"
          loading={sending}
          disabled={!content.trim() || sending}
        >
          <Send className="h-5 w-5" />
        </Button>
      </form>
    </div>
  );
}
