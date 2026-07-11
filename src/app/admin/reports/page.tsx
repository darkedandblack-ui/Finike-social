"use client";

import { useState, useEffect } from "react";
import { Check, X } from "lucide-react";
import { getReports, resolveReport } from "@/lib/firebase/firestore";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Spinner } from "@/components/ui/Spinner";
import { formatRelative } from "@/lib/utils";
import type { Report } from "@/types";

export default function AdminReportsPage() {
  const { user } = useAuth();
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"pending" | "all">("pending");

  const loadReports = async () => {
    setLoading(true);
    const data = await getReports(filter === "pending" ? "pending" : undefined);
    setReports(data);
    setLoading(false);
  };

  useEffect(() => {
    loadReports();
  }, [filter]);

  const handleResolve = async (reportId: string, status: "resolved" | "dismissed") => {
    if (!user) return;
    await resolveReport(reportId, status, user.uid);
    await loadReports();
  };

  const statusVariant = {
    pending: "warning" as const,
    resolved: "success" as const,
    dismissed: "default" as const,
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Şikayet Kuyruğu</h1>
          <p className="text-gray-400">Kullanıcı şikayetlerini incele</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant={filter === "pending" ? "primary" : "secondary"}
            size="sm"
            onClick={() => setFilter("pending")}
          >
            Bekleyen
          </Button>
          <Button
            variant={filter === "all" ? "primary" : "secondary"}
            size="sm"
            onClick={() => setFilter("all")}
          >
            Tümü
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Spinner size="lg" />
        </div>
      ) : reports.length === 0 ? (
        <Card className="p-8 text-center text-gray-400">
          Şikayet bulunamadı.
        </Card>
      ) : (
        <div className="space-y-3">
          {reports.map((report) => (
            <Card key={report.id} className="space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <Badge variant="info">{report.type}</Badge>
                    <Badge variant={statusVariant[report.status]}>
                      {report.status}
                    </Badge>
                  </div>
                  <p className="mt-2 text-white">
                    <span className="text-gray-400">Şikayet eden:</span>{" "}
                    {report.reporterName}
                  </p>
                  <p className="text-sm text-gray-400">
                    Sebep: {report.reason}
                  </p>
                  {report.description && (
                    <p className="mt-1 text-sm text-gray-300">{report.description}</p>
                  )}
                  <p className="mt-1 text-xs text-gray-500">
                    {formatRelative(report.createdAt)}
                  </p>
                </div>
                {report.status === "pending" && (
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => handleResolve(report.id, "resolved")}
                    >
                      <Check className="h-4 w-4" />
                      Çöz
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleResolve(report.id, "dismissed")}
                    >
                      <X className="h-4 w-4" />
                      Reddet
                    </Button>
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
