"use client";

import { Suspense, useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { getFirebaseDb } from "@/lib/firebase/config";
import { subscribeToMessages } from "@/lib/firebase/firestore";
import { conversationFromFirestore } from "@/lib/firebase/converters";
import { ChatBox } from "@/components/chat/ChatBox";
import { Spinner } from "@/components/ui/Spinner";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/contexts/AuthContext";
import type { Message, Conversation } from "@/types";

function ChatContent() {
  const searchParams = useSearchParams();
  const conversationId = searchParams.get("id") ?? "";
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user || !conversationId) {
      setLoading(false);
      if (!conversationId) setError("Geçersiz sohbet.");
      return;
    }

    const loadConversation = async () => {
      console.log("=== CHAT PAGE: LOAD CONVERSATION START ===");
      console.log("Conversation ID:", conversationId);
      console.log("User ID:", user.uid);
      try {
        const snap = await getDoc(doc(getFirebaseDb(), "conversations", conversationId));
        if (!snap.exists()) {
          console.error("Conversation does not exist");
          setError("Sohbet bulunamadı.");
          setLoading(false);
          return;
        }

        const conv = conversationFromFirestore(snap);
        console.log("Conversation loaded:", conv.id);
        console.log("Participant IDs:", conv.participantIds);
        if (!conv.participantIds.includes(user.uid)) {
          console.error("User not in participantIds");
          setError("Bu sohbete erişim izniniz yok.");
          setLoading(false);
          return;
        }

        setConversation(conv);
        try {
          await updateDoc(doc(getFirebaseDb(), "conversations", conversationId), {
            [`unreadCounts.${user.uid}`]: 0,
          });
          console.log("Unread count cleared");
        } catch (updateError) {
          const errorCode = (updateError as { code?: string })?.code;
          console.error("=== UPDATE UNREAD COUNT ERROR ===");
          console.error("Error Code:", errorCode);
          console.error("Full Error:", updateError);
          console.error("==================================");
        }
      } catch (err) {
        const errorCode = (err as { code?: string })?.code;
        const errorMessage = (err as { message?: string })?.message;
        console.error("=== LOAD CONVERSATION ERROR ===");
        console.error("Error Code:", errorCode);
        console.error("Error Message:", errorMessage);
        console.error("Full Error:", err);
        console.error("================================");
        setError("Sohbet yüklenemedi.");
      } finally {
        setLoading(false);
      }
    };

    loadConversation();
  }, [conversationId, user]);

  useEffect(() => {
    if (!conversation || !conversationId) return;

    const unsub = subscribeToMessages(
      conversationId,
      setMessages,
      () => setError("Mesajlar yüklenemedi.")
    );
    return unsub;
  }, [conversationId, conversation]);

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error || !conversation || !user) {
    return (
      <div className="space-y-4 text-center">
        <p className="text-gray-400">{error || "Sohbet bulunamadı."}</p>
        <Link href="/messages">
          <Button variant="outline">Mesajlara Dön</Button>
        </Link>
      </div>
    );
  }

  const recipientId = conversation.participantIds.find((id) => id !== user.uid) ?? "";
  const recipientName = conversation.participantNames[recipientId] ?? "Kullanıcı";

  return (
    <div className="flex h-[calc(100vh-12rem)] flex-col space-y-4">
      <Link
        href="/messages"
        className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white"
      >
        <ArrowLeft className="h-4 w-4" />
        Mesajlara Dön
      </Link>

      <div className="flex-1">
        <ChatBox
          conversationId={conversationId}
          messages={messages}
          recipientId={recipientId}
          recipientName={recipientName}
        />
      </div>
    </div>
  );
}

export default function ConversationPage() {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center py-12">
          <Spinner size="lg" />
        </div>
      }
    >
      <ChatContent />
    </Suspense>
  );
}
