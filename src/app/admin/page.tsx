"use client";

import { useState, useEffect } from "react";
import { Users, FileText, Calendar, Flag, AlertTriangle } from "lucide-react";
import { getAdminStats, wipeAllData } from "@/lib/firebase/firestore";
import { useAuth } from "@/contexts/AuthContext";
import { Card } from "@/components/ui/Card";
import { Spinner } from "@/components/ui/Spinner";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

const CONFIRM_WORD = "TEMİZLE";

export default function AdminDashboardPage() {
  const { user, profile } = useAuth();
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalPosts: 0,
    totalEvents: 0,
    pendingReports: 0,
  });
  const [loading, setLoading] = useState(true);
  const [wipeModalOpen, setWipeModalOpen] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [wiping, setWiping] = useState(false);
  const [wipeResult, setWipeResult] = useState<Record<string, number> | null>(null);

  const loadStats = () => {
    getAdminStats().then((data) => {
      setStats(data);
      setLoading(false);
    });
  };

  useEffect(() => {
    loadStats();
  }, []);

  const handleWipe = async () => {
    if (!user || !profile || confirmText !== CONFIRM_WORD) return;
    setWiping(true);
    try {
      const { deletedCounts } = await wipeAllData(user.uid, profile.displayName);
      setWipeResult(deletedCounts);
      setConfirmText("");
      loadStats();
    } catch (err) {
      console.error("Wipe all data error:", err);
      alert("Veriler silinirken bir hata oluştu.");
    } finally {
      setWiping(false);
    }
  };

  const cards = [
    { label: "Toplam Kullanıcı", value: stats.totalUsers, icon: Users, color: "text-teal-400" },
    { label: "Toplam Gönderi", value: stats.totalPosts, icon: FileText, color: "text-cyan-400" },
    { label: "Toplam Etkinlik", value: stats.totalEvents, icon: Calendar, color: "text-amber-400" },
    { label: "Bekleyen Şikayet", value: stats.pendingReports, icon: Flag, color: "text-red-400" },
  ];

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Admin Dashboard</h1>
        <p className="text-gray-400">Platform istatistikleri</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <Card key={card.label} className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-400">{card.label}</span>
                <Icon className={`h-5 w-5 ${card.color}`} />
              </div>
              <p className="text-3xl font-bold text-white">{card.value}</p>
            </Card>
          );
        })}
      </div>

      <Card className="space-y-3 border-red-500/30 bg-red-950/10">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-red-400" />
          <h2 className="text-lg font-semibold text-white">Tehlikeli Bölge</h2>
        </div>
        <p className="text-sm text-gray-400">
          Tüm test verilerini (kullanıcılar, gönderiler, etkinlikler, mesajlar,
          bildirimler, yorumlar, beğeniler, takip ilişkileri, şikayetler) kalıcı
          olarak siler. Sadece admin/moderatör hesapları korunur. Bu işlem geri
          alınamaz.
        </p>
        <Button variant="danger" size="sm" onClick={() => setWipeModalOpen(true)}>
          Tüm Verileri Temizle
        </Button>
      </Card>

      <Modal
        isOpen={wipeModalOpen}
        onClose={() => {
          setWipeModalOpen(false);
          setWipeResult(null);
          setConfirmText("");
        }}
        title="Tüm Verileri Temizle"
        size="sm"
      >
        {wipeResult ? (
          <div className="space-y-4">
            <p className="text-sm text-green-400">
              Temizlik tamamlandı. Silinen belge sayıları:
            </p>
            <ul className="space-y-1 text-sm text-gray-300">
              {Object.entries(wipeResult).map(([key, value]) => (
                <li key={key} className="flex justify-between">
                  <span>{key}</span>
                  <span className="font-medium text-white">{value}</span>
                </li>
              ))}
            </ul>
            <p className="text-xs text-amber-400">
              Not: Firebase Authentication hesapları (e-posta listesi) ayrıca
              silinmedi. Bunun için Firebase Console &gt; Authentication
              sekmesini kullanın veya proje köküne eklenen{" "}
              <code className="rounded bg-white/10 px-1">
                scripts/wipe-auth-users.mjs
              </code>{" "}
              betiğini çalıştırın.
            </p>
            <div className="flex justify-end">
              <Button
                size="sm"
                onClick={() => {
                  setWipeModalOpen(false);
                  setWipeResult(null);
                }}
              >
                Kapat
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-gray-300">
              Bu işlem geri alınamaz. Devam etmek için aşağıya{" "}
              <span className="font-semibold text-white">{CONFIRM_WORD}</span>{" "}
              yazın.
            </p>
            <Input
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder={CONFIRM_WORD}
            />
            <div className="flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => setWipeModalOpen(false)}>
                Vazgeç
              </Button>
              <Button
                variant="danger"
                size="sm"
                disabled={confirmText !== CONFIRM_WORD}
                loading={wiping}
                onClick={handleWipe}
              >
                Kalıcı Olarak Sil
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
