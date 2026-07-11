"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Textarea";
import { Select } from "@/components/ui/Select";
import { reportSchema, type ReportFormData } from "@/lib/validations";
import { createReport } from "@/lib/firebase/firestore";
import { useAuth } from "@/contexts/AuthContext";
import type { ReportType } from "@/types";

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: ReportType;
  targetId: string;
}

const reasonOptions = [
  { value: "spam", label: "Spam" },
  { value: "harassment", label: "Taciz" },
  { value: "inappropriate", label: "Uygunsuz İçerik" },
  { value: "misinformation", label: "Yanlış Bilgi" },
  { value: "other", label: "Diğer" },
];

export function ReportModal({ isOpen, onClose, type, targetId }: ReportModalProps) {
  const { user, profile } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ReportFormData>({
    resolver: zodResolver(reportSchema),
    defaultValues: { type, targetId, reason: "", description: "" },
  });

  const onSubmit = async (data: ReportFormData) => {
    if (!user || !profile) return;
    setSubmitting(true);
    try {
      await createReport({
        reporterId: user.uid,
        reporterName: profile.displayName,
        type: data.type,
        targetId: data.targetId,
        reason: data.reason,
        description: data.description,
      });
      setSuccess(true);
      reset();
      setTimeout(() => {
        setSuccess(false);
        onClose();
      }, 2000);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Şikayet Et" size="md">
      {success ? (
        <p className="py-4 text-center text-emerald-400">
          Şikayetiniz alındı. İnceleme sürecine alınacaktır.
        </p>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <input type="hidden" {...register("type")} />
          <input type="hidden" {...register("targetId")} />

          <Select
            label="Sebep"
            options={reasonOptions}
            error={errors.reason?.message}
            {...register("reason")}
          />

          <Textarea
            label="Açıklama (opsiyonel)"
            rows={3}
            placeholder="Detaylı açıklama yazın..."
            error={errors.description?.message}
            {...register("description")}
          />

          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={onClose}>
              İptal
            </Button>
            <Button type="submit" loading={submitting}>
              Gönder
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
}
