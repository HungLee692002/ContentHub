"use client";

import { useI18n } from "@/lib/i18n/I18nProvider";
import { kpis } from "./data";

export function KpiCards() {
  const { t, num } = useI18n();

  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
      {kpis.map((k) => {
        const up = k.trend === "up";
        return (
          <div key={k.label} className="flex flex-col gap-3 rounded-2xl border border-line bg-surface p-5">
            <p className="text-sm font-medium text-ink-2">{t(k.label)}</p>
            <p className="text-[32px] font-bold leading-10 text-ink">{num(k.value)}</p>
            <div className="flex items-center gap-2">
              <span
                className={`rounded-full px-2 py-[3px] text-xs font-semibold ${
                  up
                    ? "bg-[color-mix(in_srgb,var(--status-success)_14%,transparent)] text-ok"
                    : "bg-[color-mix(in_srgb,var(--status-danger)_14%,transparent)] text-bad"
                }`}
              >
                {up ? "↑" : "↓"} {num(k.delta)}
              </span>
              <span className="text-xs text-muted">{t("kpi.vsLastWeek")}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
