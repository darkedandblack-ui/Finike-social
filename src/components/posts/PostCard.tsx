"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Heart, MessageCircle, MoreHorizontal, Flag } from "lucide-react";
import { motion } from "framer-motion";
import type { Post } from "@/types";
import { Card } from "@/components/ui/Card";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { formatRelative } from "@/lib/utils";
import { toggleLike, isPostLiked } from "@/lib/firebase/firestore";
import { useAuth } from "@/contexts/AuthContext";
import { ReportModal } from "@/components/modals/ReportModal";

interface PostCardProps {
  post: Post;
  onLikeChange?: (postId: string, liked: boolean) => void;
}

export function PostCard({ post, onLikeChange }: PostCardProps) {
  const { user } = useAuth();
  const [liked, setLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(post.likesCount);
  const [loading, setLoading] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  useEffect(() => {
    if (user) {
      isPostLiked(post.id, user.uid).then(setLiked);
    }
  }, [user, post.id]);

  const handleLike = async () => {
    if (!user || loading) return;
    setLoading(true);
    const prevLiked = liked;
    const prevCount = likesCount;
    // Optimistic update so the UI feels instant
    const optimisticLiked = !prevLiked;
    setLiked(optimisticLiked);
    setLikesCount((prev) => (optimisticLiked ? prev + 1 : prev - 1));
    try {
      const newLiked = await toggleLike(post.id, user.uid);
      setLiked(newLiked);
      setLikesCount((prev) => {
        // Reconcile in case our optimistic guess didn't match the server result
        if (newLiked === optimisticLiked) return prev;
        return newLiked ? prev + 1 : prev - 1;
      });
      onLikeChange?.(post.id, newLiked);
    } catch (error) {
      console.error("Like error:", error);
      // Roll back the optimistic update on failure
      setLiked(prevLiked);
      setLikesCount(prevCount);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Card hover className="space-y-4">
          <div className="flex items-start justify-between">
            <Link
              href={`/profile/user?id=${post.authorId}`}
              className="flex items-center gap-3"
            >
              <Avatar
                src={post.authorAvatar}
                name={post.authorName}
                size="md"
              />
              <div>
                <p className="font-semibold text-white">{post.authorName}</p>
                <p className="text-sm text-gray-400">
                  {formatRelative(post.createdAt)}
                </p>
              </div>
            </Link>
            <div className="relative">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowMenu(!showMenu)}
              >
                <MoreHorizontal className="h-5 w-5" />
              </Button>
              {showMenu && (
                <div className="absolute right-0 top-full z-10 mt-1 w-40 rounded-xl border border-white/10 bg-gray-900 py-1 shadow-xl">
                  <button
                    onClick={() => {
                      setShowReport(true);
                      setShowMenu(false);
                    }}
                    className="flex w-full items-center gap-2 px-4 py-2 text-sm text-red-400 hover:bg-white/5"
                  >
                    <Flag className="h-4 w-4" />
                    Şikayet Et
                  </button>
                </div>
              )}
            </div>
          </div>

          <Badge variant="info">{post.category}</Badge>

          <p className="whitespace-pre-wrap text-gray-200">{post.content}</p>

          <div className="flex items-center gap-4 border-t border-white/10 pt-3">
            <button
              onClick={handleLike}
              disabled={loading}
              className="flex items-center gap-2 text-sm transition-colors hover:text-red-400"
            >
              <Heart
                className={`h-5 w-5 ${liked ? "fill-red-500 text-red-500" : "text-gray-400"}`}
              />
              <span className={liked ? "text-red-400" : "text-gray-400"}>
                {likesCount}
              </span>
            </button>
            <Link
              href={`/feed/post?id=${post.id}`}
              className="flex items-center gap-2 text-sm text-gray-400 transition-colors hover:text-teal-400"
            >
              <MessageCircle className="h-5 w-5" />
              {post.commentsCount}
            </Link>
          </div>
        </Card>
      </motion.div>

      <ReportModal
        isOpen={showReport}
        onClose={() => setShowReport(false)}
        type="post"
        targetId={post.id}
      />
    </>
  );
}
