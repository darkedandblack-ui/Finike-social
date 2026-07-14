import Link from "next/link";
import {
  Calendar,
  MessageCircle,
  MapPin,
  Users,
  Sparkles,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/Button";

const features = [
  {
    icon: Calendar,
    title: "Yerel Etkinlikler",
    description: "Finike'deki konserler, spor etkinlikleri ve sosyal buluşmaları keşfedin.",
  },
  {
    icon: MessageCircle,
    title: "Anlık Mesajlaşma",
    description: "Yeni insanlarla tanışın, etkinlik katılımcılarıyla iletişim kurun.",
  },
  {
    icon: MapPin,
    title: "Yakınımdaki",
    description: "Konumunuza göre yakındaki etkinlikleri ve paylaşımları görün.",
  },
  {
    icon: Users,
    title: "Topluluk",
    description: "İlgi alanlarınıza göre insanlarla bağlantı kurun.",
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-orange-950/30">
      <header className="border-b border-[var(--border)] bg-[var(--background)]/50 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500 to-amber-500">
              <span className="text-lg font-bold text-white">F</span>
            </div>
            <span className="text-xl font-bold text-[var(--foreground)]">
              Finike<span className="text-orange-500">Social</span>
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login">
              <Button variant="ghost">Giriş Yap</Button>
            </Link>
            <Link href="/register">
              <Button>Kayıt Ol</Button>
            </Link>
          </div>
        </div>
      </header>

      <main>
        <section className="mx-auto max-w-6xl px-4 py-20 text-center lg:py-32">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-orange-500/30 bg-orange-500/10 px-4 py-1.5 text-sm text-orange-500">
            <Sparkles className="h-4 w-4" />
            Finike&apos;nin Sosyal Platformu
          </div>
          <h1 className="mx-auto max-w-4xl text-4xl font-bold leading-tight text-white sm:text-5xl lg:text-6xl">
            Şehrini Keşfet,{" "}
            <span className="gradient-text">İnsanlarla Bağlan</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-[var(--muted)]">
            Etkinlikler oluştur, paylaşımlar yap, yeni arkadaşlar edin.
            Finike&apos;nin dijital buluşma noktası.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link href="/register">
              <Button size="lg" className="gap-2">
                Hemen Başla
                <ArrowRight className="h-5 w-5" />
              </Button>
            </Link>
            <Link href="/login">
              <Button variant="outline" size="lg">
                Giriş Yap
              </Button>
            </Link>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-16">
          <h2 className="mb-12 text-center text-3xl font-bold text-[var(--foreground)]">
            Neler Yapabilirsin?
          </h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <div
                  key={feature.title}
                  className="glass rounded-2xl p-6 transition-all duration-300 hover:bg-white/10"
                >
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500/20 to-amber-500/20">
                    <Icon className="h-6 w-6 text-orange-500" />
                  </div>
                  <h3 className="mb-2 text-lg font-semibold text-[var(--foreground)]">
                    {feature.title}
                  </h3>
                  <p className="text-sm text-[var(--muted)]">{feature.description}</p>
                </div>
              );
            })}
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-16">
          <div className="glass overflow-hidden rounded-3xl p-8 text-center lg:p-16">
            <h2 className="text-3xl font-bold text-[var(--foreground)]">
              Finike Topluluğuna Katıl
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-[var(--muted)]">
              Plaj partilerinden doğa yürüyüşlerine, yerel konserlerden spor
              etkinliklerine — hepsi burada.
            </p>
            <Link href="/register" className="mt-8 inline-block">
              <Button size="lg">Ücretsiz Kayıt Ol</Button>
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t border-[var(--border)] py-8 text-center text-sm text-[var(--muted)]">
        <p>&copy; {new Date().getFullYear()} Finike Social. Tüm hakları saklıdır.</p>
      </footer>
    </div>
  );
}
