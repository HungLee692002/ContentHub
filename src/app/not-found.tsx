"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Preferences } from "@/components/Preferences";
import { ensureSession } from "@/lib/auth";
import { useI18n } from "@/lib/i18n/I18nProvider";

export default function NotFound() {
  const router = useRouter();
  const { t } = useI18n();
  const [busy, setBusy] = useState(false);

  // Có phiên hợp lệ (kể cả refresh được) thì về dashboard, không thì về đăng nhập
  const goHome = async () => {
    setBusy(true);
    router.replace((await ensureSession()) ? "/dashboard" : "/login");
  };

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-6 bg-page px-4 py-16 text-center">
      <Preferences />
      <p className="text-6xl font-bold text-brand">404</p>
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold text-ink">{t("nf.title")}</h1>
        <p className="text-sm text-ink-2">{t("nf.desc")}</p>
      </div>
      <button
        type="button"
        onClick={goHome}
        disabled={busy}
        className="rounded-[10px] bg-brand px-5 py-2.5 text-sm font-semibold text-on-brand transition-[filter] hover:brightness-95 disabled:opacity-60"
      >
        {t("nf.back")}
      </button>
    </main>
  );
}
