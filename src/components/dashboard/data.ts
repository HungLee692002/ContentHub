import type { MessageKey } from "@/lib/i18n/dictionaries";

// Dữ liệu mẫu theo thiết kế Figma; chưa nối API. Số dùng dấu chấm thập phân, hiển thị qua `num()`.
export const kpis: {
  label: MessageKey;
  value: string;
  delta: string;
  trend: "up" | "down";
}[] = [
  { label: "kpi.followers", value: "1.28M", delta: "4.2%", trend: "up" },
  { label: "kpi.views", value: "8.4M", delta: "12.8%", trend: "up" },
  { label: "kpi.likes", value: "612K", delta: "6.1%", trend: "up" },
  { label: "kpi.engagement", value: "7.3%", delta: "0.4%", trend: "down" },
];

export const topVideos: { title: MessageKey; handle: string; views: string; likes: string }[] = [
  { title: "top.v1", handle: "@cafe.hanoi", views: "1.2M", likes: "98K" },
  { title: "top.v2", handle: "@tips.photo", views: "864K", likes: "61K" },
  { title: "top.v3", handle: "@quatet.official", views: "742K", likes: "54K" },
  { title: "top.v4", handle: "@dalat.go", views: "655K", likes: "47K" },
];

export type ChannelStatus = "active" | "attention" | "paused";

export const channels: {
  initials: string;
  name: string;
  handle: string;
  followers: string;
  views: string;
  engagement: string;
  videos: number;
  status: ChannelStatus;
  owner: string;
}[] = [
  { initials: "CH", name: "Cafe Hà Nội", handle: "@cafe.hanoi", followers: "284K", views: "2.1M", engagement: "8.4%", videos: 14, status: "active", owner: "Minh Anh" },
  { initials: "TP", name: "Tips Photo", handle: "@tips.photo", followers: "212K", views: "1.6M", engagement: "7.9%", videos: 11, status: "active", owner: "Quốc Bảo" },
  { initials: "QT", name: "Quà Tết Official", handle: "@quatet.official", followers: "176K", views: "1.3M", engagement: "6.2%", videos: 9, status: "active", owner: "Thu Hà" },
  { initials: "DL", name: "Dalat Go", handle: "@dalat.go", followers: "143K", views: "1.1M", engagement: "7.1%", videos: 7, status: "attention", owner: "Đức Huy" },
  { initials: "AT", name: "Ẩm thực 24h", handle: "@amthuc24h", followers: "98K", views: "640K", engagement: "4.3%", videos: 3, status: "paused", owner: "Lan Chi" },
];
