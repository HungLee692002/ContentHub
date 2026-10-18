"use client";

import Link from "next/link";
import { Icon, type IconName } from "@/components/Icon";
import type { MessageKey } from "@/lib/i18n/dictionaries";
import { useI18n } from "@/lib/i18n/I18nProvider";

export type NavKey = "overview" | "channels";

const items: { icon: IconName; label: MessageKey; key?: NavKey; href?: string }[] = [
  { icon: "overview", label: "nav.overview", key: "overview", href: "/dashboard" },
  { icon: "channels", label: "nav.channels", key: "channels", href: "/tiktok-accounts" },
  { icon: "video", label: "nav.videos" },
  { icon: "calendar-nav", label: "nav.schedule" },
  { icon: "report", label: "nav.reports" },
  { icon: "team", label: "nav.team" },
  { icon: "settings", label: "nav.settings" },
];

export function Brand() {
  const { t } = useI18n();
  return (
    <div className="flex items-center gap-3 pl-1">
      <div className="flex size-9 shrink-0 items-center justify-center rounded-[10px] bg-brand text-white">
        <Icon name="analytics" size={20} />
      </div>
      <div className="flex flex-col gap-px whitespace-nowrap leading-normal">
        <span className="text-[15px] font-bold text-ink">{t("app.shortName")}</span>
        <span className="text-xs text-muted">{t("app.internal")}</span>
      </div>
    </div>
  );
}

export function Sidebar({
  username,
  role,
  onSignOut,
  active: activeKey = "overview",
}: {
  username: string;
  role: string;
  onSignOut: () => void;
  active?: NavKey;
}) {
  const { t } = useI18n();
  const initials = username.slice(0, 2).toUpperCase();
  const roleLabel = role.toLowerCase() === "admin" ? t("role.admin") : role;

  return (
    <aside className="sticky top-0 hidden h-screen w-[248px] shrink-0 flex-col gap-7 border-r border-line bg-sidebar px-5 pb-5 pt-6 lg:flex">
      <Brand />

      <nav className="flex flex-col gap-1">
        <p className="pb-1.5 pl-3 text-[11px] font-semibold tracking-[0.88px] text-muted">{t("nav.menu")}</p>
        {items.map((item) => {
          const active = item.key === activeKey;
          const cls = `flex w-full items-center gap-3 rounded-[10px] px-3 py-2.5 text-left text-sm transition-colors ${
            active ? "bg-soft font-semibold text-brand" : "font-medium text-ink-2 hover:bg-subtle hover:text-ink"
          }`;
          const content = (
            <>
              <Icon name={item.icon} size={20} />
              <span>{t(item.label)}</span>
            </>
          );
          return item.href ? (
            <Link key={item.label} href={item.href} aria-current={active ? "page" : undefined} className={cls}>
              {content}
            </Link>
          ) : (
            <button key={item.label} type="button" className={cls}>
              {content}
            </button>
          );
        })}
      </nav>

      <div className="mt-auto flex flex-col gap-2">
        <div className="flex items-center gap-3 rounded-xl border border-line bg-subtle p-3">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-soft text-[13px] font-bold text-brand">
            {initials}
          </div>
          <div className="flex min-w-0 flex-col gap-px leading-normal">
            <span className="truncate text-sm font-semibold text-ink">{username}</span>
            <span className="truncate text-xs text-muted">{roleLabel}</span>
          </div>
        </div>
        <button
          type="button"
          onClick={onSignOut}
          className="rounded-[10px] px-3 py-2 text-left text-[13px] font-medium text-muted transition-colors hover:bg-subtle hover:text-ink"
        >
          {t("nav.signOut")}
        </button>
      </div>
    </aside>
  );
}
