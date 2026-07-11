"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import {
  Home,
  PlusSquare,
  MessageCircle,
  Bell,
  User,
  Sun,
  Moon,
  LogOut,
  Shield,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";
import { subscribeToNotifications } from "@/lib/firebase/firestore";

const navItems = [
  { href: "/feed", label: "Akış", icon: Home },
  { href: "/create", label: "Oluştur", icon: PlusSquare },
  { href: "/messages", label: "Mesajlar", icon: MessageCircle },
  { href: "/notifications", label: "Bildirimler", icon: Bell },
  { href: "/profile", label: "Profil", icon: User },
];

export function Navbar() {
  const pathname = usePathname();
  const { profile, signOut } = useAuth();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!profile?.id) return;
    const unsub = subscribeToNotifications(profile.id, (notifications) => {
      setUnreadCount(notifications.filter((n) => !n.isRead).length);
    });
    return unsub;
  }, [profile?.id]);

  const isAdmin = profile?.role === "admin" || profile?.role === "moderator";

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-gray-950/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 lg:px-6">
        <Link href="/feed" className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-teal-500 to-cyan-500">
            <span className="text-lg font-bold text-white">F</span>
          </div>
          <span className="hidden text-xl font-bold text-white sm:block">
            Finike<span className="text-teal-400">Social</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname.startsWith(item.href);
            const showBadge = item.href === "/notifications" && unreadCount > 0;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "relative flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-teal-500/20 text-teal-400"
                    : "text-gray-400 hover:bg-white/5 hover:text-white"
                )}
              >
                <Icon className="h-5 w-5" />
                {item.label}
                {showBadge && (
                  <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs text-white">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </Link>
            );
          })}
          {isAdmin && (
            <Link
              href="/admin"
              className={cn(
                "flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-colors",
                pathname.startsWith("/admin")
                  ? "bg-amber-500/20 text-amber-400"
                  : "text-gray-400 hover:bg-white/5 hover:text-white"
              )}
            >
              <Shield className="h-5 w-5" />
              Admin
            </Link>
          )}
        </nav>

        <div className="flex items-center gap-2">
          {mounted && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            >
              {theme === "dark" ? (
                <Sun className="h-5 w-5" />
              ) : (
                <Moon className="h-5 w-5" />
              )}
            </Button>
          )}
          {profile && (
            <>
              <Link href="/profile" className="hidden sm:block">
                <Avatar
                  src={profile.avatarUrl}
                  name={profile.displayName}
                  size="sm"
                />
              </Link>
              <Button variant="ghost" size="icon" onClick={signOut}>
                <LogOut className="h-5 w-5" />
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
