"use client";

import { useState, useEffect } from "react";
import { Trash2 } from "lucide-react";
import type { Comment } from "@/types";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Textarea";
import { formatRelative } from "@/lib/utils";
import { getComments, addComment, deleteComment } from "@/lib/firebase/firestore";
import { useAuth } from "@/contexts/AuthContext";
import { createNotification } from "@/lib/firebase/firestore";

interface CommentSectionProps {
  postId: string;
  authorId: string;
}

export function CommentSection({ postId, authorId }: CommentSectionProps) {
  const { user, profile } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    getComments(postId).then(setComments);
  }, [postId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || !user || !profile || loading) return;

    setLoading(true);
    try {
      await addComment({
        postId,
        authorId: user.uid,
        authorName: profile.displayName,
        authorAvatar: profile.avatarUrl,
        content: content.trim(),
      });

      if (authorId !== user.uid) {
        await createNotification({
          userId: authorId,
          type: "comment",
          title: "Yeni Yorum",
          body: `${profile.displayName} gönderinize yorum yaptı`,
          link: `/feed/post?id=${postId}`,
          actorId: user.uid,
          actorName: profile.displayName,
        });
      }

      setContent("");
      const updated = await getComments(postId);
      setComments(updated);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (commentId: string) => {
    await deleteComment(commentId, postId);
    setComments((prev) => prev.filter((c) => c.id !== commentId));
  };

  return (
    <div className="space-y-4">
      <form onSubmit={handleSubmit} className="flex gap-2">
        <Textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Yorum yazın..."
          rows={2}
          className="flex-1"
        />
        <Button type="submit" loading={loading} disabled={!content.trim()}>
          Gönder
        </Button>
      </form>

      <div className="space-y-3">
        {comments.map((comment) => (
          <div key={comment.id} className="flex gap-3 rounded-xl bg-[var(--card)] p-3">
            <Avatar
              src={comment.authorAvatar}
              name={comment.authorName}
              size="sm"
            />
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-medium text-[var(--foreground)]">{comment.authorName}</span>
                  <span className="ml-2 text-xs text-[var(--muted)]">
                    {formatRelative(comment.createdAt)}
                  </span>
                </div>
                {user?.uid === comment.authorId && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(comment.id)}
                  >
                    <Trash2 className="h-4 w-4 text-red-400" />
                  </Button>
                )}
              </div>
              <p className="mt-1 text-sm text-[var(--foreground)]">{comment.content}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
