"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { MapPin, Calendar, Users } from "lucide-react";
import type { UserProfile } from "@/types";
import { Card } from "@/components/ui/Card";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { INTEREST_OPTIONS } from "@/lib/utils";
import { toggleFollow, isFollowing } from "@/lib/firebase/firestore";
import { useAuth } from "@/contexts/AuthContext";

interface ProfileCardProps {
  profile: UserProfile;
  isOwn?: boolean;
  onMessage?: () => void;
  onBlock?: () => void;
  onFollowChange?: (isFollowing: boolean) => void;
}

export function ProfileCard({
  profile,
  isOwn = false,
  onMessage,
  onBlock,
  onFollowChange,
}: ProfileCardProps) {
  const { user } = useAuth();
  const [following, setFollowing] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user && !isOwn) {
      isFollowing(user.uid, profile.id).then(setFollowing);
    }
  }, [user, isOwn, profile.id]);

  const handleFollow = async () => {
    if (!user || isOwn || loading) return;
    setLoading(true);
    try {
      const newFollowing = await toggleFollow(user.uid, profile.id);
      setFollowing(newFollowing);
      onFollowChange?.(newFollowing);
    } catch (error) {
      console.error("Follow error:", error);
    } finally {
      setLoading(false);
    }
  };
  return (
    <Card className="overflow-hidden p-0">
      <div className="relative h-32 bg-gradient-to-r from-orange-600 to-amber-600">
        {profile.coverUrl && (
          <img
            src={profile.coverUrl}
            alt="Cover"
            className="h-full w-full object-cover"
          />
        )}
        <div className="absolute -bottom-10 left-6">
          <Avatar
            src={profile.avatarUrl}
            name={profile.displayName}
            size="xl"
            className="ring-4 ring-gray-900"
          />
        </div>
      </div>

      <div className="px-6 pb-6 pt-14">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-xl font-bold text-[var(--foreground)]">{profile.displayName}</h2>
            <p className="text-[var(--muted)]">@{profile.username}</p>
          </div>
          <div className="flex gap-2">
            {isOwn ? (
              <Link href="/profile/edit">
                <Button variant="outline" size="sm">
                  Düzenle
                </Button>
              </Link>
            ) : (
              <>
                <Button
                  size="sm"
                  onClick={handleFollow}
                  loading={loading}
                  variant={following ? "outline" : "primary"}
                >
                  {following ? "Takibi Bırak" : "Takip Et"}
                </Button>
                {onMessage && (
                  <Button size="sm" onClick={onMessage}>
                    Mesaj
                  </Button>
                )}
                {onBlock && (
                  <Button variant="danger" size="sm" onClick={onBlock}>
                    Engelle
                  </Button>
                )}
              </>
            )}
          </div>
        </div>

        {profile.bio && (
          <p className="mt-4 text-[var(--foreground)]">{profile.bio}</p>
        )}

        {profile.location && (
          <div className="mt-3 flex items-center gap-2 text-sm text-[var(--muted)]">
            <MapPin className="h-4 w-4 text-orange-500" />
            {profile.location.city}
            {profile.location.address && ` — ${profile.location.address}`}
          </div>
        )}

        <div className="mt-4 flex gap-6 text-sm">
          <div>
            <span className="font-semibold text-[var(--foreground)]">{profile.postsCount}</span>
            <span className="ml-1 text-[var(--muted)]">Gönderi</span>
          </div>
          <div>
            <span className="font-semibold text-[var(--foreground)]">{profile.followersCount}</span>
            <span className="ml-1 text-[var(--muted)]">Takipçi</span>
          </div>
          <div>
            <span className="font-semibold text-[var(--foreground)]">{profile.followingCount}</span>
            <span className="ml-1 text-[var(--muted)]">Takip</span>
          </div>
        </div>

        {profile.interests.length > 0 && (
          <div className="mt-4">
            <p className="mb-2 flex items-center gap-1 text-sm font-medium text-[var(--muted)]">
              <Users className="h-4 w-4" />
              İlgi Alanları
            </p>
            <div className="flex flex-wrap gap-2">
              {profile.interests.map((interest) => (
                <Badge key={interest} variant="info">
                  {interest}
                </Badge>
              ))}
            </div>
          </div>
        )}

        <div className="mt-4 flex items-center gap-1 text-xs text-[var(--muted)]">
          <Calendar className="h-3 w-3" />
          Katılım: {profile.createdAt.toLocaleDateString("tr-TR")}
        </div>
      </div>
    </Card>
  );
}
