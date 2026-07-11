"use client";

import { useState, useEffect } from "react";
import { Search, Ban, Pause, Trash2 } from "lucide-react";
import { getAllUsers, banUser, suspendUser, deleteUserCascade } from "@/lib/firebase/firestore";
import { useAuth } from "@/contexts/AuthContext";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import { Spinner } from "@/components/ui/Spinner";
import { Modal } from "@/components/ui/Modal";
import type { UserProfile } from "@/types";

export default function AdminUsersPage() {
  const { user, profile } = useAuth();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<UserProfile | null>(null);

  const loadUsers = async () => {
    const data = await getAllUsers();
    setUsers(data);
    setLoading(false);
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const filtered = users.filter(
    (u) =>
      u.displayName.toLowerCase().includes(search.toLowerCase()) ||
      u.username.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase())
  );

  const handleBan = async (userId: string) => {
    if (!user || !profile) return;
    setActionLoading(userId);
    await banUser(userId, user.uid, profile.displayName);
    await loadUsers();
    setActionLoading(null);
  };

  const handleSuspend = async (userId: string) => {
    if (!user || !profile) return;
    setActionLoading(userId);
    await suspendUser(userId, user.uid, profile.displayName);
    await loadUsers();
    setActionLoading(null);
  };

  const handleDelete = async () => {
    if (!user || !profile || !deleteTarget) return;
    setActionLoading(deleteTarget.id);
    try {
      await deleteUserCascade(deleteTarget.id, user.uid, profile.displayName);
      setDeleteTarget(null);
      await loadUsers();
    } catch (err) {
      console.error("Delete user error:", err);
      alert("Kullanıcı silinirken bir hata oluştu.");
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Kullanıcı Yönetimi</h1>
        <p className="text-gray-400">Kullanıcıları listele, ara ve yönet</p>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
        <Input
          placeholder="Kullanıcı ara..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Spinner size="lg" />
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((u) => (
            <Card key={u.id} className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <Avatar src={u.avatarUrl} name={u.displayName} size="md" />
                <div>
                  <p className="font-medium text-white">{u.displayName}</p>
                  <p className="text-sm text-gray-400">@{u.username} · {u.email}</p>
                  <div className="mt-1 flex gap-2">
                    <Badge variant={u.role === "admin" ? "warning" : "default"}>
                      {u.role}
                    </Badge>
                    {u.isBanned && <Badge variant="danger">Yasaklı</Badge>}
                    {u.isSuspended && <Badge variant="warning">Askıda</Badge>}
                  </div>
                </div>
              </div>
              {u.id !== user?.uid && u.role !== "admin" && (
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleSuspend(u.id)}
                    loading={actionLoading === u.id}
                  >
                    <Pause className="h-4 w-4" />
                    Askıya Al
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => handleBan(u.id)}
                    loading={actionLoading === u.id}
                  >
                    <Ban className="h-4 w-4" />
                    Yasakla
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => setDeleteTarget(u)}
                    loading={actionLoading === u.id}
                  >
                    <Trash2 className="h-4 w-4" />
                    Sil
                  </Button>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}

      <Modal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Kullanıcıyı Kalıcı Olarak Sil"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-300">
            <span className="font-semibold text-white">{deleteTarget?.displayName}</span>{" "}
            ({deleteTarget?.email}) ve bu kullanıcıya ait tüm gönderiler, yorumlar,
            beğeniler, etkinlikler, katılımlar, takip ilişkileri ve bildirimler
            kalıcı olarak silinecek. Bu işlem geri alınamaz.
          </p>
          <p className="text-xs text-amber-400">
            Not: Bu işlem yalnızca veritabanı kaydını siler. Kullanıcının
            e-posta/şifre ile giriş yapabildiği Authentication hesabını ayrıca
            Firebase Console&apos;dan silmeniz gerekir.
          </p>
          <div className="flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => setDeleteTarget(null)}>
              Vazgeç
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={handleDelete}
              loading={!!deleteTarget && actionLoading === deleteTarget.id}
            >
              Kalıcı Olarak Sil
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
