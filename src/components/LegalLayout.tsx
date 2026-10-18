"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Icon } from "@/components/Icon";
import { Preferences } from "@/components/Preferences";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { legal, type LegalBlock, type LegalKind } from "@/lib/i18n/legal";
import { site } from "@/lib/site";

const kinds: LegalKind[] = ["terms", "privacy"];

// Khoảng chừa phía trên khi cuộn tới một mục (px), khớp với scroll-mt-16 / lg:scroll-mt-24:
// từ lg có header dính (73px); dưới lg có thanh mục lục dính (~46px).
const scrollOffset = () => (window.innerWidth >= 1024 ? 96 : 64);

/** Thay {name}/{owner}/{email} và **đậm** trong chuỗi nội dung. */
function renderInline(text: string): React.ReactNode[] {
  return text.split(/(\{[a-z]+\}|\*\*[^*]+\*\*)/).map((part, i) => {
    if (part === "{name}") return site.name;
    if (part === "{owner}") return site.owner;
    if (part === "{email}") {
      return (
        <a key={i} className="font-medium text-brand underline" href={`mailto:${site.contactEmail}`}>
          {site.contactEmail}
        </a>
      );
    }
    if (part.startsWith("**")) {
      return (
        <strong key={i} className="font-semibold text-ink">
          {part.slice(2, -2)}
        </strong>
      );
    }
    return part;
  });
}

function Block({ block }: { block: LegalBlock }) {
  if ("p" in block) return <p className="text-[15px] leading-6 text-ink-2">{renderInline(block.p)}</p>;
  return (
    <ul className="flex list-disc flex-col gap-1.5 pl-6 text-[15px] leading-6 text-ink-2 marker:text-muted">
      {block.ul.map((item) => (
        <li key={item}>{renderInline(item)}</li>
      ))}
    </ul>
  );
}

export function LegalLayout({ kind }: { kind: LegalKind }) {
  const { locale, t } = useI18n();
  const strings = legal[locale];
  const doc = strings.docs[kind];
  const [active, setActive] = useState(0);
  const [tocOpen, setTocOpen] = useState(false);

  // Sau khi bấm mục lục, giữ mục đã bấm cho đến khi trang cuộn xong (mục cuối có thể không cuộn lên tới đầu trang)
  const lockRef = useRef<number | null>(null);

  // Đánh dấu mục đang đọc: mục cuối cùng có đỉnh nằm trên đường chuẩn ngay dưới header dính
  useEffect(() => {
    const ids = doc.sections.map((_, i) => `section-${i + 1}`);
    const onScroll = () => {
      if (lockRef.current !== null) return;
      let current = 0;
      ids.forEach((id, i) => {
        const el = document.getElementById(id);
        if (el && el.getBoundingClientRect().top <= scrollOffset() + 1) current = i;
      });
      const atBottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2;
      setActive(atBottom ? ids.length - 1 : current);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [doc]);

  function selectSection(i: number) {
    setActive(i);
    setTocOpen(false);
    if (lockRef.current !== null) window.clearTimeout(lockRef.current);
    lockRef.current = window.setTimeout(() => {
      lockRef.current = null;
    }, 900);
  }

  const tocLinks = doc.sections.map((s, i) => (
    <a
      key={s.heading}
      href={`#section-${i + 1}`}
      onClick={() => selectSection(i)}
      aria-current={i === active ? "true" : undefined}
      className={`rounded-lg px-3 py-[9px] text-sm transition-colors ${
        i === active ? "bg-soft font-semibold text-brand" : "font-medium text-ink-2 hover:bg-subtle hover:text-ink"
      }`}
    >
      {s.heading}
    </a>
  ));

  return (
    <div className="flex min-h-screen flex-1 flex-col bg-page">
      <header className="z-20 flex flex-wrap items-center gap-x-4 gap-y-3 border-b border-line bg-surface px-4 py-3 sm:px-8 lg:sticky lg:top-0 lg:justify-between lg:px-12 lg:py-4">
        <div className="mr-auto flex items-center gap-3 lg:mr-0">
          <div className="flex size-9 items-center justify-center rounded-[10px] bg-brand text-white">
            <Icon name="analytics" size={20} />
          </div>
          <span className="text-[15px] font-bold text-ink">{t("app.shortName")}</span>
        </div>
        <div className="contents lg:flex lg:flex-wrap lg:items-center lg:gap-4">
          <Preferences />
          <nav className="order-3 flex flex-1 gap-1 rounded-[10px] border border-line bg-subtle p-1 lg:order-none lg:flex-none">
            {kinds.map((k) => (
              <Link
                key={k}
                href={`/${k}`}
                aria-current={k === kind ? "page" : undefined}
                className={`flex-1 whitespace-nowrap rounded-[7px] border px-2 py-1.5 text-center text-[13px] transition-colors sm:px-3.5 lg:flex-none ${
                  k === kind
                    ? "border-line bg-surface font-semibold text-ink"
                    : "border-transparent font-medium text-muted hover:text-ink"
                }`}
              >
                {strings.tabs[k]}
              </Link>
            ))}
          </nav>
          <Link
            href="/login"
            aria-label={strings.back}
            title={strings.back}
            className="order-4 flex size-[42px] shrink-0 items-center justify-center gap-2 rounded-[10px] border border-line bg-surface text-sm font-semibold text-ink transition-colors hover:bg-subtle lg:size-auto lg:py-[9px] lg:pl-3.5 lg:pr-4 lg:order-none"
          >
            <Icon name="arrow-left" size={16} />
            <span className="hidden lg:inline">{strings.back}</span>
          </Link>
        </div>
      </header>

      {/* Dưới lg: thanh mục lục dính, thu gọn thành một dòng "mục đang đọc" */}
      <div className="sticky top-0 z-10 border-b border-line bg-surface lg:hidden">
        <button
          type="button"
          aria-expanded={tocOpen}
          onClick={() => setTocOpen((o) => !o)}
          className="flex w-full items-center gap-3 px-4 py-3 text-left sm:px-8"
        >
          <span className="shrink-0 text-[11px] font-semibold tracking-[0.88px] text-muted">{strings.tocLabel}</span>
          <span className="min-w-0 flex-1 truncate text-sm font-semibold text-brand">{doc.sections[active].heading}</span>
          <Icon
            name="chevron-down"
            size={16}
            className={`text-muted transition-transform ${tocOpen ? "rotate-180" : ""}`}
          />
        </button>
        {tocOpen && (
          <nav
            aria-label={strings.tocLabel}
            className="absolute inset-x-0 top-full flex max-h-[70vh] flex-col gap-1 overflow-y-auto border-b border-line bg-surface p-2 shadow-tooltip sm:px-6"
          >
            {tocLinks}
          </nav>
        )}
      </div>

      <div className="flex flex-col items-center gap-8 px-4 py-6 sm:p-8 lg:flex-row lg:items-start lg:justify-center lg:p-12">
        <nav
          aria-label={strings.tocLabel}
          className="sticky top-[97px] hidden w-[280px] shrink-0 flex-col gap-1 rounded-2xl border border-line bg-surface px-4 py-5 lg:flex"
        >
          <p className="pb-2 pl-3 text-[11px] font-semibold tracking-[0.88px] text-muted">{strings.tocLabel}</p>
          {tocLinks}
        </nav>

        <article className="flex w-full flex-col gap-6 sm:gap-8 rounded-2xl border border-line bg-surface px-5 pb-8 pt-7 sm:px-10 sm:pb-12 sm:pt-10 lg:px-14 lg:pb-14 lg:pt-12 lg:w-[880px] lg:shrink-0">
          <header className="flex flex-col gap-3.5">
            <h1 className="text-[28px] font-bold leading-9 text-ink sm:text-[34px] sm:leading-[42px]">{doc.title}</h1>
            <p className="text-sm text-muted">
              {strings.updatedLabel} {locale === "vi" ? site.lastUpdatedVi : site.lastUpdated}
            </p>
            {doc.intro.map((p) => (
              <p key={p} className="text-base leading-[26px] text-ink-2">
                {renderInline(p)}
              </p>
            ))}
          </header>

          <div className="h-px w-full bg-line" />

          {doc.sections.map((s, i) => (
            <section key={s.heading} id={`section-${i + 1}`} className="flex scroll-mt-16 flex-col lg:scroll-mt-24 gap-2.5">
              <h2 className="text-xl font-semibold leading-7 text-ink">{s.heading}</h2>
              {s.blocks.map((b, j) => (
                <Block key={j} block={b} />
              ))}
            </section>
          ))}
        </article>
      </div>

      <footer className="flex justify-center px-4 pb-8 text-center sm:pb-10">
        <p className="text-xs text-muted">{t("app.footer")}</p>
      </footer>
    </div>
  );
}
