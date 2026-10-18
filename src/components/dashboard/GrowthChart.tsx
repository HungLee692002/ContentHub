"use client";

import { useState } from "react";
import type { MessageKey } from "@/lib/i18n/dictionaries";
import { useI18n } from "@/lib/i18n/I18nProvider";

const tabs: MessageKey[] = ["chart.tabViews", "chart.tabFollowers", "chart.tabEngagement"];
const yLabels = [
  { text: "100K", top: 0 },
  { text: "75K", top: 57 },
  { text: "50K", top: 122 },
  { text: "25K", top: 187 },
  { text: "0", top: 251 },
];
const gridTops = [0, 65, 130, 195, 259];
const xLabels = ["12/10", "13/10", "14/10", "15/10", "16/10", "17/10", "18/10"];

/** Một asset Figma có hai bản (light/dark); hiện bản đúng theo theme qua CSS. */
function Themed({ file, className }: { file: string; className: string }) {
  /* eslint-disable @next/next/no-img-element -- SVG tĩnh từ Figma, không cần tối ưu ảnh */
  return (
    <>
      <img alt="" src={`/figma/light/${file}`} className={`asset-light ${className}`} />
      <img alt="" src={`/figma/dark/${file}`} className={`asset-dark ${className}`} />
    </>
  );
  /* eslint-enable @next/next/no-img-element */
}

export function GrowthChart() {
  const { t } = useI18n();
  const [tab, setTab] = useState(0);

  return (
    <section className="flex min-w-0 flex-1 flex-col gap-[18px] overflow-hidden rounded-2xl border border-line bg-surface p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h2 className="text-base font-semibold text-ink">{t("chart.title")}</h2>
          <p className="text-[13px] text-muted">{t("chart.subtitle")}</p>
        </div>
        <div role="tablist" className="flex gap-1 rounded-[10px] border border-line bg-subtle p-1">
          {tabs.map((key, i) => (
            <button
              key={key}
              type="button"
              role="tab"
              aria-selected={tab === i}
              onClick={() => setTab(i)}
              className={`rounded-[7px] border px-3 py-1.5 text-[13px] transition-colors ${
                tab === i
                  ? "border-line bg-surface font-semibold text-ink"
                  : "border-transparent font-medium text-muted hover:text-ink"
              }`}
            >
              {t(key)}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-5 text-xs text-ink-2">
        <span className="flex items-center gap-2">
          <span className="size-2 rounded-full bg-brand" />
          {t("chart.current")}
        </span>
        <span className="flex items-center gap-2">
          <span className="size-2 rounded-full bg-muted" />
          {t("chart.previous")}
        </span>
      </div>

      <div className="relative h-[296px] w-full">
        {/* Plot: chừa 48px bên trái cho nhãn trục Y */}
        <div className="absolute left-12 right-0 top-0 h-[260px]">
          {gridTops.map((top) => (
            <div key={top} className="absolute left-0 right-0 h-px bg-line" style={{ top }} />
          ))}
          <div className="absolute left-0 top-0 h-[239.2px] w-full">
            <Themed file="area.svg" className="absolute inset-0 block size-full max-w-none" />
          </div>
          <div className="absolute left-0 top-0 h-[83.2px] w-full">
            <div className="absolute inset-x-[-0.16%] inset-y-[-1.2%]">
              <Themed file="line-previous.svg" className="block size-full max-w-none" />
            </div>
          </div>
          <div className="absolute left-0 top-0 h-[140.4px] w-full">
            <div className="absolute inset-x-[-0.25%] inset-y-[-1.07%]">
              <Themed file="line-current.svg" className="block size-full max-w-none" />
            </div>
          </div>
          <div className="absolute right-0 top-[28.8px] h-[231.2px] w-px bg-line" />
          <div className="absolute right-0 top-[13.8px] size-[14px] translate-x-1/2">
            <Themed file="marker.svg" className="absolute inset-0 block size-full max-w-none" />
          </div>
          <div className="absolute right-4 top-[120px] flex flex-col gap-0.5 whitespace-nowrap rounded-[10px] border border-line bg-surface px-3 py-2 shadow-tooltip">
            <span className="text-[11px] text-muted">{t("chart.tipDate")}</span>
            <span className="text-[13px] font-semibold text-ink">{t("chart.tipValue")}</span>
          </div>
        </div>

        {yLabels.map((l) => (
          <span key={l.text} className="absolute left-0 w-9 text-right text-xs text-muted" style={{ top: l.top }}>
            {l.text}
          </span>
        ))}

        <div className="absolute left-12 right-0 top-[278px]">
          {xLabels.map((l, i) => (
            <span
              key={l}
              className="absolute w-11 -translate-x-1/2 text-center text-xs text-muted"
              style={{ left: `${(i / (xLabels.length - 1)) * 100}%` }}
            >
              {l}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
