// Lưu token ở localStorage (BE trả token qua body JSON) và gọi API kèm tự refresh khi 401.
const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5115";
const KEY = "contenthub.auth";

export type AuthTokens = {
  accessToken: string;
  accessExpiredDate: string;
  refreshToken: string;
  refreshExpiredDate: string;
};

export class ApiError extends Error {
  constructor(
    public status: number,
    public errorCode: number,
    message: string,
  ) {
    super(message);
  }
}

export function getTokens(): AuthTokens | null {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as AuthTokens) : null;
  } catch {
    return null;
  }
}

function saveTokens(tokens: AuthTokens | null) {
  try {
    if (tokens) localStorage.setItem(KEY, JSON.stringify(tokens));
    else localStorage.removeItem(KEY);
  } catch {
    // localStorage bị chặn: bỏ qua, phiên chỉ sống trong tab này
  }
}

async function post<T>(path: string, body: unknown, accessToken?: string): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    },
    body: JSON.stringify(body),
  });
  return parse<T>(res);
}

async function parse<T>(res: Response): Promise<T> {
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    throw new ApiError(res.status, data?.errorCode ?? 0, data?.errorString ?? "Request failed");
  }
  return data as T;
}

/** Đổi Google access token lấy token của hệ thống. */
export async function loginWithGoogle(googleAccessToken: string) {
  const tokens = await post<AuthTokens>("/api/v1/auth/google", { accessToken: googleAccessToken });
  saveTokens(tokens);
  return tokens;
}

export function logout() {
  saveTokens(null);
}

// Dùng chung một lần refresh khi nhiều request cùng gặp 401 (refresh token chỉ dùng được một lần)
let refreshing: Promise<AuthTokens | null> | null = null;

function refresh(): Promise<AuthTokens | null> {
  refreshing ??= (async () => {
    const current = getTokens();
    if (!current) return null;
    try {
      const tokens = await post<AuthTokens>("/api/v1/auth/refresh", {
        refreshToken: current.refreshToken,
      });
      saveTokens(tokens);
      return tokens;
    } catch (e) {
      // Chỉ xóa phiên khi BE từ chối refresh token; lỗi mạng thì giữ lại để thử lại sau
      if (e instanceof ApiError) saveTokens(null);
      return null;
    } finally {
      refreshing = null;
    }
  })();
  return refreshing;
}

function isExpired(iso: string | undefined, skewMs = 30_000): boolean {
  if (!iso) return true;
  // BE trả UTC; thiếu hậu tố múi giờ thì coi là UTC
  const t = Date.parse(/(Z|[+-]\d\d:?\d\d)$/.test(iso) ? iso : `${iso}Z`);
  return Number.isNaN(t) || t - skewMs <= Date.now();
}

/**
 * Đảm bảo có phiên hợp lệ: access token còn hạn thì dùng luôn; hết hạn thì refresh (nếu refresh token còn hạn).
 * Trả false khi không có phiên dùng được (cần đăng nhập lại).
 */
export async function ensureSession(): Promise<boolean> {
  const tokens = getTokens();
  if (!tokens) return false;
  if (!isExpired(tokens.accessExpiredDate)) return true;
  if (isExpired(tokens.refreshExpiredDate, 0)) {
    saveTokens(null);
    return false;
  }
  return (await refresh()) !== null;
}

/** Gọi API cần đăng nhập. Access token hết hạn hoặc 401 thì refresh một lần rồi thử lại. */
export async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const send = (token: string) =>
    fetch(`${API_URL}${path}`, {
      ...init,
      headers: { ...init.headers, Authorization: `Bearer ${token}` },
    });

  if (!getTokens()) throw new ApiError(401, 0, "Not logged in");
  if (!(await ensureSession())) throw new ApiError(401, 0, "Session expired");
  let tokens = getTokens();
  if (!tokens) throw new ApiError(401, 0, "Not logged in");

  let res = await send(tokens.accessToken);
  if (res.status === 401) {
    tokens = await refresh();
    if (!tokens) throw new ApiError(401, 0, "Session expired");
    res = await send(tokens.accessToken);
  }
  return parse<T>(res);
}

/** Đọc claim từ access token (chỉ để hiển thị, không dùng để phân quyền). */
export function getUser(): { username: string; role: string } | null {
  const tokens = getTokens();
  if (!tokens) return null;
  try {
    const b64 = tokens.accessToken.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    const payload = JSON.parse(atob(b64));
    return { username: payload.username, role: payload.role };
  } catch {
    return null;
  }
}
