"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Brand, Sidebar, type NavKey } from "@/components/dashboard/Sidebar";
import { ensureSession, getUser, logout } from "@/lib/auth";
import { useI18n } from "@/lib/i18n/I18nProvider";

/** Khung chung cho các trang đã đăng nhập: kiểm tra phiên, sidebar, thanh trên cho màn hình nhỏ. */
export function AppShell({ active, children }: { active: NavKey; children: React.ReactNode }) {
  const router = useRouter();
  const { t } = useI18n();
  const [user, setUser] = useState<ReturnType<typeof getUser> | undefined>(undefined);

  useEffect(() => {
    let cancelled = false;
    ensureSession().then((ok) => {
      if (cancelled) return;
      const u = ok ? getUser() : null;
      if (!u) router.replace("/login");
      else setUser(u);
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
      <Sidebar username={user.username} role={user.role} onSignOut={signOut} active={active} />
      <main className="flex min-w-0 flex-1 flex-col gap-6 px-4 pb-10 pt-6 sm:px-8 lg:pt-8">
        <div className="flex flex-col gap-3 lg:hidden">
          <div className="flex items-center justify-between">
            <Brand />
            <button type="button" onClick={signOut} className="text-[13px] font-medium text-muted hover:text-ink">
              {t("nav.signOut")}
            </button>
          </div>
          <div className="flex gap-4 text-[13px] font-medium">
            <Link href="/dashboard" className={active === "overview" ? "text-brand" : "text-ink-2"}>
              {t("nav.overview")}
            </Link>
            <Link href="/tiktok-accounts" className={active === "channels" ? "text-brand" : "text-ink-2"}>
              {t("nav.channels")}
            </Link>
          </div>
        </div>
        {children}
      </main>
    </div>
  );
}
