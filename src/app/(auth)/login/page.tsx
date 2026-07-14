"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { signInWithEmail, signInWithGoogle, getAuthErrorMessage } from "@/lib/firebase/auth";
import { loginSchema, type LoginFormData } from "@/lib/validations";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    setLoading(true);
    setError("");
    try {
      await signInWithEmail(data.email, data.password);
      router.push("/feed");
    } catch (err) {
      setError("Giriş başarısız. E-posta veya şifrenizi kontrol edin.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError("");
    console.log("=== LOGIN PAGE: GOOGLE LOGIN CLICKED ===");
    try {
      const user = await signInWithGoogle();
      console.log("=== LOGIN PAGE: SIGN-IN WITH GOOGLE RETURNED ===");
      console.log("Returned user:", user?.uid ?? "null");
      if (user) {
        console.log("User exists, redirecting to /feed");
        router.push("/feed");
      } else {
        console.log("User is null - redirect was used or no user returned");
      }
    } catch (err) {
      const errorCode = (err as { code?: string })?.code;
      const errorMessage = (err as { message?: string })?.message;
      console.error("=== LOGIN PAGE GOOGLE ERROR ===");
      console.error("Error Code:", errorCode);
      console.error("Error Message:", errorMessage);
      console.error("Full Error:", err);
      console.error("================================");
      setError(getAuthErrorMessage(err));
    } finally {
      console.log("=== LOGIN PAGE: LOADING SET TO FALSE ===");
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-gray-950 via-gray-900 to-orange-950/30 p-4">
      <Card className="w-full max-w-md space-y-6">
        <div className="text-center">
          <Link href="/" className="inline-flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500 to-amber-500">
              <span className="text-xl font-bold text-white">F</span>
            </div>
          </Link>
          <h1 className="mt-4 text-2xl font-bold text-[var(--foreground)]">Giriş Yap</h1>
          <p className="mt-1 text-sm text-[var(--muted)]">
            Finike Social hesabınıza giriş yapın
          </p>
        </div>

        {error && (
          <div className="rounded-xl bg-red-500/10 px-4 py-3 text-sm text-red-400">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input
            label="E-posta"
            type="email"
            placeholder="ornek@email.com"
            error={errors.email?.message}
            {...register("email")}
          />
          <Input
            label="Şifre"
            type="password"
            placeholder="••••••••"
            error={errors.password?.message}
            {...register("password")}
          />
          <Button type="submit" className="w-full" loading={loading}>
            Giriş Yap
          </Button>
        </form>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-[var(--border)]" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="bg-transparent px-2 text-[var(--muted)]">veya</span>
          </div>
        </div>

        <Button
          variant="secondary"
          className="w-full"
          onClick={handleGoogleLogin}
          loading={loading}
        >
          <svg className="h-5 w-5" viewBox="0 0 24 24">
            <path
              fill="currentColor"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="currentColor"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="currentColor"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="currentColor"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          Google ile Giriş Yap
        </Button>

        <p className="text-center text-sm text-[var(--muted)]">
          Hesabınız yok mu?{" "}
          <Link href="/register" className="text-orange-500 hover:underline">
            Kayıt Ol
          </Link>
        </p>
      </Card>
    </div>
  );
}
