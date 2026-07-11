import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, formatDistanceToNow, isPast, isFuture } from "date-fns";
import { tr } from "date-fns/locale";
import type { Event, EventStatus } from "@/types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date): string {
  return format(date, "d MMMM yyyy, HH:mm", { locale: tr });
}

export function formatRelative(date: Date): string {
  return formatDistanceToNow(date, { addSuffix: true, locale: tr });
}

export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength)}...`;
}

export function getEventStatus(event: Event): EventStatus {
  const now = new Date();
  if (event.status === "cancelled") return "cancelled";
  if (isPast(event.endDate)) return "completed";
  if (isPast(event.startDate) && isFuture(event.endDate)) return "ongoing";
  return "upcoming";
}

export function getDistanceKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export function generateUsername(email: string): string {
  const base = email.split("@")[0].replace(/[^a-zA-Z0-9]/g, "").toLowerCase();
  const suffix = Math.floor(Math.random() * 9999);
  return `${base}${suffix}`;
}

export const POST_CATEGORIES = [
  "Genel",
  "Etkinlik",
  "Yemek",
  "Doğa",
  "Spor",
  "Kültür",
  "İş",
] as const;

export const EVENT_CATEGORIES = [
  "Konser",
  "Spor",
  "Yemek",
  "Doğa Yürüyüşü",
  "Plaj",
  "Kültür",
  "Sosyal",
  "Diğer",
] as const;

export const INTEREST_OPTIONS = [
  "Müzik",
  "Spor",
  "Yemek",
  "Doğa",
  "Sanat",
  "Teknoloji",
  "Seyahat",
  "Fotoğraf",
  "Kitap",
  "Sinema",
  "Yoga",
  "Dalış",
] as const;
