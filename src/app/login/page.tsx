"use client";

import { GoogleOAuthProvider, useGoogleLogin } from "@react-oauth/google";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Icon } from "@/components/Icon";
import { Preferences } from "@/components/Preferences";
import { ApiError, ensureSession, loginWithGoogle } from "@/lib/auth";
import type { MessageKey } from "@/lib/i18n/dictionaries";
import { useI18n } from "@/lib/i18n/I18nProvider";

const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? "";

// Logo "G" theo brand guideline của Google
function GoogleLogo() {
  return (
    <svg width="20" height="20" viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
    </svg>
  );
}

function GoogleButton() {
  const router = useRouter();
  const { t } = useI18n();
  // Lưu key thay vì chuỗi để lỗi đổi ngôn ngữ theo người dùng
  const [error, setError] = useState<MessageKey | "">("");
  const [loading, setLoading] = useState(false);

  const login = useGoogleLogin({
    onSuccess: async (res) => {
      try {
        await loginWithGoogle(res.access_token);
        router.replace("/dashboard");
      } catch (e) {
        setError(e instanceof ApiError && e.status === 403 ? "login.errorForbidden" : "login.errorGeneric");
        setLoading(false);
      }
    },
    onError: () => {
      setError("login.errorCancelled");
      setLoading(false);
    },
    onNonOAuthError: () => setLoading(false), // đóng popup
  });

  return (
    <>
      <button
        type="button"
        disabled={loading}
        onClick={() => {
          setError("");
          setLoading(true);
          login();
        }}
        className="flex h-[52px] w-full items-center justify-center gap-3 rounded-xl border border-[#747775] bg-white text-base font-medium text-[#1f1f1f] shadow-[0px_6px_16px_-4px_rgba(0,0,0,0.12)] transition-colors hover:bg-[#f0f0f0] disabled:cursor-not-allowed disabled:opacity-60"
      >
        <GoogleLogo />
        <span>{loading ? t("login.signingIn") : t("login.google")}</span>
      </button>
      {error && (
        <p role="alert" className="-mt-2 text-center text-[13px] text-bad">
          {t(error)}
        </p>
      )}
    </>
  );
}

export default function LoginPage() {
  const { t } = useI18n();
  const router = useRouter();
  // Đã có phiên hợp lệ (hoặc refresh được) thì vào thẳng dashboard, không hiện form đăng nhập
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let cancelled = false;
    ensureSession().then((ok) => {
      if (cancelled) return;
      if (ok) router.replace("/dashboard");
      else setChecking(false);
    });
    return () => {
      cancelled = true;
    };
  }, [router]);

  if (checking) return null;

  return (
    <main className="relative flex flex-1 flex-col items-center justify-center gap-7 overflow-hidden bg-page px-4 py-16">
      {/* Glow nền (asset Figma, có bản light/dark nhờ file riêng theo theme) */}
      <GlowImages />

      <div className="absolute right-4 top-4 z-10">
        <Preferences />
      </div>

      <div className="relative flex w-full max-w-[440px] flex-col items-center gap-7 rounded-[20px] border border-line bg-surface px-10 pb-9 pt-11 shadow-card">
        <div className="flex size-14 items-center justify-center rounded-2xl bg-brand text-white">
          <Icon name="analytics" size={28} />
        </div>

        <div className="flex w-full flex-col items-center gap-2.5 text-center">
          <h1 className="text-[28px] font-bold leading-9 text-ink">{t("app.name")}</h1>
          <p className="text-[15px] leading-[22px] text-ink-2">{t("login.subtitle")}</p>
        </div>

        {clientId ? (
          <GoogleOAuthProvider clientId={clientId}>
            <GoogleButton />
          </GoogleOAuthProvider>
        ) : (
          <p className="text-sm text-bad">{t("login.missingClientId")}</p>
        )}

        <p className="text-center text-[13px] leading-[19px] text-muted">{t("login.accessNote")}</p>

        <div className="h-px w-full bg-line" />

        <details className="group w-full text-center">
          <summary className="inline-flex cursor-pointer list-none items-center gap-1 text-[13px] font-semibold text-brand [&::-webkit-details-marker]:hidden">
            {t("login.aboutTitle")}
            <span aria-hidden="true" className="transition-transform group-open:rotate-180">
              ▾
            </span>
          </summary>
          <p className="mt-2 text-[13px] leading-[19px] text-ink-2">{t("login.about")}</p>
        </details>

        <p className="text-center text-[13px] leading-5 text-ink-2">
          {t("login.agree")}
          <Link href="/terms" className="font-semibold text-brand underline">
            {t("login.terms")}
          </Link>
          {t("login.and")}
          <Link href="/privacy" className="font-semibold text-brand underline">
            {t("login.privacy")}
          </Link>
          {t("login.ofSystem")}
        </p>
      </div>

      <p className="relative text-center text-xs text-muted">{t("app.footer")}</p>
    </main>
  );
}

function GlowImages() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
      {/* eslint-disable @next/next/no-img-element -- SVG tĩnh từ Figma, không cần tối ưu ảnh */}
      <div className="absolute -left-40 -top-[200px] size-[560px]">
        <img alt="" src="/figma/light/glow-primary.svg" className="asset-light absolute -inset-[25%] max-w-none size-[150%]" />
        <img alt="" src="/figma/dark/glow-primary.svg" className="asset-dark absolute -inset-[25%] max-w-none size-[150%]" />
      </div>
      <div className="absolute -bottom-[140px] -right-[180px] size-[520px]">
        <img alt="" src="/figma/light/glow-accent.svg" className="asset-light absolute -inset-[26.92%] max-w-none size-[153.84%]" />
        <img alt="" src="/figma/dark/glow-accent.svg" className="asset-dark absolute -inset-[26.92%] max-w-none size-[153.84%]" />
      </div>
      {/* eslint-enable @next/next/no-img-element */}
    </div>
  );
}
