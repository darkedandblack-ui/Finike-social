"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  PlusSquare,
  MessageCircle,
  Bell,
  User,
  Calendar,
  MapPin,
  Shield,
  Settings,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Avatar } from "@/components/ui/Avatar";
import { cn } from "@/lib/utils";

const mainLinks = [
  { href: "/feed", label: "Akış", icon: Home },
  { href: "/create", label: "Gönderi Oluştur", icon: PlusSquare },
  { href: "/events", label: "Etkinlikler", icon: Calendar },
  { href: "/messages", label: "Mesajlar", icon: MessageCircle },
  { href: "/notifications", label: "Bildirimler", icon: Bell },
];

const profileLinks = [
  { href: "/profile", label: "Profilim", icon: User },
  { href: "/profile/edit", label: "Profili Düzenle", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const { profile } = useAuth();
  const isAdmin = profile?.role === "admin" || profile?.role === "moderator";

  return (
    <aside className="hidden w-64 shrink-0 lg:block">
      <div className="sticky top-20 space-y-6">
        {profile && (
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl">
            <div className="flex items-center gap-3">
              <Avatar
                src={profile.avatarUrl}
                name={profile.displayName}
                size="lg"
              />
              <div className="min-w-0">
                <p className="truncate font-semibold text-white">
                  {profile.displayName}
                </p>
                <p className="truncate text-sm text-gray-400">
                  @{profile.username}
                </p>
              </div>
            </div>
            {profile.location && (
              <div className="mt-3 flex items-center gap-1 text-sm text-gray-400">
                <MapPin className="h-4 w-4" />
                {profile.location.city}
              </div>
            )}
          </div>
        )}

        <nav className="space-y-1">
          <p className="px-3 text-xs font-semibold uppercase tracking-wider text-gray-500">
            Menü
          </p>
          {mainLinks.map((link) => {
            const Icon = link.icon;
            const isActive = pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-teal-500/20 text-teal-400"
                    : "text-gray-400 hover:bg-white/5 hover:text-white"
                )}
              >
                <Icon className="h-5 w-5" />
                {link.label}
              </Link>
            );
          })}
        </nav>

        <nav className="space-y-1">
          <p className="px-3 text-xs font-semibold uppercase tracking-wider text-gray-500">
            Hesap
          </p>
          {profileLinks.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-teal-500/20 text-teal-400"
                    : "text-gray-400 hover:bg-white/5 hover:text-white"
                )}
              >
                <Icon className="h-5 w-5" />
                {link.label}
              </Link>
            );
          })}
          {isAdmin && (
            <Link
              href="/admin"
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                pathname.startsWith("/admin")
                  ? "bg-amber-500/20 text-amber-400"
                  : "text-gray-400 hover:bg-white/5 hover:text-white"
              )}
            >
              <Shield className="h-5 w-5" />
              Admin Panel
            </Link>
          )}
        </nav>
      </div>
    </aside>
  );
}
