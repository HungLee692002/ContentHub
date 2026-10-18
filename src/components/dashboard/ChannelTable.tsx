"use client";

import { Icon } from "@/components/Icon";
import type { MessageKey } from "@/lib/i18n/dictionaries";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { channels, type ChannelStatus } from "./data";

const status: Record<ChannelStatus, { label: MessageKey; chip: string; dot: string }> = {
  active: {
    label: "ch.active",
    chip: "bg-[color-mix(in_srgb,var(--status-success)_14%,transparent)] text-ok",
    dot: "bg-ok",
  },
  attention: {
    label: "ch.attention",
    chip: "bg-[color-mix(in_srgb,var(--status-warning)_14%,transparent)] text-warn",
    dot: "bg-warn",
  },
  paused: {
    label: "ch.paused",
    chip: "bg-[color-mix(in_srgb,var(--text-muted)_14%,transparent)] text-muted",
    dot: "bg-muted",
  },
};

// Độ rộng cột theo Figma (tổng 1080px + padding 24px mỗi bên)
const cols = ["w-[300px]", "w-[130px]", "w-[150px]", "w-[120px]", "w-[110px]", "w-[150px]", "w-[120px]"];
const heads: MessageKey[] = [
  "ch.colChannel",
  "ch.colFollowers",
  "ch.colViews",
  "ch.colEngagement",
  "ch.colVideos",
  "ch.colStatus",
  "ch.colOwner",
];

export function ChannelTable() {
  const { t, num } = useI18n();

  return (
    <section className="overflow-hidden rounded-2xl border border-line bg-surface">
      <div className="flex items-center justify-between gap-3 px-6 py-5">
        <div className="flex flex-col gap-1">
          <h2 className="text-base font-semibold text-ink">{t("ch.title")}</h2>
          <p className="text-[13px] text-muted">{t("ch.subtitle")}</p>
        </div>
        <button
          type="button"
          className="flex items-center gap-2 rounded-[10px] border border-line bg-surface py-[9px] pl-3.5 pr-4 text-sm font-semibold text-ink transition-colors hover:bg-subtle"
        >
          <Icon name="plus" size={16} />
          {t("ch.add")}
        </button>
      </div>

      <div className="overflow-x-auto">
        <div className="min-w-[1128px]">
          <div className="flex items-center border-y border-line bg-subtle px-6 py-3 text-xs font-semibold text-muted">
            {heads.map((h, i) => (
              <p key={h} className={`shrink-0 ${cols[i]}`}>
                {t(h)}
              </p>
            ))}
          </div>

          {channels.map((c) => {
            const s = status[c.status];
            return (
              <div key={c.handle} className="flex items-center border-b border-line px-6 py-3.5 last:border-b-0">
                <div className={`flex shrink-0 items-center gap-3 ${cols[0]}`}>
                  <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-soft text-sm font-bold text-brand">
                    {c.initials}
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <p className="text-sm font-semibold text-ink">{c.name}</p>
                    <p className="text-xs text-muted">{c.handle}</p>
                  </div>
                </div>
                <p className={`shrink-0 text-sm text-ink ${cols[1]}`}>{c.followers}</p>
                <p className={`shrink-0 text-sm text-ink ${cols[2]}`}>{num(c.views)}</p>
                <p className={`shrink-0 text-sm text-ink ${cols[3]}`}>{num(c.engagement)}</p>
                <p className={`shrink-0 text-sm text-ink-2 ${cols[4]}`}>{c.videos}</p>
                <div className={`flex shrink-0 items-center ${cols[5]}`}>
                  <span className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${s.chip}`}>
                    <span className={`size-1.5 rounded-full ${s.dot}`} />
                    {t(s.label)}
                  </span>
                </div>
                <p className={`shrink-0 text-sm text-ink-2 ${cols[6]}`}>{c.owner}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
