"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, MapPin } from "lucide-react";
import { eventSchema, type EventFormData } from "@/lib/validations";
import { createEvent, getEvents, joinEvent, leaveEvent } from "@/lib/firebase/firestore";
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

  const onSubmit = async (data: EventFormData) => {
    if (!user || !profile) return;
    setSubmitting(true);
    try {
      await createEvent({
        organizerId: user.uid,
        organizerName: profile.displayName,
        organizerAvatar: profile.avatarUrl,
        title: data.title,
        description: data.description,
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
          <h1 className="text-2xl font-bold text-white">Etkinlikler</h1>
          <p className="text-gray-400">Finike&apos;deki etkinlikleri keşfet</p>
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
        <div className="rounded-2xl border border-white/10 bg-white/5 p-12 text-center">
          <MapPin className="mx-auto h-12 w-12 text-gray-600" />
          <p className="mt-4 text-gray-400">Henüz etkinlik yok.</p>
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
        onClose={() => setShowCreate(false)}
        title="Yeni Etkinlik"
        size="lg"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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
            <Button type="button" variant="ghost" onClick={() => setShowCreate(false)}>
              İptal
            </Button>
            <Button type="submit" loading={submitting}>
              Oluştur
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
