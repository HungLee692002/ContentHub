"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { dictionaries, locales, type Locale, type MessageKey } from "./dictionaries";

const KEY = "contenthub.locale";

type I18n = {
  locale: Locale;
  setLocale: (l: Locale) => void;
  t: (key: MessageKey) => string;
  /** Số viết bằng dấu chấm thập phân ("1.28M") được hiển thị theo ngôn ngữ ("1,28M" ở vi). */
  num: (value: string) => string;
};

const Ctx = createContext<I18n | null>(null);

export function I18nProvider({ children }: { children: React.ReactNode }) {
  // Server luôn render "vi" (ngôn ngữ của thiết kế); ngôn ngữ đã lưu/của trình duyệt áp dụng sau khi mount.
  const [locale, setLocaleState] = useState<Locale>("vi");

  useEffect(() => {
    let next: Locale = navigator.language.toLowerCase().startsWith("vi") ? "vi" : "en";
    try {
      const saved = localStorage.getItem(KEY);
      if (saved && (locales as readonly string[]).includes(saved)) next = saved as Locale;
    } catch {
      // localStorage bị chặn: dùng ngôn ngữ trình duyệt
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect -- đọc localStorage chỉ làm được sau khi mount
    setLocaleState(next);
  }, []);

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  const setLocale = useCallback((l: Locale) => {
    setLocaleState(l);
    try {
      localStorage.setItem(KEY, l);
    } catch {
      // bỏ qua
    }
  }, []);

  const value = useMemo<I18n>(
    () => ({
      locale,
      setLocale,
      t: (key) => dictionaries[locale][key],
      num: (v) => (locale === "vi" ? v.replace(".", ",") : v),
    }),
    [locale, setLocale],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useI18n() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useI18n must be used inside I18nProvider");
  return ctx;
}
