"use client";

import { useEffect, useState } from "react";
import { locales } from "@/lib/i18n/dictionaries";
import { useI18n } from "@/lib/i18n/I18nProvider";

const THEME_KEY = "contenthub.theme";
type Theme = "light" | "dark";

function currentTheme(): Theme {
  const attr = document.documentElement.dataset.theme;
  if (attr === "light" || attr === "dark") return attr;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

/** Đổi ngôn ngữ (vi/en) và giao diện (sáng/tối). */
export function Preferences() {
  const { locale, setLocale, t } = useI18n();
  const [theme, setTheme] = useState<Theme>("light");

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- theme chỉ đọc được từ DOM/trình duyệt sau khi mount
    setTheme(currentTheme());
  }, []);

  function toggleTheme() {
    const next: Theme = theme === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    setTheme(next);
    try {
      localStorage.setItem(THEME_KEY, next);
    } catch {
      // bỏ qua
    }
  }

  const target = theme === "dark" ? t("prefs.light") : t("prefs.dark");

  return (
    <div className="flex items-center gap-2">
      <div
        role="group"
        aria-label={t("prefs.language")}
        className="flex gap-0.5 rounded-[10px] border border-line bg-subtle p-[3px]"
      >
        {locales.map((l) => (
          <button
            key={l}
            type="button"
            aria-pressed={locale === l}
            onClick={() => setLocale(l)}
            className={`rounded-[7px] border px-2.5 py-1 text-xs font-semibold uppercase transition-colors ${
              locale === l ? "border-line bg-surface text-ink" : "border-transparent text-muted hover:text-ink"
            }`}
          >
            {l}
          </button>
        ))}
      </div>
      <button
        type="button"
        onClick={toggleTheme}
        aria-label={`${t("prefs.theme")}: ${target}`}
        title={target}
        className="flex h-[34px] w-[34px] items-center justify-center rounded-[10px] border border-line bg-subtle text-sm text-ink-2 transition-colors hover:text-ink"
      >
        {theme === "dark" ? "☀" : "☾"}
      </button>
    </div>
  );
}
