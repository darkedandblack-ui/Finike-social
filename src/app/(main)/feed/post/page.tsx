"use client";

import { Suspense, useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getPost } from "@/lib/firebase/firestore";
import { PostCard } from "@/components/posts/PostCard";
import { CommentSection } from "@/components/posts/CommentSection";
import { Spinner } from "@/components/ui/Spinner";
import { Card } from "@/components/ui/Card";
import type { Post } from "@/types";

function PostDetailContent() {
  const searchParams = useSearchParams();
  const postId = searchParams.get("id") ?? "";
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!postId) {
      setLoading(false);
      return;
    }
    getPost(postId).then((p) => {
      setPost(p);
      setLoading(false);
    });
  }, [postId]);

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!post) {
    return (
      <Card className="p-8 text-center">
        <p className="text-gray-400">Gönderi bulunamadı.</p>
        <Link href="/feed" className="mt-4 inline-block text-teal-400">
          Akışa dön
        </Link>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Link
        href="/feed"
        className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white"
      >
        <ArrowLeft className="h-4 w-4" />
        Akışa Dön
      </Link>

      <PostCard post={post} />

      <Card>
        <h2 className="mb-4 text-lg font-semibold text-white">Yorumlar</h2>
        <CommentSection postId={post.id} authorId={post.authorId} />
      </Card>
    </div>
  );
}

export default function PostDetailPage() {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center py-12">
          <Spinner size="lg" />
        </div>
      }
    >
      <PostDetailContent />
    </Suspense>
  );
}
