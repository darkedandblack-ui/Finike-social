import { AuthGuard } from "@/components/auth/AuthGuard";
import Link from "next/link";
import { Users, FileText, Flag, BarChart3 } from "lucide-react";

const adminLinks = [
  { href: "/admin", label: "Dashboard", icon: BarChart3 },
  { href: "/admin/users", label: "Kullanıcılar", icon: Users },
  { href: "/admin/content", label: "İçerik", icon: FileText },
  { href: "/admin/reports", label: "Şikayetler", icon: Flag },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard requireAdmin>
      <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-amber-950/10">
        <header className="border-b border-white/10 bg-gray-950/80 backdrop-blur-xl">
          <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
            <Link href="/admin" className="text-xl font-bold text-white">
              Admin<span className="text-amber-400">Panel</span>
            </Link>
            <Link href="/feed" className="text-sm text-gray-400 hover:text-white">
              Uygulamaya Dön
            </Link>
          </div>
        </header>
        <div className="mx-auto flex max-w-7xl gap-6 px-4 py-6">
          <aside className="hidden w-56 shrink-0 md:block">
            <nav className="space-y-1">
              {adminLinks.map((link) => {
                const Icon = link.icon;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-gray-400 transition-colors hover:bg-white/5 hover:text-white"
                  >
                    <Icon className="h-5 w-5" />
                    {link.label}
                  </Link>
                );
              })}
            </nav>
          </aside>
          <main className="min-w-0 flex-1">{children}</main>
        </div>
      </div>
    </AuthGuard>
  );
}
