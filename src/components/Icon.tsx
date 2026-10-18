export type IconName =
  | "analytics"
  | "play"
  | "overview"
  | "channels"
  | "video"
  | "calendar-nav"
  | "report"
  | "team"
  | "settings"
  | "calendar"
  | "chevron-down"
  | "download"
  | "plus"
  | "arrow-left"
  | "info";

/** Icon từ Figma (public/figma/icons), tô theo `currentColor` bằng CSS mask để dùng được ở cả light/dark. */
export function Icon({ name, size, className = "" }: { name: IconName; size: number; className?: string }) {
  const url = `url(/figma/icons/${name}.svg)`;
  return (
    <span
      aria-hidden="true"
      className={`inline-block shrink-0 bg-current ${className}`}
      style={{
        width: size,
        height: size,
        maskImage: url,
        WebkitMaskImage: url,
        maskSize: "contain",
        WebkitMaskSize: "contain",
        maskRepeat: "no-repeat",
        WebkitMaskRepeat: "no-repeat",
      }}
    />
  );
}
