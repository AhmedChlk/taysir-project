"use client";

import Image from "next/image";
import { signIn } from "next-auth/react";
import { useState } from "react";
import { useRouter } from "@/i18n/routing";
import { Loader2, Quote } from "lucide-react";
import { clsx } from "clsx";
import { useTranslations, useLocale } from 'next-intl';
import { Input } from "@/components/ui/FormInput";
import LanguageSwitcher from "@/components/navigation/LanguageSwitcher";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const t = useTranslations();
  const locale = useLocale();
  const isRtl = locale === 'ar';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError(t("error_invalid_credentials"));
      } else {
        // Le router de next-intl gère automatiquement la locale.
        // Si on est sur /fr/login, router.push("/dashboard") devrait mener à /fr/dashboard.
        router.push("/dashboard");
      }
    } catch {
      setError(t("error_generic"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen w-full bg-white overflow-hidden" dir={isRtl ? "rtl" : "ltr"}>
      {/* Language Switcher */}
      <div className="absolute top-6 z-50 flex gap-2 end-6">
        <LanguageSwitcher />
      </div>

      {/* Left side: Branding Panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-primary-teal relative items-center justify-center p-12 overflow-hidden">
        {/* Subtle CSS patterns/gradients */}
        <div className="absolute top-0 start-0 w-full h-full opacity-20 pointer-events-none">
          <div className="absolute -top-24 -start-24 w-96 h-96 bg-white rounded-full blur-3xl opacity-10" />
          <div className="absolute top-1/2 start-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] border border-white/5 rounded-full" />
          <div className="absolute top-1/2 start-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] border border-white/10 rounded-full" />
          <div className="absolute bottom-0 end-0 w-64 h-64 bg-accent-teal rounded-full blur-3xl opacity-20" />
        </div>

        <div className="relative z-10 max-w-lg text-center lg:text-start space-y-8">
          <div className="flex items-center gap-4 mb-12">
            <div className="relative w-12 h-12">
               <Image
                src="/logo.png"
                alt={t("brand_name")}
                fill
                className="object-contain invert brightness-0"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              />
            </div>

            <span className="text-2xl font-bold text-white tracking-wider">{t("brand_name")}</span>
          </div>

          <div className="space-y-6">
            <Quote className="text-accent-teal opacity-50 w-12 h-12 flip-rtl" />
            <h1 className="text-4xl xl:text-5xl font-bold text-white leading-tight">
              {t("login_welcome_desc")}
            </h1>
            <p className="text-white/70 text-lg max-w-md">
              {t("login_welcome_long_desc")}
            </p>
          </div>

          <div className="pt-12 grid grid-cols-2 gap-8 border-t border-white/10">
            <div>
              <div className="text-2xl font-bold text-white">100%</div>
              <div className="text-sm text-white/50 capitalize">{t("stat_algerian")}</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-white">24/7</div>
              <div className="text-sm text-white/50 capitalize">{t("stat_support")}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Right side: Login form */}
      <div className="flex flex-1 items-center justify-center p-8 lg:p-24 bg-white">
        <div className="w-full max-w-md space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div className="space-y-2">
            <h2 className="text-3xl font-bold text-gray-900 tracking-tight">
              {t("login_welcome_back")}
            </h2>
            <p className="text-gray-500">
              {t("login_subtitle")}
            </p>
          </div>

          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="rounded-lg bg-red-50 p-4 text-sm text-red-600 border border-red-100 flex items-center gap-3">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                {error}
              </div>
            )}
            
            <div className="space-y-4">
              <Input
                label={t("email")}
                type="email"
                id="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t("placeholder_email")}
                className="h-12"
              />

              <div className="space-y-1">
                <Input
                  label={t("password")}
                  type="password"
                  id="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="h-12"
                />
                <div className="flex justify-end">
                  <button type="button" className="text-sm text-accent-teal hover:underline font-medium">
                    {t("forgot_password")}
                  </button>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className={clsx(
                "group relative flex w-full justify-center rounded-lg bg-primary-teal py-3.5 text-sm font-bold text-white shadow-lg shadow-primary-teal/20 transition-all hover:bg-accent-teal hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] disabled:opacity-70 disabled:pointer-events-none",
                loading && "cursor-not-allowed"
              )}
            >
              {loading ? (
                <Loader2 className="animate-spin" size={20} />
              ) : (
                <span className="flex items-center gap-2">
                  {t("login_button")}
                </span>
              )}
            </button>
          </form>

          <div className="pt-8 text-center border-t border-gray-100">
            <p className="text-sm text-gray-500">
              {t("footer_copyright")}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
