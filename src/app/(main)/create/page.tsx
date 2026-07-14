"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { postSchema, type PostFormData } from "@/lib/validations";
import { createPost } from "@/lib/firebase/firestore";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Textarea";
import { Select } from "@/components/ui/Select";
import { Card } from "@/components/ui/Card";
import { POST_CATEGORIES } from "@/lib/utils";

export default function CreatePostPage() {
  const router = useRouter();
  const { user, profile } = useAuth();
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<PostFormData>({
    resolver: zodResolver(postSchema),
    defaultValues: { category: "Genel" },
  });

  const onSubmit = async (data: PostFormData) => {
    if (!user || !profile) return;
    setSubmitting(true);
    try {
      await createPost({
        authorId: user.uid,
        authorName: profile.displayName,
        authorAvatar: profile.avatarUrl,
        content: data.content,
        category: data.category,
      });

      router.push("/feed");
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[var(--foreground)]">Gönderi Oluştur</h1>
        <p className="text-[var(--muted)]">Düşüncelerini paylaş</p>
      </div>

      <Card>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Select
            label="Kategori"
            options={POST_CATEGORIES.map((c) => ({ value: c, label: c }))}
            error={errors.category?.message}
            {...register("category")}
          />

          <Textarea
            label="İçerik"
            rows={5}
            placeholder="Ne düşünüyorsun?"
            error={errors.content?.message}
            {...register("content")}
          />

          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => router.back()}>
              İptal
            </Button>
            <Button type="submit" loading={submitting}>
              Paylaş
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
