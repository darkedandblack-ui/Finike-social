"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

interface AuthGuardProps {
  children: React.ReactNode;
  requireOnboarded?: boolean;
  requireAdmin?: boolean;
}

export function AuthGuard({
  children,
  requireOnboarded = true,
  requireAdmin = false,
}: AuthGuardProps) {
  const { user, profile, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    if (!user) {
      router.replace("/login");
      return;
    }

    if (profile?.isBanned || profile?.isSuspended) {
      router.replace("/login?error=banned");
      return;
    }

    if (requireOnboarded && profile && !profile.isOnboarded) {
      router.replace("/onboarding");
      return;
    }

    if (requireAdmin && profile?.role !== "admin" && profile?.role !== "moderator") {
      router.replace("/feed");
    }
  }, [user, profile, loading, router, requireOnboarded, requireAdmin]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-orange-500 border-t-transparent" />
      </div>
    );
  }

  if (!user) return null;
  if (requireOnboarded && profile && !profile.isOnboarded) return null;
  if (requireAdmin && profile?.role !== "admin" && profile?.role !== "moderator") {
    return null;
  }

  return <>{children}</>;
}
