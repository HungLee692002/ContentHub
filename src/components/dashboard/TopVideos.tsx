"use client";

import { Icon } from "@/components/Icon";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { topVideos } from "./data";

export function TopVideos() {
  const { t, num } = useI18n();

  return (
    <section className="flex w-full shrink-0 flex-col gap-5 rounded-2xl border border-line bg-surface p-6 xl:w-[400px]">
      <div className="flex items-center justify-between font-semibold">
        <h2 className="text-base text-ink">{t("top.title")}</h2>
        <button type="button" className="text-[13px] text-brand hover:underline">
          {t("top.viewAll")}
        </button>
      </div>
      <ul className="flex flex-col gap-5">
        {topVideos.map((v) => (
          <li key={v.title} className="flex items-start gap-3.5">
            <div className="flex h-[72px] w-14 shrink-0 items-center justify-center rounded-[10px] bg-soft text-brand">
              <Icon name="play" size={20} />
            </div>
            <div className="flex min-w-0 flex-1 flex-col gap-1">
              <p className="text-sm font-semibold leading-5 text-ink">{t(v.title)}</p>
              <p className="text-xs text-muted">{v.handle}</p>
              <p className="text-xs text-ink-2">
                {num(v.views)} {t("top.views")} · {num(v.likes)} {t("top.likes")}
              </p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
