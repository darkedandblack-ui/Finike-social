"use client";

import { Suspense, useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  getUserPosts,
  getOrCreateConversation,
  blockUser,
  subscribeToUserProfile,
} from "@/lib/firebase/firestore";
import { ProfileCard } from "@/components/profile/ProfileCard";
import { PostCard } from "@/components/posts/PostCard";
import { Spinner } from "@/components/ui/Spinner";
import { useAuth } from "@/contexts/AuthContext";
import type { UserProfile, Post } from "@/types";

function UserProfileContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user, profile: currentProfile } = useAuth();
  const userId = searchParams.get("id") ?? "";
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  const isOwn = user?.uid === userId;

  // Takipçi/takip sayısı F5 gerekmeden canlı güncellensin diye onSnapshot
  // ile dinleniyor (tek seferlik getDoc yerine).
  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }
    if (isOwn) {
      router.replace("/profile");
      return;
    }
    setLoading(true);
    const unsubscribe = subscribeToUserProfile(userId, (p) => {
      setProfile(p);
      setLoading(false);
    });
    return unsubscribe;
  }, [userId, isOwn, router]);

  useEffect(() => {
    if (!userId || isOwn) return;
    getUserPosts(userId).then(setPosts);
  }, [userId, isOwn]);

  const handleMessage = async () => {
    if (!user || !currentProfile || !profile) return;
    console.log("=== PROFILE PAGE: HANDLE MESSAGE START ===");
    console.log("Current User:", user.uid);
    console.log("Current Profile:", currentProfile.displayName);
    console.log("Target Profile:", profile.id, profile.displayName);
    try {
      const convId = await getOrCreateConversation(
        user.uid,
        profile.id,
        currentProfile.displayName,
        profile.displayName,
        currentProfile.avatarUrl,
        profile.avatarUrl
      );
      console.log("Conversation ID:", convId);
      console.log("Redirecting to chat...");
      router.push(`/messages/chat?id=${convId}`);
    } catch (err) {
      const errorCode = (err as { code?: string })?.code;
      const errorMessage = (err as { message?: string })?.message;
      console.error("=== PROFILE PAGE: HANDLE MESSAGE ERROR ===");
      console.error("Error Code:", errorCode);
      console.error("Error Message:", errorMessage);
      console.error("Full Error:", err);
      console.error("========================================");
      alert(`Mesaj başlatılamadı. Hata: ${errorCode || errorMessage}`);
    }
  };

  const handleBlock = async () => {
    if (!user || !profile) return;
    await blockUser(user.uid, profile.id);
    router.push("/feed");
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!profile) {
    return <p className="text-center text-gray-400">Kullanıcı bulunamadı.</p>;
  }

  return (
    <div className="space-y-6">
      <ProfileCard
        profile={profile}
        onMessage={handleMessage}
        onBlock={handleBlock}
      />

      <div>
        <h2 className="mb-4 text-xl font-semibold text-white">Gönderiler</h2>
        {posts.length === 0 ? (
          <p className="text-center text-gray-400 py-8">Henüz gönderi yok.</p>
        ) : (
          <div className="space-y-4">
            {posts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function UserProfilePage() {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center py-12">
          <Spinner size="lg" />
        </div>
      }
    >
      <UserProfileContent />
    </Suspense>
  );
}
