"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { signUpWithEmail, signInWithGoogle, getAuthErrorMessage } from "@/lib/firebase/auth";
import { registerSchema, type RegisterFormData } from "@/lib/validations";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";

export default function RegisterPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterFormData) => {
    setLoading(true);
    setError("");
    try {
      await signUpWithEmail(data.email, data.password, data.displayName);
      router.push("/onboarding");
    } catch (err) {
      setError("Kayıt başarısız. Bu e-posta zaten kullanılıyor olabilir.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignup = async () => {
    setLoading(true);
    setError("");
    try {
      const user = await signInWithGoogle();
      if (user) {
        router.push("/onboarding");
      }
    } catch (err) {
      const errorCode = (err as { code?: string })?.code;
      const errorMessage = (err as { message?: string })?.message;
      console.error("=== REGISTER PAGE GOOGLE ERROR ===");
      console.error("Error Code:", errorCode);
      console.error("Error Message:", errorMessage);
      console.error("Full Error:", err);
      console.error("==================================");
      setError(getAuthErrorMessage(err));
    } finally {
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
          <h1 className="mt-4 text-2xl font-bold text-[var(--foreground)]">Kayıt Ol</h1>
          <p className="mt-1 text-sm text-[var(--muted)]">
            Finike Social topluluğuna katıl
          </p>
        </div>

        {error && (
          <div className="rounded-xl bg-red-500/10 px-4 py-3 text-sm text-red-400">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input
            label="Ad Soyad"
            placeholder="Adınız Soyadınız"
            error={errors.displayName?.message}
            {...register("displayName")}
          />
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
          <Input
            label="Şifre Tekrar"
            type="password"
            placeholder="••••••••"
            error={errors.confirmPassword?.message}
            {...register("confirmPassword")}
          />
          <Button type="submit" className="w-full" loading={loading}>
            Kayıt Ol
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
          onClick={handleGoogleSignup}
          loading={loading}
        >
          Google ile Kayıt Ol
        </Button>

        <p className="text-center text-sm text-[var(--muted)]">
          Zaten hesabınız var mı?{" "}
          <Link href="/login" className="text-orange-500 hover:underline">
            Giriş Yap
          </Link>
        </p>
      </Card>
    </div>
  );
}
