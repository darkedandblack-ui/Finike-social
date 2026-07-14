"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight, ChevronLeft, MapPin, Check } from "lucide-react";
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

const STEPS = ["Profil", "Detaylar", "İlgi Alanları", "Konum"];

export default function OnboardingPage() {
  const router = useRouter();
  const { user, profile, refreshProfile } = useAuth();
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [locationGranted, setLocationGranted] = useState(false);
  const [coords, setCoords] = useState({ lat: 36.2978, lng: 30.1467 });

  const {
    register,
    getValues,
    formState: { errors },
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      displayName: profile?.displayName ?? "",
      username: profile?.username ?? "",
      bio: "",
      city: "Finike",
      interests: [],
    },
  });

  const toggleInterest = (interest: string) => {
    setSelectedInterests((prev) =>
      prev.includes(interest)
        ? prev.filter((i) => i !== interest)
        : [...prev, interest]
    );
  };

  const requestLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setCoords({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
          });
          setLocationGranted(true);
        },
        () => setLocationGranted(true)
      );
    }
  };

  const finishOnboarding = async () => {
    if (!user) return;
    setSubmitting(true);
    try {
      const data = getValues();
      await updateUserProfile(user.uid, {
        displayName: data.displayName,
        username: data.username,
        bio: data.bio,
        interests: selectedInterests,
        location: {
          lat: coords.lat,
          lng: coords.lng,
          city: data.city,
        },
        isOnboarded: true,
      });
      await refreshProfile();
      router.push("/feed");
    } finally {
      setSubmitting(false);
    }
  };

  const nextStep = () => {
    if (step < STEPS.length - 1) {
      setStep(step + 1);
    } else {
      finishOnboarding();
    }
  };

  const prevStep = () => {
    if (step > 0) setStep(step - 1);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-gray-950 via-gray-900 to-orange-950/30 p-4">
      <Card className="w-full max-w-lg">
        <div className="mb-6">
          <div className="mb-4 flex justify-between">
            {STEPS.map((s, i) => (
              <div key={s} className="flex flex-col items-center gap-1">
                <div
                  className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium",
                    i <= step
                      ? "bg-orange-500 text-white"
                      : "bg-white/10 text-[var(--muted)]"
                  )}
                >
                  {i < step ? <Check className="h-4 w-4" /> : i + 1}
                </div>
                <span className="text-xs text-[var(--muted)]">{s}</span>
              </div>
            ))}
          </div>
          <div className="h-1 rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-orange-500 transition-all"
              style={{ width: `${((step + 1) / STEPS.length) * 100}%` }}
            />
          </div>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-4"
          >
            {step === 0 && (
              <>
                <h2 className="text-xl font-bold text-[var(--foreground)]">Profilini Onayla</h2>
                <div className="flex justify-center">
                  <Avatar
                    src={profile?.avatarUrl}
                    name={profile?.displayName ?? ""}
                    size="xl"
                  />
                </div>
                <p className="text-center text-sm text-[var(--muted)]">
                  Google hesabından alınan bilgilerin doğru mu?
                </p>
              </>
            )}

            {step === 1 && (
              <>
                <h2 className="text-xl font-bold text-[var(--foreground)]">Profil Detayları</h2>
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
                  placeholder="Kendinizi tanıtın..."
                  {...register("bio")}
                />
              </>
            )}

            {step === 2 && (
              <>
                <h2 className="text-xl font-bold text-[var(--foreground)]">İlgi Alanların</h2>
                <p className="text-sm text-[var(--muted)]">En az bir tane seçin</p>
                <div className="flex flex-wrap gap-2">
                  {INTEREST_OPTIONS.map((interest) => (
                    <button
                      key={interest}
                      type="button"
                      onClick={() => toggleInterest(interest)}
                      className={cn(
                        "rounded-full px-4 py-2 text-sm transition-colors",
                        selectedInterests.includes(interest)
                          ? "bg-orange-500 text-white"
                          : "bg-[var(--card)] text-[var(--muted)] hover:bg-white/10"
                      )}
                    >
                      {interest}
                    </button>
                  ))}
                </div>
              </>
            )}

            {step === 3 && (
              <>
                <h2 className="text-xl font-bold text-[var(--foreground)]">Konum İzni</h2>
                <p className="text-sm text-[var(--muted)]">
                  Yakınındaki etkinlikleri görmek için konumunuza ihtiyacımız var.
                </p>
                <Input label="Şehir" defaultValue="Finike" {...register("city")} />
                <Button
                  variant="secondary"
                  className="w-full"
                  onClick={requestLocation}
                >
                  <MapPin className="h-5 w-5" />
                  {locationGranted ? "Konum Alındı ✓" : "Konumumu Paylaş"}
                </Button>
              </>
            )}
          </motion.div>
        </AnimatePresence>

        <div className="mt-6 flex justify-between">
          <Button variant="ghost" onClick={prevStep} disabled={step === 0}>
            <ChevronLeft className="h-4 w-4" />
            Geri
          </Button>
          <Button
            onClick={nextStep}
            loading={submitting}
            disabled={step === 2 && selectedInterests.length === 0}
          >
            {step === STEPS.length - 1 ? "Tamamla" : "İleri"}
            {step < STEPS.length - 1 && <ChevronRight className="h-4 w-4" />}
          </Button>
        </div>
      </Card>
    </div>
  );
}
