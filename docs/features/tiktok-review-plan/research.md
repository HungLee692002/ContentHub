Status: approved
Approved: 2026-10-15

# Research: tiktok-review-plan (login Google + dashboard để gửi TikTok App Review)

Ngày: 2026-10-15. Đường dẫn BE viết tắt `api/` = `D:/Personal Project/ContentHub/api/src/TikTokManager.*`. Nhãn nguồn: (code) đã đọc source; (docs TikTok) tài liệu chính thức developers.tiktok.com; (blog 3rd-party) kinh nghiệm bên thứ ba, không phải quy định; (chưa chắc) chưa kiểm chứng.

## 0. Quyết định đã chốt (chủ sản phẩm)
1. **Phạm vi lát cắt: CHỈ LOCAL**, chưa đẩy prod. Host BE sau này là Railway; Railway, domain `api.hunee-kifu.com` và deploy là việc sau, ngoài lát cắt này. Local cần tunnel HTTPS cho TikTok redirect URI; Google OAuth cho phép redirect `http://localhost` (theo hiểu biết chung về Google, chưa đọc lại docs).
2. OAuth TikTok ở **BE C#** (giữ code hiện có).
3. Google Login ở **BE** + allowlist email. Đề xuất thư viện NuGet `Microsoft.AspNetCore.Authentication.Google` (chính thức, nhỏ). BE kiểm tra `email_verified` và email thuộc allowlist rồi phát cookie `tm_auth`. **Đây là dependency mới, phải ghi trong plan** (team-rules).
4. Chưa có sandbox; dùng tài khoản TikTok kênh Gym làm Target user. (chưa chắc) cần xác nhận ở step sandbox: sandbox có trả dữ liệu thật của tài khoản đó không; có phải cung cấp đăng nhập tài khoản cho TikTok/reviewer không.
5. Bỏ scope `user.info.profile` nếu không cần. Sửa `appsettings.json` và `CLAUDE.md` gốc ở bước implement, **không sửa ngay**.
6. UI tiếng Anh cho reviewer; tiếng Việt chỉ ở nội dung kênh.
7. Allowlist: `hungle692002@gmail.com` (email đã có trong `web/src/lib/site.ts`, không phải secret).
8. Số video demo: tài liệu chính thức không nêu số tối thiểu (docs TikTok: app-review-guidelines không có yêu cầu này). Đề xuất >= 3-5 video public, vì `video/list` chỉ trả video public.
9. Landing `/` thêm nút "Sign in" và mô tả dày hơn.

## 1. Vấn đề
- Gửi TikTok App Review cho app cá nhân (1 chủ, 1 kênh Gym) với Login Kit + Display API (`user.info.basic`, `user.info.stats`, `video.list`; chưa xin Content Posting). Form: giải thích từng product/scope (<=1000 ký tự) + video demo (mp4/mov, <=50MB) trên đúng domain; app chưa từng duyệt phải demo trong sandbox.
- Cho ai: chủ sở hữu; người xem thực tế là reviewer TikTok.
- Hiện FE chỉ có landing/terms/privacy, chưa có login, dashboard, lớp gọi API.

## 2. Hiện trạng (code)
FE (`web/`, Next 16.4, `cacheComponents` + `partialPrefetching` ở `next.config.ts:5-6`):
- Chỉ có `src/app/page.tsx` (link Terms/Privacy `:19-24`, không có lối đăng nhập), `privacy/`, `terms/`, `components/LegalLayout.tsx`, `lib/site.ts`. Chưa có `/login`, `/dashboard`, `lib/api`, test. `web/CLAUDE.md` còn TODO (điền lệnh test/lint trước implement). File xác minh TikTok có ở `web/public/`.
- `privacy/page.tsx:22-24` và `:72-74` nói đăng nhập Google và truy cập giới hạn ở Google account của Owner: **chưa đúng với code**, phải làm cho đúng.

BE (`api/`, .NET 10, PostgreSQL):
- Có sẵn và có test: connect TikTok (`TikTokAuthController.cs:17-51`), đổi code + token mã hóa (`CompleteTikTokConnect.cs:41-91`), refresh có khóa theo account (`TikTokAccessTokenProvider.cs:18-66`), Display API client (`TikTokDisplayApiClient.cs:14-60`), `/api/me*` (`MeController.cs:13-26`), disconnect/logout.
- **Không có Google login, không có allowlist.** Danh tính = TikTok `open_id`; callback tạo `AppUser` cho bất kỳ open_id nào (`CompleteTikTokConnect.cs:65-75`) rồi phát cookie `tm_auth` (`TikTokAuthController.cs:41-50`); `connect` đang `[AllowAnonymous]` (`:17`). Mâu thuẫn với quyết định Google + allowlist: thay đổi BE lớn nhất.
- Scope mặc định gồm `user.info.profile` (`appsettings.json:23`). `UserInfoFields` chỉ gọi field theo scope được cấp (`TikTokScopes.cs:13-21`) nên bỏ scope không làm gãy BE; FE phải chịu được `username/bio/isVerified = null`.
- PKCE: challenge **base64url** (`Pkce.cs:17-19`), luôn gửi S256 (`TikTokOAuthClient.cs:28-29`) và `code_verifier` (`:43`). Docs TikTok không nhất quán (mục 3) => rủi ro R2.
- Hạ tầng: state in-memory (`MemoryOAuthStateStore.cs`) => 1 instance; cookie host-only, Secure, Lax (`TikTokAuthController.cs:41-49`); CORS chỉ origin `Frontend:Url` + credentials (`Program.cs:72-78`); `UseHttpsRedirection` (`:84`); JWT 7 ngày (`appsettings.json:30`). Chưa có Dockerfile (việc sau, thuộc deploy).
- Redirect FE sau callback: `/dashboard` (`:50`), lỗi `/connect?error=<code>` (`:75-76`).

**Hệ quả cookie khi chạy local (code + suy luận):** TikTok chỉ gọi redirect URI HTTPS nên callback đến tunnel host; cookie `tm_auth` được set trên host tunnel. Muốn "đăng nhập Google rồi nối TikTok vào cùng user" thì Google login, TikTok connect và FE phải cùng một host tunnel (đúng gợi ý ở `CLAUDE.md` gốc mục Cookie & domain). Nếu Google login ở `localhost:7031` còn callback TikTok ở host tunnel thì cookie không được gửi. (chưa chắc) Google có chấp nhận redirect URI là host tunnel (`*.devtunnels.ms`, `*.ngrok*`) không; nếu không, dùng domain tunnel cố định được Google chấp nhận hoặc chạy Google ở localhost và TikTok ở tunnel kèm cơ chế nối user khác (cần cân nhắc ở spec).

Kế thừa từ `login-dashboard/research.md` (không sửa file đó):
- Dùng lại: ràng buộc `cacheComponents` (cookie/searchParams phải trong `<Suspense>`), error map theo `code`, xử lý 401/409/403, `<img>` cho cover, không thêm SWR, `lib/api.ts` bọc base URL, "Load more" theo cursor.
- Lỗi thời: (a) coi `/connect` là trang đăng nhập; giờ cần `/login` (Google), "Connect TikTok" là bước sau đăng nhập. (b) phần so sánh `*.vercel.app` và custom domain: nay đã có `hunee-kifu.com` nhưng lát cắt này chỉ local, nên chiến lược "browser gọi thẳng API" (gọi là **Hướng A-cũ** để khỏi nhầm với Hướng A mục 5) vẫn dùng được với một host tunnel chung (hoặc rewrite cùng origin - chưa kiểm chứng). (c) giả định "test dev cần một host chung" của reviewer cũ (N1) được xác nhận ở đây.

## 3. Yêu cầu kỹ thuật TikTok
Login Kit web (docs TikTok: login-kit-web):
- Authorize `https://www.tiktok.com/v2/auth/authorize/` với `client_key`, `response_type=code`, `scope` (dấu phẩy), `redirect_uri`, `state` (bắt buộc, chống CSRF, so khớp khi callback). Lỗi qua `error`, `error_description`.
- Redirect URI: tối đa 10, <512 ký tự, bắt đầu `https`, tĩnh (không tham số), không fragment.
- Token (docs TikTok: oauth-user-access-token-management): `POST /v2/oauth/token/`; access token 86400s, refresh token 31536000s (365 ngày); refresh có thể trả refresh token khác, phải dùng cái mới; revoke `POST /v2/oauth/revoke/`. BE đã khớp (`TikTokOAuthClient.cs:14-15, 46-53`; `TikTokAccessTokenProvider.cs:46-58`).
- PKCE (docs TikTok, không nhất quán): trang Web không nhắc PKCE; trang Desktop nói bắt buộc PKCE và challenge = hex(SHA256); trang token nói `code_verifier` "required for mobile and desktop only". (chưa chắc) web chấp nhận/bỏ qua/từ chối challenge base64url của BE.
Display API (docs TikTok):
- `GET /v2/user/info/?fields=` Bearer. Field: basic = `open_id, union_id, avatar_url, display_name`; profile = `bio_description, profile_deep_link, is_verified, username`; stats = `follower_count, following_count, likes_count, video_count`. Rate limit: không nêu.
- `POST /v2/video/list/` scope `video.list`; `max_count` mặc định 10, tối đa 20; `cursor` Unix ms; trả `videos, cursor, has_more`; chỉ video public, mới nhất trước; cover URL có `x-expires` nên hết hạn. Rate limit: không nêu.
App Review / sandbox (docs TikTok: app-review-guidelines, getting-started-create-an-app, add-a-sandbox):
- 1-5 video demo, <=50MB; app chưa duyệt phải demo trong sandbox; domain trong video phải khớp Website URL.
- Sandbox: tối đa 5 sandbox, 10 target user, thay đổi có thể mất tới 1 giờ; import cấu hình sandbox sang production draft. Việc thêm tài khoản của chính mình làm target user có thể cần cung cấp đăng nhập (từ tóm tắt tìm kiếm, chưa đọc nguyên văn). (chưa chắc) sandbox có client key/secret hoặc redirect URI riêng không (docs không nói).
- URL verification cho app tạo sau 2024-09-09: Terms, Privacy, Web URL. (chưa chắc) host API (`api.`) có cần xác minh riêng không (liên quan phần prod).

## 4. Reviewer kiểm tra gì, vì sao hay bị từ chối
- (guideline) Video phải có luồng end-to-end của mọi product/scope đã chọn; first-time app dùng sandbox; domain khớp Website URL; UI và tương tác rõ ràng; scope thừa làm chậm duyệt ("chỉ xin những gì app cần"); app đang phát triển không được duyệt.
- (guideline) Website phải "fully developed" và Terms/Privacy thấy ngay, không nằm trong menu ẩn. Trang guideline có nhắc không chấp nhận landing/login page đơn thuần (tóm tắt tool, nên đọc lại nguyên văn khi viết spec). Suy luận (không phải quy định): với app chỉ owner đăng nhập, reviewer không vào được bên trong, nên video phải chứng minh nội dung dashboard và landing cần mô tả đầy đủ.
- (blog 3rd-party, bundle.social) Reviewer hay rớt khi demo không thấy bước consent của TikTok; nên chú thích video, trỏ mô tả vào mốc thời gian; scope không được demo bị coi là overreach. Bài viết thiên về Content Posting nên chỉ tham khảo.
- (suy luận) Mỗi scope cần chỗ hiển thị trong UI: basic = tên + avatar; stats = follower/following/likes/video count; `video.list` = danh sách + view/like/comment/share. Lỗi/500/màn trống trong video là rủi ro.
- (suy luận) Privacy phải khớp thực tế (Google, scope đã xin, AI provider, file storage): rà lại.
- **Mâu thuẫn phạm vi cần ghi rõ:** reviewer yêu cầu video quay trên đúng domain `www.hunee-kifu.com`, nhưng lát cắt này chỉ local. Do đó lát cắt này kết thúc ở "luồng chạy được ở local và sẵn sàng quay"; **quay video và gửi review phải chờ bước deploy sau**. Video quay trên host tunnel sẽ bị lệch domain.

## 5. Các hướng triển khai
Quyết định 1 - Google login (đã chọn Hướng A):
- **Hướng A (chọn): Google OIDC ở BE** bằng `Microsoft.AspNetCore.Authentication.Google`, allowlist qua config `Auth:AllowedEmails`, kiểm tra `email_verified`, phát cookie `tm_auth`; TikTok connect đổi thành yêu cầu đã đăng nhập, callback gắn `TikTokAccount` vào user đang đăng nhập (state store mang theo userId). Ưu: một hệ phiên, đúng kiến trúc. Nhược: sửa flow đã test (`CompleteTikTokConnect`, `StartTikTokConnect`), thêm dependency, cần Google OAuth client. M.
- Hướng B: Auth.js ở Next, BE tin session Next. Hai hệ phiên, lệch quyết định. L. Loại.
- Hướng C (cứu hộ): giữ TikTok-as-login + allowlist theo `open_id`, bỏ Google. S nhưng không đúng quyết định và Privacy. Chỉ dùng nếu A bị chặn.
Quyết định 2 - OAuth TikTok ở BE C# (đã chọn); Next route handler bị loại (viết lại, state in-memory không hợp serverless).
Quyết định 3 - host BE: Railway (chọn, **việc sau**). Tiêu chí khi tới bước deploy: không sleep/cold start (cold start làm lỗi OAuth callback hoặc hỏng demo/reviewer truy cập), chạy đúng 1 instance, có Postgres, HTTPS + custom domain cùng site với FE, secret qua env. Chưa có số liệu giá/gói Railway đã kiểm chứng (giả định); cần kiểm tra gói có sleep hay không khi tới lúc đó.

## 6. Đề xuất
Hướng A + OAuth TikTok ở BE + FE gọi API trực tiếp (Hướng A-cũ) với một host tunnel chung khi chạy local. Hoàn thành luồng local, rồi deploy Railway/`api.hunee-kifu.com` ở lát cắt sau trước khi quay video.

## 7. Kế hoạch step (sơ bộ, phạm vi local)
0. Chốt câu hỏi mở chặn (mục 9). Điền `web/CLAUDE.md`.
1. Local hạ tầng: `docker compose up -d` Postgres, migrate, dựng tunnel HTTPS chung cho FE+API (một host), cấu hình `Frontend:Url`, `TikTok:RedirectUri` (secret qua user-secrets/env, không vào repo). Thêm `NEXT_PUBLIC_API_URL` vào `.env.example`.
2. TikTok Developer Portal - tạo Sandbox. Checklist xác nhận (chưa chắc): (a) sandbox có client key/secret và redirect URI riêng không; (b) thêm tài khoản kênh Gym làm Target user, có phải cung cấp đăng nhập không; (c) sandbox có trả dữ liệu thật của tài khoản đó (profile, stats, video public) không; (d) chỉ bật Login Kit + Display API với 3 scope; (e) đợi thay đổi tới ~1 giờ.
3. Smoke test BE hiện tại với sandbox qua tunnel: connect -> callback -> account -> videos. Checklist: (a) PKCE base64url có được chấp nhận; nếu không, thử hex hoặc bỏ PKCE cho web (R2); (b) Google chấp nhận redirect URI host tunnel (Q mục 9); (c) cookie đi đúng host tunnel. Làm trước khi viết UI.
4. BE: Google login + allowlist + gắn TikTok vào user đăng nhập; bỏ `user.info.profile` khỏi config; cập nhật test và contract `CLAUDE.md` gốc.
5. FE: `lib/api.ts`, `/login`, guard + `/dashboard` (chưa connect, Connect TikTok, profile + stats, lưới video, Load more, Disconnect/Logout, xử lý 401/409/403), UI tiếng Anh, footer Terms/Privacy trên mọi trang, nút "Sign in" và mô tả dày hơn ở landing.
6. Sửa Privacy/Terms cho khớp thực tế.
7. Chạy thử như reviewer; không lộ token/email khác trên màn hình; kiểm tra có >= 3-5 video public.
8. (Sau, cần deploy) deploy Railway + `api.hunee-kifu.com`, cập nhật redirect URI sandbox; quay video trên `www.hunee-kifu.com`: Sign in Google -> Connect TikTok -> consent (thấy 3 scope) -> dashboard từng nhóm dữ liệu -> Disconnect.
9. (Sau) soạn mô tả scope (<=1000 ký tự, tiếng Anh), import cấu hình sandbox sang production draft, gửi review.

## 8. Rủi ro
- R1: Site bị coi là landing/login đơn thuần. Giảm: video chứng minh dashboard, landing mô tả đầy đủ.
- R2: PKCE base64url bị từ chối (chưa chắc). Giảm: smoke test step 3.
- R3: Sandbox/redirect/credentials khác dự kiến; target user cần đăng nhập; trễ ~1 giờ. Giảm: làm sớm.
- R4: Cookie/CORS/Secure sai giữa localhost và tunnel; Safari ITP. Giảm: một host chung khi dev.
- R5: Google không chấp nhận redirect URI host tunnel (chưa chắc).
- R6: Kênh ít video public hoặc sandbox không trả dữ liệu thật => demo trống; cover URL hết hạn.
- R7: Domain video lệch vì lát cắt chỉ local (mục 4). Giảm: không quay trước khi deploy.
- R8: Secret (`ClientSecret`, `Jwt:Key`, Google client secret) chỉ qua env/user-secrets. Data Protection key trong DB chưa mã hóa at-rest (`api/README.md:84`), cải thiện sau.
- R9: 1 instance; restart mất state OAuth đang dở (chấp nhận).
- R10: Dependency Google mới phải được plan duyệt; Privacy lệch thực tế.

## 9. Câu hỏi mở (các câu đã trả lời nằm ở mục 0)
Chặn step 1/3 (tunnel):
1. Dùng tunnel nào cho host chung (Dev Tunnels hay ngrok), và Google có chấp nhận host đó làm redirect URI không (kiểm tra ở step 3)? Nếu không, chấp nhận phương án nào: domain tunnel cố định, hay chạy Google ở localhost + cơ chế nối user khác?
Chặn step 2:
2. Sandbox: tài khoản Gym có phải cung cấp đăng nhập không; sandbox có trả dữ liệu thật không; có key/redirect riêng không (xác nhận trong portal; không thể trả lời bằng tài liệu).
Chặn step 4:
3. Đã có Google OAuth client chưa (client id/secret, redirect URI cho local)? Chủ sản phẩm tự tạo ở Google Cloud Console; không đưa secret vào tài liệu.
4. Cookie `tm_auth` nối TikTok vào user đang đăng nhập: chấp nhận đổi `connect` sang yêu cầu đăng nhập (đổi contract `CLAUDE.md` gốc)?
Chặn step 8-9 (sau):
5. Khi nào deploy Railway và cấu hình `api.hunee-kifu.com`; đã chọn gói không sleep chưa?
6. Có chấp nhận chờ deploy mới quay video (do domain phải khớp) không?
Chặn step 7:
7. Kênh Gym hiện có bao nhiêu video public (mục tiêu >= 3-5)?

## Nguồn tham khảo
- [Login Kit for Web](https://developers.tiktok.com/doc/login-kit-web)
- [Manage user access tokens](https://developers.tiktok.com/doc/oauth-user-access-token-management)
- [Login Kit for Desktop (PKCE hex)](https://developers.tiktok.com/doc/login-kit-desktop)
- [Get User Info](https://developers.tiktok.com/doc/tiktok-api-v2-get-user-info)
- [List Videos](https://developers.tiktok.com/doc/tiktok-api-v2-video-list)
- [App Review Guidelines](https://developers.tiktok.com/doc/app-review-guidelines)
- [Create an app / URL verification](https://developers.tiktok.com/doc/getting-started-create-an-app)
- [Add a sandbox](https://developers.tiktok.com/doc/add-a-sandbox)
- [bundle.social: TikTok API approval (blog 3rd-party)](https://bundle.social/blog/tiktok-api-approval)
- Code: `CLAUDE.md` gốc, `api/README.md`, các file BE ở mục 2; `web/docs/features/login-dashboard/research.md` và `reviews/research-1.md`; `web/docs/features/tiktok-review-plan/reviews/research-1.md`.
