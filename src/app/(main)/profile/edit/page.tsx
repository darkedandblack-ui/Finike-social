"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { profileSchema, type ProfileFormData } from "@/lib/validations";
import { updateUserProfile } from "@/lib/firebase/auth";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Card } from "@/components/ui/Card";
import { Avatar } from "@/components/ui/Avatar";
import { INTEREST_OPTIONS } from "@/lib/utils";
import { cn } from "@/lib/utils";

export default function EditProfilePage() {
  const router = useRouter();
  const { user, profile, refreshProfile } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [selectedInterests, setSelectedInterests] = useState<string[]>(
    profile?.interests ?? []
  );

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      displayName: profile?.displayName ?? "",
      username: profile?.username ?? "",
      bio: profile?.bio ?? "",
      city: profile?.location?.city ?? "Finike",
      interests: profile?.interests ?? [],
    },
  });

  const toggleInterest = (interest: string) => {
    setSelectedInterests((prev) =>
      prev.includes(interest)
        ? prev.filter((i) => i !== interest)
        : [...prev, interest]
    );
  };

  const onSubmit = async (data: ProfileFormData) => {
    if (!user || !profile) return;
    setSubmitting(true);
    try {
      await updateUserProfile(user.uid, {
        displayName: data.displayName,
        username: data.username,
        bio: data.bio,
        interests: selectedInterests,
        location: {
          lat: profile.location?.lat ?? 36.2978,
          lng: profile.location?.lng ?? 30.1467,
          city: data.city,
        },
      });

      await refreshProfile();
      router.push("/profile");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Profili Düzenle</h1>
        <p className="text-gray-400">Profil bilgilerinizi güncelleyin</p>
      </div>

      <Card>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="flex items-center gap-4">
            <Avatar
              src={profile?.avatarUrl}
              name={profile?.displayName ?? ""}
              size="xl"
            />
            <p className="text-sm text-gray-400">
              Google ile giriş yaptıysan profil fotoğrafın otomatik gelir.
            </p>
          </div>

          <Input
            label="Ad Soyad"
            error={errors.displayName?.message}
            {...register("displayName")}
          />
          <Input
            label="Kullanıcı Adı"
            error={errors.username?.message}
            {...register("username")}
          />
          <Textarea
            label="Bio"
            rows={3}
            error={errors.bio?.message}
            {...register("bio")}
          />
          <Input
            label="Şehir"
            error={errors.city?.message}
            {...register("city")}
          />

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-300">
              İlgi Alanları
            </label>
            <div className="flex flex-wrap gap-2">
              {INTEREST_OPTIONS.map((interest) => (
                <button
                  key={interest}
                  type="button"
                  onClick={() => toggleInterest(interest)}
                  className={cn(
                    "rounded-full px-3 py-1 text-sm transition-colors",
                    selectedInterests.includes(interest)
                      ? "bg-teal-500 text-white"
                      : "bg-white/5 text-gray-400 hover:bg-white/10"
                  )}
                >
                  {interest}
                </button>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => router.back()}>
              İptal
            </Button>
            <Button type="submit" loading={submitting}>
              Kaydet
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
