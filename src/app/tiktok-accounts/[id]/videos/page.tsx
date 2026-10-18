"use client";
/* eslint-disable react-hooks/set-state-in-effect -- đọc URL/sessionStorage chỉ làm được sau khi mount */

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { Icon } from "@/components/Icon";
import { Preferences } from "@/components/Preferences";
import { Toast } from "@/components/Toast";
import { ApiError } from "@/lib/auth";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { listVideos, type TiktokVideo } from "@/lib/tiktok";

function Cover({ video, version }: { video: TiktokVideo; version: number }) {
  const { t } = useI18n();
  // Ảnh bìa TikTok hết hạn sau vài giờ: lỗi thì hiện placeholder, "Tải lại" sẽ gọi lại API
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    setFailed(false);
  }, [video.coverImageUrl, version]);

  if (!video.coverImageUrl || failed) {
    return (
      <div className="flex aspect-[9/12] w-full flex-col items-center justify-center gap-1 bg-soft text-brand">
        <Icon name="play" size={24} />
        {failed && <span className="text-xs text-muted">{t("tt.coverFailed")}</span>}
      </div>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element -- URL ngoài (TikTok CDN), không cấu hình next/image
    <img
      src={video.coverImageUrl}
      alt=""
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
      className="aspect-[9/12] w-full bg-soft object-cover"
    />
  );
}

function TiktokVideos() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { t, locale } = useI18n();
  const [items, setItems] = useState<TiktokVideo[]>([]);
  const [cursor, setCursor] = useState<string | number | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [version, setVersion] = useState(0);
  const [toast, setToast] = useState<string | null>(null);
  const closeToast = useCallback(() => setToast(null), []);
  const busy = useRef(false);

  const fail = (e: unknown) => {
    if (e instanceof ApiError && e.status === 401) router.replace("/login");
    else if (e instanceof ApiError && [400, 403, 404].includes(e.status)) setToast(e.message);
    else setToast(t("tt.genericError"));
  };

  /** reset = true: tải lại từ trang đầu (dùng cho "Tải lại"). */
  const load = async (reset: boolean) => {
    if (busy.current) return;
    busy.current = true;
    setLoading(true);
    try {
      const page = await listVideos(id, reset ? null : cursor);
      setItems((prev) => (reset ? page.items : [...prev, ...page.items]));
      setCursor(page.cursor);
      setHasMore(page.hasMore);
      if (reset) setVersion((v) => v + 1);
    } catch (e) {
      fail(e);
    } finally {
      busy.current = false;
      setLoading(false);
    }
  };

  useEffect(() => {
    load(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- chỉ tải lại khi đổi tài khoản
  }, [id]);

  const fmt = (n: number | null) => (n == null ? "–" : new Intl.NumberFormat(locale, { notation: "compact" }).format(n));
  const date = (iso: string) => new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeStyle: "short" }).format(new Date(iso));

  return (
    <AppShell active="channels">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-col gap-2">
          <Link href="/tiktok-accounts" className="flex w-fit items-center gap-1.5 text-[13px] font-medium text-ink-2 hover:text-ink">
            <Icon name="arrow-left" size={16} />
            {t("tt.back")}
          </Link>
          <h1 className="text-[26px] font-bold leading-8 text-ink">{t("tt.videosTitle")}</h1>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Preferences />
          <button
            type="button"
            onClick={() => load(true)}
            disabled={loading}
            className="rounded-[10px] border border-line bg-surface px-3.5 py-2.5 text-sm font-semibold text-ink hover:bg-subtle disabled:opacity-60"
          >
            {t("tt.reload")}
          </button>
        </div>
      </header>

      {!loading && items.length === 0 ? (
        <p className="rounded-2xl border border-line bg-surface p-6 text-sm text-ink-2">{t("tt.noVideos")}</p>
      ) : (
        <ul className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-5">
          {items.map((v) => (
            <li key={v.id}>
              <a
                href={v.shareUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-full flex-col overflow-hidden rounded-2xl border border-line bg-surface transition-colors hover:bg-subtle"
              >
                <Cover video={v} version={version} />
                <div className="flex flex-1 flex-col gap-1.5 p-3">
                  <p className="line-clamp-2 text-[13px] font-semibold leading-5 text-ink">{v.title || t("tt.untitled")}</p>
                  <p className="text-xs text-muted">{date(v.createTime)}</p>
                  <p className="text-xs text-ink-2">
                    {fmt(v.viewCount)} {t("tt.views")} · {fmt(v.likeCount)} {t("tt.likes")}
                  </p>
                  <p className="text-xs text-muted">
                    {fmt(v.commentCount)} {t("tt.comments")} · {fmt(v.shareCount)} {t("tt.shares")}
                  </p>
                </div>
              </a>
            </li>
          ))}
        </ul>
      )}

      {loading && <p className="text-sm text-muted">{t("tt.loading")}</p>}
      {hasMore && !loading && (
        <button
          type="button"
          onClick={() => load(false)}
          className="mx-auto rounded-[10px] border border-line bg-surface px-5 py-2.5 text-sm font-semibold text-ink hover:bg-subtle"
        >
          {t("tt.loadMore")}
        </button>
      )}
      <Toast message={toast} onClose={closeToast} />
    </AppShell>
  );
}

export default function TiktokVideosPage() {
  return (
    <Suspense fallback={null}>
      <TiktokVideos />
    </Suspense>
  );
}
