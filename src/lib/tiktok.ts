import { apiFetch } from "@/lib/auth";

export const TIKTOK_REDIRECT_URI =
  process.env.NEXT_PUBLIC_TIKTOK_REDIRECT_URI ?? "https://www.hunee-kifu.com/tiktok/callback";

const STATE_KEY = "tiktok_oauth_state";
const FLASH_KEY = "tiktok_flash";

export type TiktokAccount = {
  id: string;
  displayName: string;
  avatarUrl: string | null;
  followerCount: number | null;
  followingCount: number | null;
  likesCount: number | null;
  videoCount: number | null;
  status: "connected" | "expired" | "revoked" | "error";
  createdAt: string;
};

export type TiktokVideo = {
  id: string;
  title: string | null;
  coverImageUrl: string | null;
  shareUrl: string;
  duration: number | null;
  viewCount: number | null;
  likeCount: number | null;
  commentCount: number | null;
  shareCount: number | null;
  createTime: string;
};

export type TiktokVideoPage = { items: TiktokVideo[]; cursor: string | number | null; hasMore: boolean };

export const listAccounts = () => apiFetch<TiktokAccount[]>("/api/v1/tiktok-accounts");

export const connectAccount = (code: string) =>
  apiFetch<TiktokAccount>("/api/v1/tiktok-accounts/connect", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ code, redirectUri: TIKTOK_REDIRECT_URI }),
  });

export function listVideos(id: string, cursor?: string | number | null) {
  const q = new URLSearchParams({ maxCount: "20" });
  if (cursor != null) q.set("cursor", String(cursor));
  return apiFetch<TiktokVideoPage>(`/api/v1/tiktok-accounts/${encodeURIComponent(id)}/videos?${q}`);
}

/** Tạo state ngẫu nhiên, lưu sessionStorage, lấy URL ủy quyền từ BE rồi chuyển hướng sang TikTok. */
export async function startTiktokLink() {
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  const state = Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
  sessionStorage.setItem(STATE_KEY, state);
  try {
    const { url } = await apiFetch<{ url: string }>(
      `/api/v1/tiktok-accounts/authorize-url?state=${encodeURIComponent(state)}`,
    );
    window.location.href = url;
  } catch (e) {
    sessionStorage.removeItem(STATE_KEY);
    throw e;
  }
}

/** Lấy state đã lưu và xóa ngay (chỉ dùng được một lần). */
export function consumeStoredState(): string | null {
  try {
    const s = sessionStorage.getItem(STATE_KEY);
    sessionStorage.removeItem(STATE_KEY);
    return s;
  } catch {
    return null;
  }
}

/** Thông báo ngắn hiển thị ở trang kế tiếp sau khi chuyển hướng. */
export function setFlash(message: string) {
  try {
    sessionStorage.setItem(FLASH_KEY, message);
  } catch {
    // bỏ qua
  }
}

export function takeFlash(): string | null {
  try {
    const m = sessionStorage.getItem(FLASH_KEY);
    sessionStorage.removeItem(FLASH_KEY);
    return m;
  } catch {
    return null;
  }
}
