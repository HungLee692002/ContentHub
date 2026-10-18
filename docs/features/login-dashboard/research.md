Status: draft

# Research: login-dashboard (trang /connect + /dashboard)

## Vấn đề
- Vấn đề cần giải quyết: BE đã có đủ API (connect TikTok, me, account, videos, disconnect, logout) và đã redirect về `{FE}/dashboard` (thành công) hoặc `{FE}/connect?error=<code>` (lỗi/hủy), nhưng FE chưa có 2 route này nên luồng đăng nhập bị gãy sau callback.
- Cho ai: chủ sở hữu duy nhất của Hunee Content Hub (công cụ riêng, không công khai).
- Vì sao bây giờ: cần để chạy được MVP end-to-end và để TikTok review thấy luồng Login Kit hoạt động.

## Hiện trạng trong code
- FE (`web/src`): chỉ có `app/page.tsx` (landing, link tới /terms, /privacy, không có link login), `terms/`, `privacy/`, `components/LegalLayout.tsx`, `lib/site.ts`, `app/layout.tsx` (lang="en", Geist), `globals.css` (biến `--background/--foreground`, dark mode theo `prefers-color-scheme`). Style: Tailwind 4 thuần, `max-w-3xl px-4`, màu `neutral-*`, không có component UI/thư viện UI. Không có `proxy.ts`, `.env.example` chưa có `NEXT_PUBLIC_API_URL`. UI hiện tại bằng tiếng Anh.
- `next.config.ts`: `cacheComponents: true`, `partialPrefetching: true` (docs Next 16.4 đã đọc: `authentication-with-cache-components.md`, `adopting-partial-prefetching.md`, `16-proxy.md`, `backend-for-frontend.md`, `cookies.md`, `rewrites.md`). Hệ quả: đọc `cookies()`/session phải nằm trong `<Suspense>`; không có `export const dynamic`; component dùng `use cache` không được đọc cookies (trừ `use cache: private`).
- BE (`api/.../TikTokAuthController.cs`, `Program.cs`): cookie `tm_auth` HttpOnly, Secure, SameSite=Lax, Path=/, **không đặt `Domain`** => host-only, chỉ gắn vào đúng host đã set (host của callback). CORS chỉ cho origin `Frontend:Url` + AllowCredentials. Callback lỗi trả `/connect?error=<Uri.EscapeDataString(code)>`; code có thể là mã nội bộ (`TikTok.InvalidState`, `TikTok.MissingRequiredScope`...) hoặc giá trị `error` thô do TikTok trả (vd `access_denied`) (đã kiểm chứng trong controller). `connect` là GET 302, anonymous. Disconnect/logout là POST không body (204).
- Chưa có repo issue (web/ chưa kiểm tra bằng `gh`; thư mục gốc không phải git repo).

## Vấn đề then chốt: cookie nằm ở host API
Vì `tm_auth` là host-only trên host API, **host FE không bao giờ nhận được cookie này** (kể cả subdomain anh em), nên Server Components/`proxy.ts` của Next trên Vercel không thấy nó, trừ khi cùng host.

### Hướng A: Browser gọi thẳng API (`fetch(..., { credentials: "include" })`, CORS)
- Mô tả: `lib/api.ts` (client) dùng `NEXT_PUBLIC_API_URL`; `/dashboard` là shell tĩnh + Client Component gọi `/api/me`, `/account`, `/videos`. 401 => `router.replace("/connect")`. Nút Connect là `<a href="{API}/api/auth/tiktok/connect">` (điều hướng toàn trang).
- Ưu: đúng contract hiện tại, không đổi BE, hợp `cacheComponents` (shell prerender, dữ liệu stream sau), token không qua server Next. SameSite=Lax vẫn gửi cookie trong fetch same-site (FE `pp.example.com`, API `pi.example.com`).
- Nhược: bảo vệ route chỉ ở client (chớp màn hình loading trước khi redirect; chấp nhận được vì BE mới là nơi chặn thật); **chỉ chạy khi FE và API cùng site**. Deploy FE ở `*.vercel.app` + API domain khác => cross-site, Lax chặn cookie trong fetch (giả định: `vercel.app` nằm trong Public Suffix List, cần kiểm tra) => phải dùng custom domain cùng site. Dev localhost:3000 <-> localhost:7031 cùng site nên ổn; flow TikTok thật cần tunnel (xem hướng B).
- Độ phức tạp: S–M.

### Hướng B: Rewrites cùng origin (`/api/:path*` => API) + redirect URI trỏ qua FE
- Mô tả: `next.config.ts` rewrites `/api/*` sang API; `TikTok:RedirectUri` = `{FE}/api/auth/tiktok/callback` (đăng ký lại trên TikTok portal) nên `Set-Cookie` đi qua rewrite và cookie thuộc host FE. Khi đó không cần CORS, Server Components đọc được cookie và forward sang API, `proxy.ts` kiểm tra tối ưu sự hiện diện cookie trước khi vào /dashboard.
- Ưu: chạy với bất kỳ domain (kể cả `*.vercel.app`, tunnel một host như CLAUDE.md đang khuyên), bảo vệ route phía server, SSR không flash.
- Nhược: phải đổi cấu hình BE/TikTok portal (RedirectUri, Frontend:Url), mọi request đi vòng qua Vercel (thêm độ trễ, timeout function), Server Component phải tự forward cookie và xử lý 401, `proxy.ts` chỉ nên là optimistic check (docs: không phải authz). Dev thêm một lớp cấu hình.
- Độ phức tạp: M.

### Hướng C: Route Handler/BFF của Next đứng giữa
- Mô tả: FE tự viết `app/api/*/route.ts` gọi API, quản lý cookie riêng.
- Ưu: kiểm soát tuyệt đối. Nhược: trùng lặp với rewrites, phải tự giữ token/cookie ở FE, vi phạm tinh thần "JS/FE không giữ token". Độ phức tạp: L. Loại bỏ.

## Đề xuất
Hướng A cho MVP, vì khớp contract đã chốt trong CLAUDE.md, không đổi BE, phạm vi nhỏ, và đây là công cụ một người dùng nên guard client + 401 từ BE là đủ. Thiết kế `lib/api.ts` để mọi URL qua một hàm base, như vậy chuyển sang B sau này chỉ là đổi base (`""`) + thêm rewrites. Chuyển sang B nếu bắt buộc deploy ở `*.vercel.app` hoặc cần guard server-side.

Các điểm thiết kế đi kèm (không thêm dependency; dùng `fetch` + `useState/useEffect`, SWR/TanStack Query không cần cho 3 endpoint):
- `/connect`: nút `<a>` tới API, hiển thị lỗi từ `searchParams.error` (đọc trong Suspense hoặc Client Component `useSearchParams`, vì `searchParams` ngoài Suspense làm hỏng App Shell theo docs partial prefetching). Map code => thông điệp thân thiện; code lạ => thông điệp chung (không render thô query string). Nếu `/api/me` trả 200 thì tự chuyển /dashboard.
- `/dashboard`: gọi `/api/me`; 401 => /connect; `isTikTokConnected=false` hoặc `TikTok.NotConnected` => CTA connect; `TikTok.ReconnectRequired` (409) => banner + nút Connect lại; `TikTok.ScopeNotGranted` (403) => hiển thị phần bị thiếu quyền (vd video khi thiếu `video.list`) mà không làm hỏng cả trang. Thẻ tài khoản (field null => ẩn/"—"), lưới video, nút "Load more" dùng `cursor`/`hasMore` (`maxCount` mặc định 20), nút Disconnect (POST rồi về /connect) và Logout (POST rồi về /connect).
- Lưu ý: `/api/me/tiktok/account` gọi TikTok mỗi lần (không auto-refetch dày). Ảnh `coverImageUrl` từ CDN TikTok: dùng `<img>` thường hoặc cấu hình `images.remotePatterns` nếu muốn `next/image` (URL có thể hết hạn, giả định). Các lỗi mạng/CORS cần trạng thái lỗi riêng.
- Thêm `NEXT_PUBLIC_API_URL` vào `.env.example`; chạy test thủ công vì repo chưa có test FE.

## Câu hỏi mở cho chủ sản phẩm
1. Deploy FE/API ở domain nào? Nếu `*.vercel.app` + domain khác thì Hướng A không chạy; có chấp nhận đổi sang B (đổi RedirectUri trên TikTok portal) hay mua custom domain cùng site?
2. Landing `/` có thêm link "Sign in / Connect" không (hiện công khai, chỉ có Terms/Privacy; TikTok review có thể muốn thấy lối vào)? Hay /connect chỉ vào bằng URL trực tiếp?
3. Ngôn ngữ UI: tiếng Anh như hiện tại (lang="en", phục vụ TikTok review) hay tiếng Việt?
4. Phạm vi dashboard MVP: chỉ profile + danh sách video, hay thêm tổng hợp (tổng view/like), sắp xếp, xem video qua `embedLink`/`shareUrl`?
5. Phân trang: nút "Load more" hay trang Prev/Next? (cursor của TikTok chỉ đi tiếp, không lùi.)
6. Có cần trạng thái tải/skeleton và dark mode cho 2 trang mới (globals.css đã hỗ trợ dark)?
7. Giá trị `NEXT_PUBLIC_API_URL` cho dev/prod, và đồng ý dùng `<img>` thay `next/image` cho cover?
8. Disconnect xong có đồng thời logout (xóa cookie) không, hay giữ phiên và chỉ hiện trạng thái chưa connect?

## Nguồn tham khảo
- Docs cục bộ Next 16.4: `web/node_modules/next/dist/docs/01-app/02-guides/authentication-with-cache-components.md`, `.../01-getting-started/16-proxy.md`, `.../02-guides/adopting-partial-prefetching.md`, `.../02-guides/backend-for-frontend.md`, `.../04-functions/cookies.md`, `.../05-config/01-next-config-js/rewrites.md`
- `D:\Personal Project\ContentHub\CLAUDE.md`, `api/src/TikTokManager.Api/Controllers/TikTokAuthController.cs`, `Program.cs`
- Chưa tra web ngoài (mục PSL của vercel.app và hành vi SameSite là kiến thức nền, ghi là giả định).
