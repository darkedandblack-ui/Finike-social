"use client";

import { useState, useEffect } from "react";
import { ProfileCard } from "@/components/profile/ProfileCard";
import { PostCard } from "@/components/posts/PostCard";
import { Spinner } from "@/components/ui/Spinner";
import { useAuth } from "@/contexts/AuthContext";
import { getUserPosts, subscribeToUserProfile } from "@/lib/firebase/firestore";
import type { Post, UserProfile } from "@/types";

export default function ProfilePage() {
  const { profile: authProfile } = useAuth();
  const [liveProfile, setLiveProfile] = useState<UserProfile | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  // Takipçi/takip sayısı gibi alanlar canlı (real-time) güncellensin diye
  // tek seferlik AuthContext profilini değil, Firestore onSnapshot aboneliğini kullan.
  useEffect(() => {
    if (!authProfile?.id) return;
    const unsubscribe = subscribeToUserProfile(authProfile.id, setLiveProfile);
    return unsubscribe;
  }, [authProfile?.id]);

  useEffect(() => {
    if (authProfile?.id) {
      getUserPosts(authProfile.id).then((p) => {
        setPosts(p);
        setLoading(false);
      });
    }
  }, [authProfile?.id]);

  const profile = liveProfile ?? authProfile;

  if (!profile) return null;

  return (
    <div className="space-y-6">
      <ProfileCard profile={profile} isOwn />

      <div>
        <h2 className="mb-4 text-xl font-semibold text-[var(--foreground)]">Gönderilerim</h2>
        {loading ? (
          <div className="flex justify-center py-8">
            <Spinner />
          </div>
        ) : posts.length === 0 ? (
          <p className="text-center text-[var(--muted)] py-8">Henüz gönderi yok.</p>
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
