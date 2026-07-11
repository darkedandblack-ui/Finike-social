import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Geçerli bir e-posta adresi girin"),
  password: z.string().min(6, "Şifre en az 6 karakter olmalı"),
});

export const registerSchema = z
  .object({
    displayName: z.string().min(2, "İsim en az 2 karakter olmalı"),
    email: z.string().email("Geçerli bir e-posta adresi girin"),
    password: z.string().min(6, "Şifre en az 6 karakter olmalı"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Şifreler eşleşmiyor",
    path: ["confirmPassword"],
  });

export const profileSchema = z.object({
  displayName: z.string().min(2, "İsim en az 2 karakter olmalı"),
  username: z
    .string()
    .min(3, "Kullanıcı adı en az 3 karakter olmalı")
    .regex(/^[a-zA-Z0-9_]+$/, "Sadece harf, rakam ve alt çizgi kullanın"),
  bio: z.string().max(300, "Bio en fazla 300 karakter olabilir").optional(),
  interests: z.array(z.string()).min(1, "En az bir ilgi alanı seçin"),
  city: z.string().min(2, "Şehir bilgisi gerekli"),
});

export const postSchema = z.object({
  content: z
    .string()
    .min(1, "Gönderi içeriği boş olamaz")
    .max(2000, "Gönderi en fazla 2000 karakter olabilir"),
  category: z.string().min(1, "Kategori seçin"),
});

export const eventSchema = z.object({
  title: z.string().min(3, "Başlık en az 3 karakter olmalı"),
  description: z.string().min(10, "Açıklama en az 10 karakter olmalı"),
  category: z.string().min(1, "Kategori seçin"),
  startDate: z.string().min(1, "Başlangıç tarihi gerekli"),
  endDate: z.string().min(1, "Bitiş tarihi gerekli"),
  maxParticipants: z.number().min(2).max(500),
  address: z.string().min(3, "Adres gerekli"),
  lat: z.number(),
  lng: z.number(),
});

export const messageSchema = z.object({
  content: z
    .string()
    .min(1, "Mesaj boş olamaz")
    .max(1000, "Mesaj en fazla 1000 karakter olabilir"),
});

export const reportSchema = z.object({
  type: z.enum(["post", "comment", "user", "message", "event"]),
  targetId: z.string().min(1),
  reason: z.string().min(3, "Sebep en az 3 karakter olmalı"),
  description: z.string().max(500).optional(),
});

export type LoginFormData = z.infer<typeof loginSchema>;
export type RegisterFormData = z.infer<typeof registerSchema>;
export type ProfileFormData = z.infer<typeof profileSchema>;
export type PostFormData = z.infer<typeof postSchema>;
export type EventFormData = z.infer<typeof eventSchema>;
export type MessageFormData = z.infer<typeof messageSchema>;
export type ReportFormData = z.infer<typeof reportSchema>;
