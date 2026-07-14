"use client";

import Link from "next/link";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
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
  Search,
  X,
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
  const router = useRouter();
  const searchParams = useSearchParams();
  const { profile, signOut } = useAuth();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showSearch, setShowSearch] = useState(false);
  const [searchValue, setSearchValue] = useState("");

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    setSearchValue(searchParams.get("q") ?? "");
  }, [searchParams]);

  useEffect(() => {
    if (!profile?.id) return;
    const unsub = subscribeToNotifications(profile.id, (notifications) => {
      setUnreadCount(notifications.filter((n) => !n.isRead).length);
    });
    return unsub;
  }, [profile?.id]);

  const isAdmin = profile?.role === "admin" || profile?.role === "moderator";

  const submitSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = searchValue.trim();
    router.push(q ? `/feed?q=${encodeURIComponent(q)}` : "/feed");
    setShowSearch(false);
  };

  return (
    <header className="sticky top-0 z-40 border-b border-[var(--border)] bg-[var(--card-solid)]/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 lg:px-6">
        <Link href="/feed" className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500 to-amber-500">
            <span className="text-lg font-bold text-white">F</span>
          </div>
          <span className="hidden text-xl font-bold text-[var(--foreground)] sm:block">
            Finike<span className="text-orange-500">Social</span>
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
                    ? "bg-orange-500/15 text-orange-600"
                    : "text-[var(--muted)] hover:bg-orange-500/10 hover:text-[var(--foreground)]"
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
                  ? "bg-amber-500/20 text-amber-600"
                  : "text-[var(--muted)] hover:bg-orange-500/10 hover:text-[var(--foreground)]"
              )}
            >
              <Shield className="h-5 w-5" />
              Admin
            </Link>
          )}
        </nav>

        <div className="flex items-center gap-2">
          {showSearch ? (
            <form onSubmit={submitSearch} className="flex items-center">
              <input
                autoFocus
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                onBlur={() => !searchValue && setShowSearch(false)}
                placeholder="Ara..."
                className="h-9 w-40 rounded-lg border border-[var(--border)] bg-[var(--card)] px-3 text-sm text-[var(--foreground)] placeholder:text-[var(--muted)] focus:border-orange-500/50 focus:outline-none sm:w-56"
              />
              <Button type="button" variant="ghost" size="icon" onClick={() => setShowSearch(false)}>
                <X className="h-4 w-4" />
              </Button>
            </form>
          ) : (
            <Button variant="ghost" size="icon" onClick={() => setShowSearch(true)}>
              <Search className="h-5 w-5" />
            </Button>
          )}
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
