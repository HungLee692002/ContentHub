"use client";
/* eslint-disable react-hooks/set-state-in-effect -- đọc URL/sessionStorage chỉ làm được sau khi mount */

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Icon } from "@/components/Icon";
import { Preferences } from "@/components/Preferences";
import { ApiError, ensureSession } from "@/lib/auth";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { connectAccount, consumeStoredState, setFlash, startTiktokLink } from "@/lib/tiktok";

type View = { kind: "loading" } | { kind: "cancelled" } | { kind: "error"; message: string; retry: boolean };

export default function TiktokCallbackPage() {
  const router = useRouter();
  const { t } = useI18n();
  const [view, setView] = useState<View>({ kind: "loading" });
  // Chặn effect chạy 2 lần (React StrictMode): code của TikTok chỉ dùng được một lần
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    const q = new URLSearchParams(window.location.search);
    const expected = consumeStoredState();
    // Xóa query khỏi URL để reload không lặp lại code/state
    window.history.replaceState(null, "", window.location.pathname);

    if (q.get("error")) {
      setView({ kind: "cancelled" });
      return;
    }
    const state = q.get("state");
    const code = q.get("code");
    if (!expected || !state || state !== expected || !code) {
      setView({ kind: "error", message: t("tt.stateInvalid"), retry: false });
      return;
    }

    ensureSession()
      .then((ok) => {
        if (!ok) throw new ApiError(401, 0, "Session expired");
        return connectAccount(code);
      })
      .then(
      (acc) => {
        setFlash(`${t("tt.linked")}${acc.displayName}`);
        router.replace("/tiktok-accounts");
      },
      (e) => {
        if (e instanceof ApiError && e.status === 401) router.replace("/login");
        else if (e instanceof ApiError && [400, 403, 404].includes(e.status))
          setView({ kind: "error", message: e.message || t("tt.linkFailed"), retry: true });
        else setView({ kind: "error", message: t("tt.genericError"), retry: true });
      },
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps -- chỉ chạy một lần khi vào trang
  }, []);

  const retry = () => startTiktokLink().catch(() => setView({ kind: "error", message: t("tt.genericError"), retry: true }));
  const back = () => router.replace("/tiktok-accounts");

  return (
    <div className="flex min-h-screen flex-1 flex-col items-center justify-center gap-6 bg-page px-4">
      <Preferences />
      <div className="flex w-full max-w-[420px] flex-col items-center gap-5 rounded-2xl border border-line bg-surface p-8 text-center shadow-card">
        {view.kind === "loading" ? (
          <p className="text-sm text-ink-2">{t("tt.linking")}</p>
        ) : (
          <>
            <Icon name="info" size={28} className={view.kind === "cancelled" ? "text-muted" : "text-bad"} />
            <p className="text-sm text-ink">{view.kind === "cancelled" ? t("tt.cancelled") : view.message}</p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={back}
                className="flex items-center gap-2 rounded-[10px] border border-line bg-surface px-4 py-2.5 text-sm font-semibold text-ink hover:bg-subtle"
              >
                <Icon name="arrow-left" size={16} />
                {t("tt.back")}
              </button>
              {view.kind === "error" && view.retry && (
                <button
                  type="button"
                  onClick={retry}
                  className="rounded-[10px] bg-brand px-4 py-2.5 text-sm font-semibold text-on-brand hover:brightness-95"
                >
                  {t("tt.retry")}
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
