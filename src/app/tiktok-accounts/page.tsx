"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { Icon } from "@/components/Icon";
import { Preferences } from "@/components/Preferences";
import { Toast } from "@/components/Toast";
import { ApiError } from "@/lib/auth";
import type { MessageKey } from "@/lib/i18n/dictionaries";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { listAccounts, startTiktokLink, takeFlash, type TiktokAccount } from "@/lib/tiktok";

const statusLabel: Record<TiktokAccount["status"], MessageKey> = {
  connected: "tt.statusConnected",
  expired: "tt.statusExpired",
  revoked: "tt.statusRevoked",
  error: "tt.statusError",
};

export default function TiktokAccountsPage() {
  const router = useRouter();
  const { t, locale } = useI18n();
  const [accounts, setAccounts] = useState<TiktokAccount[] | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [linking, setLinking] = useState(false);
  const closeToast = useCallback(() => setToast(null), []);

  const fail = useCallback(
    (e: unknown) => {
      if (e instanceof ApiError && e.status === 401) router.replace("/login");
      else setToast(t("tt.genericError"));
    },
    [router, t],
  );

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- flash đọc từ sessionStorage, chỉ có sau khi mount
    setToast(takeFlash());
    listAccounts().then(setAccounts, (e) => {
      setAccounts([]);
      fail(e);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- chỉ tải một lần khi vào trang
  }, []);

  const link = async () => {
    setLinking(true);
    try {
      await startTiktokLink();
    } catch (e) {
      setLinking(false);
      fail(e);
    }
  };

  const fmt = (n: number | null) => (n == null ? "–" : new Intl.NumberFormat(locale, { notation: "compact" }).format(n));

  return (
    <AppShell active="channels">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-[26px] font-bold leading-8 text-ink">{t("tt.title")}</h1>
          <p className="text-sm text-ink-2">{t("tt.subtitle")}</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Preferences />
          <button
            type="button"
            onClick={link}
            disabled={linking}
            className="flex items-center gap-2 rounded-[10px] bg-brand py-2.5 pl-4 pr-[18px] text-sm font-semibold text-on-brand transition-[filter] hover:brightness-95 disabled:opacity-60"
          >
            <Icon name="plus" size={18} />
            {t("tt.add")}
          </button>
        </div>
      </header>

      {accounts === null ? (
        <p className="text-sm text-muted">{t("tt.loading")}</p>
      ) : accounts.length === 0 ? (
        <p className="rounded-2xl border border-line bg-surface p-6 text-sm text-ink-2">{t("tt.empty")}</p>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {accounts.map((a) => {
            const ok = a.status === "connected";
            return (
              <li key={a.id} className="flex flex-col gap-4 rounded-2xl border border-line bg-surface p-5">
                <Link href={`/tiktok-accounts/${a.id}/videos`} className="flex items-center gap-3.5">
                  {a.avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element -- URL ngoài (TikTok CDN), không cấu hình next/image
                    <img src={a.avatarUrl} alt="" referrerPolicy="no-referrer" className="size-12 shrink-0 rounded-full bg-soft object-cover" />
                  ) : (
                    <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-soft text-base font-bold text-brand">
                      {a.displayName.slice(0, 2).toUpperCase()}
                    </div>
                  )}
                  <div className="flex min-w-0 flex-1 flex-col gap-1">
                    <span className="truncate text-[15px] font-semibold text-ink">{a.displayName}</span>
                    <span
                      className={`w-fit rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        ok
                          ? "bg-[color-mix(in_srgb,var(--status-success)_14%,transparent)] text-ok"
                          : "bg-[color-mix(in_srgb,var(--status-warning)_14%,transparent)] text-warn"
                      }`}
                    >
                      {t(statusLabel[a.status])}
                    </span>
                  </div>
                </Link>
                <dl className="grid grid-cols-2 gap-3 text-[13px]">
                  <div>
                    <dt className="text-muted">{t("tt.followers")}</dt>
                    <dd className="font-semibold text-ink">{fmt(a.followerCount)}</dd>
                  </div>
                  <div>
                    <dt className="text-muted">{t("tt.videos")}</dt>
                    <dd className="font-semibold text-ink">{fmt(a.videoCount)}</dd>
                  </div>
                </dl>
                {!ok && (
                  <div className="flex flex-col gap-3 rounded-[10px] bg-[color-mix(in_srgb,var(--status-warning)_12%,transparent)] p-3">
                    <p className="text-xs text-warn">{t("tt.warnNotConnected")}</p>
                    <button
                      type="button"
                      onClick={link}
                      disabled={linking}
                      className="w-fit rounded-[10px] border border-line bg-surface px-3.5 py-2 text-[13px] font-semibold text-ink hover:bg-subtle disabled:opacity-60"
                    >
                      {t("tt.relink")}
                    </button>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
      <Toast message={toast} onClose={closeToast} />
    </AppShell>
  );
}
