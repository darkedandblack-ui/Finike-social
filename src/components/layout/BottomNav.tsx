"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, PlusSquare, MessageCircle, Bell, User } from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  { href: "/feed", icon: Home, label: "Akış" },
  { href: "/create", icon: PlusSquare, label: "Oluştur" },
  { href: "/messages", icon: MessageCircle, label: "Mesajlar" },
  { href: "/notifications", icon: Bell, label: "Bildirimler" },
  { href: "/profile", icon: User, label: "Profil" },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-white/10 bg-gray-950/90 backdrop-blur-xl lg:hidden">
      <div className="flex items-center justify-around px-2 py-2">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center gap-1 rounded-xl px-3 py-2 text-xs transition-colors",
                isActive ? "text-teal-400" : "text-gray-500"
              )}
            >
              <Icon className={cn("h-5 w-5", isActive && "text-teal-400")} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
