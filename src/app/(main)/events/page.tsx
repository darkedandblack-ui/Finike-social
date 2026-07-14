"use client";

import { useState, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, MapPin, ImagePlus, X } from "lucide-react";
import { eventSchema, type EventFormData } from "@/lib/validations";
import { createEvent, getEvents, joinEvent, leaveEvent } from "@/lib/firebase/firestore";
import { uploadImageToCloudinary } from "@/lib/cloudinary";
import { EventCard } from "@/components/events/EventCard";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Select } from "@/components/ui/Select";
import { Modal } from "@/components/ui/Modal";
import { Spinner } from "@/components/ui/Spinner";
import { EVENT_CATEGORIES } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import type { Event } from "@/types";

export default function EventsPage() {
  const { user, profile } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [joiningId, setJoiningId] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imageError, setImageError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<EventFormData>({
    resolver: zodResolver(eventSchema),
    defaultValues: {
      category: "Sosyal",
      maxParticipants: 20,
      lat: 36.2978,
      lng: 30.1467,
      address: "Finike Merkez",
    },
  });

  const loadEvents = async () => {
    setLoading(true);
    const data = await getEvents(30);
    setEvents(data);
    setLoading(false);
  };

  useEffect(() => {
    loadEvents();
  }, []);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageError(null);
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const clearImage = () => {
    setImageFile(null);
    setImagePreview(null);
    setImageError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const onSubmit = async (data: EventFormData) => {
    if (!user || !profile) return;
    setSubmitting(true);
    try {
      let imageUrl: string | undefined;
      if (imageFile) {
        setUploadingImage(true);
        try {
          imageUrl = await uploadImageToCloudinary(imageFile);
        } catch (err) {
          setImageError(err instanceof Error ? err.message : "Fotoğraf yüklenemedi");
          setUploadingImage(false);
          setSubmitting(false);
          return;
        }
        setUploadingImage(false);
      }

      await createEvent({
        organizerId: user.uid,
        organizerName: profile.displayName,
        organizerAvatar: profile.avatarUrl,
        title: data.title,
        description: data.description,
        imageUrl,
        category: data.category,
        location: {
          lat: data.lat,
          lng: data.lng,
          city: "Finike",
          address: data.address,
        },
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
        maxParticipants: data.maxParticipants,
      });

      reset();
      clearImage();
      setShowCreate(false);
      await loadEvents();
    } finally {
      setSubmitting(false);
    }
  };

  const handleJoin = async (eventId: string) => {
    if (!user || !profile) return;
    setJoiningId(eventId);
    try {
      await joinEvent(eventId, user.uid, profile.displayName, profile.avatarUrl);
      await loadEvents();
    } finally {
      setJoiningId(null);
    }
  };

  const handleLeave = async (eventId: string) => {
    if (!user) return;
    setJoiningId(eventId);
    try {
      await leaveEvent(eventId, user.uid);
      await loadEvents();
    } finally {
      setJoiningId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--foreground)]">Etkinlikler</h1>
          <p className="text-[var(--muted)]">Finike&apos;deki etkinlikleri keşfet</p>
        </div>
        <Button onClick={() => setShowCreate(true)}>
          <Plus className="h-5 w-5" />
          Etkinlik Oluştur
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Spinner size="lg" />
        </div>
      ) : events.length === 0 ? (
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-12 text-center">
          <MapPin className="mx-auto h-12 w-12 text-gray-600" />
          <p className="mt-4 text-[var(--muted)]">Henüz etkinlik yok.</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {events.map((event) => (
            <EventCard
              key={event.id}
              event={event}
              onJoin={handleJoin}
              onLeave={handleLeave}
              joining={joiningId === event.id}
            />
          ))}
        </div>
      )}

      <Modal
        isOpen={showCreate}
        onClose={() => {
          setShowCreate(false);
          clearImage();
        }}
        title="Yeni Etkinlik"
        size="lg"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-[var(--foreground)]">
              Fotoğraf (opsiyonel)
            </label>
            {imagePreview ? (
              <div className="relative">
                <img
                  src={imagePreview}
                  alt="Önizleme"
                  className="max-h-48 w-full rounded-xl object-cover"
                />
                <button
                  type="button"
                  onClick={clearImage}
                  className="absolute right-2 top-2 rounded-full bg-black/60 p-1.5 text-white hover:bg-black/80"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex w-full flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-[var(--border-strong)] py-8 text-[var(--muted)] hover:border-orange-500/50 hover:text-orange-500"
              >
                <ImagePlus className="h-6 w-6" />
                <span className="text-sm">Fotoğraf seçmek için tıkla</span>
              </button>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageSelect}
              className="hidden"
            />
            {imageError && (
              <p className="mt-1.5 text-sm text-red-400">{imageError}</p>
            )}
          </div>

          <Input
            label="Başlık"
            error={errors.title?.message}
            {...register("title")}
          />
          <Textarea
            label="Açıklama"
            rows={3}
            error={errors.description?.message}
            {...register("description")}
          />
          <Select
            label="Kategori"
            options={EVENT_CATEGORIES.map((c) => ({ value: c, label: c }))}
            {...register("category")}
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Başlangıç"
              type="datetime-local"
              error={errors.startDate?.message}
              {...register("startDate")}
            />
            <Input
              label="Bitiş"
              type="datetime-local"
              error={errors.endDate?.message}
              {...register("endDate")}
            />
          </div>
          <Input
            label="Adres"
            error={errors.address?.message}
            {...register("address")}
          />
          <Input
            label="Maks. Katılımcı"
            type="number"
            error={errors.maxParticipants?.message}
            {...register("maxParticipants")}
          />
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setShowCreate(false);
                clearImage();
              }}
            >
              İptal
            </Button>
            <Button type="submit" loading={submitting || uploadingImage}>
              {uploadingImage ? "Fotoğraf yükleniyor..." : "Oluştur"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
