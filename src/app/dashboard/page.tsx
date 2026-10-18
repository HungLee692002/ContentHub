"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ChannelTable } from "@/components/dashboard/ChannelTable";
import { GrowthChart } from "@/components/dashboard/GrowthChart";
import { KpiCards } from "@/components/dashboard/KpiCards";
import { Brand, Sidebar } from "@/components/dashboard/Sidebar";
import { TopVideos } from "@/components/dashboard/TopVideos";
import { Icon } from "@/components/Icon";
import { Preferences } from "@/components/Preferences";
import { ensureSession, getUser, logout } from "@/lib/auth";
import { useI18n } from "@/lib/i18n/I18nProvider";

export default function DashboardPage() {
  const router = useRouter();
  const { t } = useI18n();
  // null = chưa kiểm tra (tránh lệch hydration vì token chỉ có ở browser)
  const [user, setUser] = useState<ReturnType<typeof getUser> | null | undefined>(undefined);

  // Chưa đăng nhập thì chuyển về /login. Token hết hạn sẽ được apiFetch tự refresh khi gọi API.
  useEffect(() => {
    let cancelled = false;
    ensureSession().then((ok) => {
      if (cancelled) return;
      const u = ok ? getUser() : null;
      if (!u) router.replace("/login");
      setUser(u);
    });
    return () => {
      cancelled = true;
    };
  }, [router]);

  if (!user) return null;

  const signOut = () => {
    logout();
    router.replace("/login");
  };

  return (
    <div className="flex min-h-screen flex-1 bg-page">
      <Sidebar username={user.username} role={user.role} onSignOut={signOut} />

      <main className="flex min-w-0 flex-1 flex-col gap-6 px-4 pb-10 pt-6 sm:px-8 lg:pt-8">
        {/* Thanh trên cho màn hình nhỏ, nơi sidebar bị ẩn */}
        <div className="flex items-center justify-between lg:hidden">
          <Brand />
          <button type="button" onClick={signOut} className="text-[13px] font-medium text-muted hover:text-ink">
            {t("nav.signOut")}
          </button>
        </div>

        <header className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-col gap-1">
            <h1 className="text-[26px] font-bold leading-8 text-ink">{t("dash.title")}</h1>
            <p className="text-sm text-ink-2">{t("dash.subtitle")}</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Preferences />
            <button
              type="button"
              className="flex items-center gap-2 rounded-[10px] border border-line bg-surface py-2.5 pl-3.5 pr-3 text-sm font-medium text-ink transition-colors hover:bg-subtle"
            >
              <Icon name="calendar" size={18} className="text-ink-2" />
              {t("dash.range")}
              <Icon name="chevron-down" size={16} className="text-muted" />
            </button>
            <button
              type="button"
              className="flex items-center gap-2 rounded-[10px] bg-brand py-2.5 pl-4 pr-[18px] text-sm font-semibold text-on-brand transition-[filter] hover:brightness-95"
            >
              <Icon name="download" size={18} />
              {t("dash.export")}
            </button>
          </div>
        </header>

        <KpiCards />

        <div className="flex flex-col gap-6 xl:flex-row xl:items-stretch">
          <GrowthChart />
          <TopVideos />
        </div>

        <ChannelTable />
      </main>
    </div>
  );
}
