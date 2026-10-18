Status: approved
Approved: 2026-10-15

# Spec: tiktok-review-plan (lát 1: khung FE+BE chạy local, đăng nhập Google, dashboard TikTok)

Dựa trên `research.md` (approved 2026-10-15) và quyết định của chủ sản phẩm. Không chứa secret; mọi secret (Google client secret, TikTok client secret, `Jwt:Key`) chỉ qua user-secrets/env.

## Mục tiêu
Có một khung hoàn chỉnh chạy được ở LOCAL: FE (Next.js) và BE (C#) ghép nhau, chủ sở hữu đăng nhập bằng Google (chỉ email nằm trong allowlist), vào dashboard, và (khi có kết nối TikTok) xem tài khoản + danh sách video. Đây là nền để các lát sau (sandbox, tunnel, deploy, quay video, gửi TikTok App Review) xây tiếp. Mốc nghiệm thu của lát này: đăng nhập Google thành công end-to-end ở local.

## Quyết định thiết kế của spec (trong thẩm quyền spec)
- D1. Local dùng hai origin cùng host `localhost`: FE `http://localhost:3000`, BE `https://localhost:7031`. Cookie là host-only theo host nên (không phân biệt port) cùng *site*, SameSite=Lax vẫn dùng được; không cần tunnel cho phần đăng nhập Google. Google OAuth client có redirect URI local (chủ sản phẩm đã có client). Lưu ý cho plan: handler Google dùng thêm cookie tạm riêng (correlation/state) và cookie này cũng phải hoạt động ở `https://localhost:7031` (Secure, SameSite phù hợp cho redirect từ Google về), đồng thời không làm lộn với cookie `tm_auth`.
- D2. Danh tính người dùng = tài khoản Google, khóa nhận diện chính là claim `sub` của Google (ổn định); email chỉ dùng để đối chiếu allowlist và hiển thị (có thể đổi nên không làm khóa). TikTok `open_id` chỉ là tài khoản được NỐI vào user đang đăng nhập, không còn là danh tính. `AppUser` (hiện chỉ có `Id`, `CreatedAt`) được thêm cột `GoogleSubject` (duy nhất, bắt buộc với user mới) và `Email` (cập nhật mỗi lần đăng nhập) qua EF migration.
- D9 (quyết định của spec-writer, chủ sản phẩm xem lại khi duyệt): Disconnect TikTok xóa token VÀ xóa luôn `TikTokAccount` đã đồng bộ (profile/stats), để hành vi khớp lời Privacy ("deletes the stored TikTok tokens and the TikTok data obtained through them"). Hành vi BE hiện tại chỉ xóa token nên đây là thay đổi BE. Sau Disconnect, `open_id` không còn gắn với user nào.
- D3. Allowlist cấu hình qua `Auth:AllowedEmails` (danh sách; giá trị ban đầu `hungle692002@gmail.com`), so khớp không phân biệt hoa thường.
- D4. Luồng Google và luồng connect TikTok là điều hướng toàn trang (không fetch). Khi lỗi, BE redirect về FE kèm `?error=<code>`: lỗi đăng nhập về `/login`, lỗi connect TikTok về `/dashboard` (route `/connect` cũ của contract bị bỏ).
- D5. Chặn truy cập (route guard) ở FE làm phía client bằng `GET /api/me`, vì cookie host-only của API không đọc được từ server Next khi FE và API khác subdomain sau này.
- D6. Theme: mặc định theo hệ thống (`prefers-color-scheme`), có nút chuyển sáng/tối, lưu lựa chọn trong localStorage (không chứa dữ liệu nhạy cảm).
- D7. Thêm NuGet `Microsoft.AspNetCore.Authentication.Google` (đã được chủ sản phẩm đồng ý; plan phải ghi).
- D8. Dữ liệu dev cũ (user tạo bằng TikTok-as-login) không cần migrate; được phép xóa DB dev.

## User stories
- Là chủ sở hữu, tôi muốn đăng nhập bằng tài khoản Google của mình, để chỉ mình tôi vào được công cụ.
- Là chủ sở hữu, tôi muốn người khác dùng tài khoản Google bất kỳ KHÔNG đăng nhập được, để dữ liệu kênh không bị lộ.
- Là chủ sở hữu đã đăng nhập, tôi muốn nối tài khoản TikTok của kênh vào tài khoản của mình, để xem profile, thống kê và video.
- Là chủ sở hữu, tôi muốn xem dashboard (tài khoản + lưới video, tải thêm), ngắt kết nối TikTok và đăng xuất, để kiểm soát dữ liệu.
- Là chủ sở hữu, tôi muốn thấy thông báo rõ ràng khi phiên hết hạn hoặc TikTok cần kết nối lại, để biết phải làm gì.
- Là người xem trang công khai (gồm reviewer TikTok), tôi muốn landing/Terms/Privacy mô tả đầy đủ và đúng thực tế sản phẩm, để hiểu app dùng dữ liệu gì và vì sao.
- Là chủ sở hữu, tôi muốn chuyển giao diện sáng/tối, để dễ nhìn.

## Acceptance criteria

### A. Backend: Google login và allowlist
- **AC-1**: Given người dùng chưa đăng nhập, When trình duyệt gọi `GET /api/auth/google/login`, Then BE trả 302 sang Google authorize với `client_id` của app, `scope` gồm `openid email profile`, `state`, và `redirect_uri` trỏ về callback của BE.
- **AC-2**: Given Google trả về callback hợp lệ với email đã xác minh (`email_verified=true`) nằm trong `Auth:AllowedEmails`, When BE xử lý callback, Then BE tạo (lần đầu) hoặc tìm lại `AppUser` theo `sub` của Google (lưu `GoogleSubject`, `Email`), set cookie `tm_auth` (HttpOnly, Secure, SameSite=Lax, hạn theo `Jwt` hiện có) và trả 302 về `{Frontend:Url}/dashboard`.
- **AC-3**: Given đăng nhập Google lần thứ hai với cùng `sub`, When callback xong, Then không tạo thêm `AppUser` (cùng `userId`); nếu email của `sub` đó đã đổi nhưng vẫn trong allowlist thì cột `Email` được cập nhật; nếu email mới ngoài allowlist thì bị từ chối theo AC-4.
- **AC-4**: Given Google trả về email KHÔNG nằm trong allowlist, When BE xử lý callback, Then KHÔNG set cookie `tm_auth`, KHÔNG tạo `AppUser`, và trả 302 về `{Frontend:Url}/login?error=email_not_allowed`.
- **AC-5**: Given email nằm trong allowlist nhưng `email_verified=false` (hoặc thiếu claim email), When callback, Then không set cookie, không tạo user, redirect `/login?error=email_not_verified`.
- **AC-6**: Given người dùng hủy/từ chối ở màn Google (Google trả `error=access_denied`), When callback, Then không set cookie và redirect `/login?error=access_denied`. Given `state`/correlation sai hoặc thiếu, hoặc Google trả lỗi khác, hoặc đổi code thất bại, Then redirect `/login?error=google_failed`. Cả hai nhánh: BE không trả 500 và không log token/mã code.
- **AC-7**: Given allowlist rỗng hoặc thiếu cấu hình, When bất kỳ ai đăng nhập Google, Then mọi đăng nhập bị từ chối (fail-closed, theo AC-4).
- **AC-8**: Given cấu hình thiếu Google `ClientId`/`ClientSecret`, When BE khởi động ở môi trường Development, Then BE vẫn khởi động, endpoint `google/login` trả lỗi problem+json rõ ràng (không crash, không lộ cấu hình), các endpoint khác không bị ảnh hưởng. Ở môi trường không phải Development (Staging/Production), thiếu Google `ClientId`/`ClientSecret` hoặc `Auth:AllowedEmails` rỗng thì BE fail-fast khi khởi động (thoát với thông báo lỗi cấu hình, không chứa giá trị secret).

### B. Backend: session, `/api/me`, connect/disconnect
- **AC-9**: Given cookie `tm_auth` hợp lệ, When `GET /api/me`, Then 200 với `{ userId, createdAt, email, isTikTokConnected, tikTokDisplayName }` (camelCase); `isTikTokConnected=false` và `tikTokDisplayName=null` khi chưa nối TikTok.
- **AC-10**: Given không có cookie hoặc cookie hết hạn/sai chữ ký, When `GET /api/me` (hoặc `/api/me/tiktok/*`), Then 401 `application/problem+json` có `code = Auth.Unauthenticated`.
- **AC-11**: Given chưa đăng nhập, When trình duyệt gọi `GET /api/auth/tiktok/connect`, Then BE KHÔNG chuyển sang TikTok mà trả 302 về `{Frontend:Url}/login` (không còn `[AllowAnonymous]`).
- **AC-12**: Given đã đăng nhập, When `GET /api/auth/tiktok/connect`, Then 302 sang TikTok authorize với `state` bắt buộc, `scope` đúng cấu hình và state lưu kèm `userId` của người đang đăng nhập.
- **AC-13**: Given scope mặc định trong `appsettings.json`, Then danh sách là `user.info.basic,user.info.stats,video.list` (không còn `user.info.profile`); URL authorize gửi đúng ba scope đó.
- **AC-14**: Given callback TikTok hợp lệ và cookie đăng nhập có `userId` khớp `userId` trong state, When BE xử lý, Then `TikTokAccount` + credential (mã hóa) được gắn vào đúng user đó, KHÔNG tạo `AppUser` mới, và 302 về `{Frontend:Url}/dashboard`. Sau đó `GET /api/me` có `isTikTokConnected=true`.
- **AC-15**: Given callback TikTok không thành công ở bước xác thực người gọi, When BE xử lý, Then áp dụng bảng quyết định sau, đánh giá theo thứ tự ưu tiên từ trên xuống, nhánh đầu tiên khớp thì dừng; mọi nhánh đều KHÔNG gắn tài khoản, KHÔNG tạo credential, KHÔNG gọi đổi code với TikTok:

  | Ưu tiên | Điều kiện | Đích (302) | Mã lỗi |
  |---|---|---|---|
  | 1 | Không có cookie `tm_auth` hợp lệ (bất kể state) | `{Frontend:Url}/login` | không có tham số `error` |
  | 2 | Có cookie hợp lệ, nhưng `state` thiếu, không tồn tại, đã dùng hoặc hết hạn (TTL 10 phút) | `{Frontend:Url}/dashboard?error=TikTok.InvalidState` | `TikTok.InvalidState` |
  | 3 | Có cookie hợp lệ, `state` hợp lệ, nhưng `userId` của cookie khác `userId` lưu trong state | `{Frontend:Url}/dashboard?error=TikTok.UserMismatch` | `TikTok.UserMismatch` |

  Ở nhánh 3, `state` đó bị hủy (không dùng lại được). Mỗi nhánh có một test riêng, gồm cả test hai điều kiện đồng thời (không cookie + state sai -> nhánh 1).
- **AC-16**: Given `open_id` TikTok đang được nối (có `TikTokAccount`) với một user KHÁC user đang đăng nhập, When callback hợp lệ qua AC-15, Then không gắn và redirect `{Frontend:Url}/dashboard?error=TikTok.AlreadyLinked`. Given `open_id` đó từng được nối với user cũ nhưng user cũ đã Disconnect (AC-18, `TikTokAccount` đã bị xóa), Then callback gắn bình thường vào user đang đăng nhập (không báo AlreadyLinked). Given cùng user nối lại `open_id` của chính mình khi đang nối, Then cập nhật credential/account hiện có, không tạo bản trùng.
- **AC-17**: Given người dùng từ chối ở màn consent TikTok (callback có `error`), When callback, Then redirect `/dashboard?error=<code>`; không tạo credential.
- **AC-18**: Given đã đăng nhập và đã nối TikTok, When `POST /api/auth/tiktok/disconnect`, Then 204, token bị revoke bên TikTok (best effort; lỗi revoke không làm hỏng việc xóa cục bộ), credential bị xóa VÀ `TikTokAccount` đã đồng bộ (profile/stats) của user đó bị xóa khỏi DB (D9); phiên Google vẫn còn (`GET /api/me` vẫn 200, `isTikTokConnected=false`, `tikTokDisplayName=null`). Sau đó `GET /api/me/tiktok/account` trả 404 `TikTok.NotConnected`. Test tự động: kiểm tra DB không còn dòng `TikTokAccount`/credential của user sau disconnect; disconnect khi chưa nối cũng trả 204 (idempotent) hoặc 404 `TikTok.NotConnected` theo hành vi hiện tại, nhưng không lỗi 500.
- **AC-19**: Given `POST /api/auth/logout`, Then 204 và cookie `tm_auth` bị xóa; `GET /api/me` ngay sau đó trả 401.
- **AC-20**: Given bộ test BE, When chạy `dotnet test` sau thay đổi, Then toàn bộ pass. Các test bị thay đổi có chủ đích là những test của `StartTikTokConnect` và `CompleteTikTokConnect` (và test điều khiển `TikTokAuthController` nếu có), được cập nhật theo AC-11..AC-18; test của account, videos, refresh token (`TikTokAccessTokenProvider`) không bị sửa. Có test mới cho AC-1..AC-9, AC-15 (đủ 3 nhánh), AC-16, AC-18, AC-52. Không sửa/xóa test chỉ để làm pass.
- **AC-21**: Given CORS, Then chỉ origin `Frontend:Url` được phép, có `AllowCredentials`; request từ origin khác không nhận header CORS.
- **AC-52** (thuộc nhóm B, đánh số bổ sung): Given đã có cookie `tm_auth` hợp lệ của user A, When đăng nhập Google thành công bằng tài khoản được allowlist (cùng hoặc khác `sub`), Then cookie mới do callback phát thay cookie cũ và phiên thuộc user ứng với `sub` vừa đăng nhập; Given đăng nhập thất bại (AC-4..AC-6) khi đang có phiên, Then cookie cũ không bị đổi hay xóa bởi callback đó.

### C. Frontend: trang và điều hướng
- **AC-22**: Given FE chạy, Then có các route `/` (landing), `/login`, `/dashboard`, `/terms`, `/privacy`; mọi nội dung UI bằng tiếng Anh.
- **AC-23**: Given người dùng ở `/login`, When bấm "Sign in with Google", Then trình duyệt điều hướng toàn trang tới `{NEXT_PUBLIC_API_URL}/api/auth/google/login` (không dùng fetch/XHR).
- **AC-24**: Given `/login?error=<code>` với `email_not_allowed`, `email_not_verified`, `google_failed`, `access_denied` (và mã không biết), Then hiện thông báo tiếng Anh tương ứng (mã lạ hiện thông báo chung), không hiện stack trace/mã thô; thông báo `email_not_allowed` không liệt kê email nào trong allowlist.
- **AC-25**: Given chưa đăng nhập (`GET /api/me` trả 401), When mở `/dashboard`, Then điều hướng về `/login` và không từng hiển thị dữ liệu dashboard (chỉ trạng thái loading trung tính).
- **AC-26**: Given đã đăng nhập, When mở `/login`, Then điều hướng về `/dashboard`.
- **AC-27**: Given đang ở `/dashboard` và bất kỳ API call nào trả 401, Then FE điều hướng về `/login` (với thông báo "Your session has expired. Please sign in again.").
- **AC-28**: Given lớp gọi API, Then mọi request tới BE dùng `credentials: "include"` và base URL lấy từ `NEXT_PUBLIC_API_URL` (có trong `.env.example`); không lưu token trong JS/localStorage.
- **AC-29**: Given BE trả `application/problem+json`, Then lớp gọi API trả về lỗi có kiểu (`status`, `code`, `title`); body không phải problem+json hoặc lỗi mạng được chuẩn hóa thành lỗi chung "Network/unknown error" (không throw không bắt).

### D. Frontend: dashboard
- **AC-30**: Given đăng nhập, `isTikTokConnected=false`, Then dashboard hiện email người dùng (từ `/api/me`), trạng thái "TikTok not connected", nút "Connect TikTok" (điều hướng toàn trang tới `{API}/api/auth/tiktok/connect`) và nút "Sign out"; không gọi `/api/me/tiktok/*`.
- **AC-31**: Given `isTikTokConnected=true`, Then dashboard hiện: avatar + display name; follower, following, likes, video count (dữ liệu của scope stats); và nút "Disconnect TikTok".
- **AC-32**: Given account có `username`, `bioDescription`, `isVerified` bằng `null` (do đã bỏ scope profile), Then trang không lỗi, không hiện chữ "null"/"undefined", và ẩn các phần đó.
- **AC-33**: Given `video.list` có dữ liệu, Then lưới video hiện mỗi video: ảnh cover (thẻ `<img>`), title (hoặc description rút gọn), ngày đăng, view/like/comment/share count; link tới video nếu có `shareUrl`.
- **AC-34**: Given `hasMore=true`, When bấm "Load more", Then FE gọi `videos?cursor=<cursor>&maxCount=20`, nối thêm video vào cuối danh sách, và ẩn nút khi `hasMore=false`; trong lúc tải nút bị vô hiệu (không gửi trùng request).
- **AC-35**: Given danh sách video rỗng, Then hiện trạng thái trống "No public videos found for this account." thay vì lưới trống.
- **AC-36**: Given ảnh cover tải lỗi (URL hết hạn), Then hiện ô thay thế (placeholder), layout không vỡ.
- **AC-37**: Given API trả 409 `TikTok.ReconnectRequired`, Then hiện banner "TikTok connection expired" với nút "Reconnect TikTok" (đi tới connect); phần còn lại của trang vẫn dùng được.
- **AC-38**: Given API trả 404 `TikTok.NotConnected`, Then hiển thị trạng thái chưa nối (như AC-30). Given 403 `TikTok.ScopeNotGranted`, Then hiện thông báo cần cấp lại quyền cùng nút Reconnect. Given lỗi khác/mạng, Then hiện thông báo lỗi chung kèm nút "Retry".
- **AC-39**: Given `/dashboard?error=<code>` (vd `TikTok.InvalidState`, `TikTok.AlreadyLinked`, hủy consent), Then hiện thông báo tiếng Anh tương ứng (mã lạ hiện thông báo chung) và xóa tham số `error` khỏi URL sau khi hiển thị hoặc khi tải lại không hiện lại sai ngữ cảnh.
- **AC-40**: When bấm "Disconnect TikTok", Then có bước xác nhận; sau xác nhận gọi `POST disconnect`, thành công thì dashboard chuyển sang trạng thái chưa nối. When bấm "Sign out", Then gọi `POST /api/auth/logout` và điều hướng về `/login`.
- **AC-41**: Given dashboard, Then không hiển thị token, `openId`, hay email nào khác ngoài email của chính người dùng.

### E. Giao diện chung, landing, Terms/Privacy
- **AC-42** (kiểm tra thủ công): Given mọi trang, Then có nút chuyển theme sáng/tối; chọn xong thì class/thuộc tính theme trên `<html>` đổi và giữ nguyên sau khi tải lại; lần đầu theo `prefers-color-scheme`. Tiêu chí cụ thể: (a) hard reload khi đã chọn dark (và khi đã chọn light) không có khung hình nào hiển thị sai theme (quay màn hình/Performance panel hoặc quan sát với throttling CPU); (b) tương phản chữ/nền chính và chữ trên nút đạt WCAG AA (>= 4.5:1 chữ thường) ở cả hai theme, đo bằng công cụ của DevTools/Lighthouse trên landing, login, dashboard.
- **AC-43**: Given mọi trang (landing, login, dashboard, terms, privacy), Then footer luôn có link "Terms" và "Privacy" nhìn thấy ngay (không trong menu ẩn).
- **AC-44**: Given landing `/`, Then có nút "Sign in" (tới `/login`) ở header hoặc hero; và phần mô tả gồm tối thiểu: app là gì và dành cho ai (công cụ riêng của chủ kênh); các tính năng hiện có; danh sách dữ liệu TikTok sử dụng, ứng với từng scope (`user.info.basic` = tên + avatar; `user.info.stats` = số follower/following/likes/video; `video.list` = danh sách video public + view/like/comment/share); cách ngắt kết nối/xóa dữ liệu; tên chủ sở hữu và email liên hệ. Landing không hứa tính năng chưa có.
- **AC-45**: Given Privacy Policy, Then nội dung khớp thực tế của lát này: (a) đăng nhập Google dùng email/tên/ảnh để xác minh chủ sở hữu và truy cập giới hạn theo allowlist; (b) chỉ liệt kê đúng ba scope TikTok đã xin và mục đích từng scope; (c) token TikTok lưu mã hóa, ngắt kết nối thì revoke và xóa token; (d) không còn khẳng định về tính năng chưa tồn tại (nhà cung cấp AI, lưu file, nội dung ý tưởng/lịch/import) và không khẳng định lưu "token Google" (BE không lưu token Google); (e) giữ câu "Disconnecting TikTok deletes the stored TikTok tokens and the TikTok data obtained through them", vì sau D9/AC-18 câu này đúng thực tế (token và `TikTokAccount` đã đồng bộ đều bị xóa). Terms rà tương tự cho khớp.
- **AC-46**: Given `npm run build` và `npm run lint` ở `web/`, Then cả hai chạy không lỗi; route dùng cookie/searchParams tuân thủ ràng buộc `cacheComponents` (đặt trong `<Suspense>` khi cần).

### F. Chạy local end-to-end (nghiệm thu)
- **AC-47**: Given Postgres bằng `docker compose up -d`, migration đã áp, BE chạy profile https (`https://localhost:7031`), FE `npm run dev` (`http://localhost:3000`), `Frontend:Url=http://localhost:3000`, Google client có redirect URI local, When chủ sở hữu bấm Sign in with Google bằng `hungle692002@gmail.com`, Then (kiểm tra thủ công) về `/dashboard` hiện email và trạng thái "TikTok not connected"; tải lại trang vẫn đăng nhập; Sign out về `/login`; vào lại `/dashboard` bị đẩy về `/login`.
- **AC-48**: Given cùng môi trường, When đăng nhập bằng một tài khoản Google KHÔNG thuộc allowlist, Then về `/login` với thông báo không được phép, và DB không có user mới (kiểm tra thủ công).
- **AC-49**: Given repo, Then có hướng dẫn chạy local ngắn (cập nhật `README`/`CLAUDE.md` các mục liên quan: biến môi trường `NEXT_PUBLIC_API_URL`, `Auth:AllowedEmails`, Google `ClientId`/`ClientSecret` qua user-secrets, redirect URI Google cần đăng ký) và `.env.example`/`appsettings.Development.example.json` có placeholder, KHÔNG có giá trị secret thật.
- **AC-50**: Given contract trong `D:/Personal Project/ContentHub/CLAUDE.md` và `web/CLAUDE.md`, When hoàn tất implement, Then contract được cập nhật (endpoint Google, connect yêu cầu đăng nhập, `/api/me` có `email`, lỗi connect về `/dashboard?error=`, bỏ `user.info.profile`) và `web/CLAUDE.md` có lệnh install/lint/build/run thật thay cho TODO. (Chỉ sửa ở bước implement.)
- **AC-51**: Luồng connect TikTok thật với TikTok (sandbox/tunnel) không nằm trong nghiệm thu lát này; connect/callback chỉ được kiểm chứng bằng test tự động với client TikTok giả (AC-11..AC-17).

## Edge cases và xử lý lỗi
- Email hoa/thường khác nhau, có khoảng trắng trong cấu hình allowlist: chuẩn hóa (trim, so khớp không phân biệt hoa thường).
- Cookie `tm_auth` hết hạn khi đang dùng: 401 -> FE về `/login` (AC-27).
- Người dùng mở callback Google/TikTok trực tiếp, không có state hoặc state đã dùng/hết hạn (TTL 10 phút): lỗi có kiểm soát, không 500.
- BE restart giữa chừng OAuth (state in-memory mất): báo `InvalidState`, người dùng thử lại (chấp nhận, R9).
- Đăng nhập Google ở tài khoản khác khi đã có phiên: phiên mới thay cookie cũ nếu hợp lệ; nếu không hợp lệ thì giữ nguyên trạng thái chưa đăng nhập.
- TikTok trả `null` cho field theo scope; refresh token hết hạn/bị thu hồi: 409 ReconnectRequired (AC-37).
- Mất mạng/BE tắt: FE hiện lỗi chung + Retry, không trang trắng.
- Kênh có ít video public (hiện có 2): lưới/empty state đúng; Load more ẩn khi `hasMore=false`.
- Cover URL hết hạn (`x-expires`): placeholder (AC-36); khi tải lại dashboard URL mới được lấy lại từ BE.
- FE và BE khác site (cấu hình sai): cookie không gửi, `/api/me` 401; hướng dẫn local nêu rõ phải dùng cùng host `localhost`.
- Safari/ITP và `http://localhost` + cookie Secure: BE chạy https; ghi chú trong hướng dẫn.

## Yêu cầu phi chức năng
- Hiệu năng: dashboard hiển thị trạng thái loading ngay; gọi `/api/me` một lần ở mỗi lần vào trang; `video.list` mặc định `maxCount=20`; không thêm thư viện fetch/cache (không SWR).
- Bảo mật: allowlist fail-closed; kiểm tra `email_verified`; cookie HttpOnly/Secure/Lax; JS không đọc được token; `state` OAuth bắt buộc và so khớp, callback TikTok ràng buộc với `userId` đang đăng nhập; không log token/secret/mã code; secret chỉ qua user-secrets/env; thông báo lỗi không lộ allowlist hay chi tiết nội bộ; CORS giới hạn đúng origin.
- Tương thích: Chrome/Edge/Firefox bản mới; responsive từ ~360px; hỗ trợ theme sáng/tối bằng Tailwind; .NET 10, Next 16.4 (`cacheComponents`), PostgreSQL 17; thêm đúng một NuGet mới (`Microsoft.AspNetCore.Authentication.Google`) và không thêm npm package ngoài thực sự cần (plan phải ghi nếu có).
- Khả năng bảo trì: tuân quy ước Clean Architecture hiện có của BE (use case trong `Application/Features`); thay đổi schema DB (liên kết danh tính Google với `AppUser`) qua EF migration.

## Ngoài phạm vi (non-goals)
- Deploy production/Railway, domain `api.hunee-kifu.com`, Dockerfile, CI/CD.
- Tunnel HTTPS (Dev Tunnels/ngrok), tạo TikTok Sandbox, thêm Target user, chạy luồng connect TikTok thật với TikTok (smoke test PKCE R2). Thuộc lát sau.
- Quay video demo, soạn mô tả scope (<=1000 ký tự), import cấu hình sandbox, gửi App Review.
- Content Posting API và mọi scope ngoài `user.info.basic`, `user.info.stats`, `video.list`.
- Ý tưởng/kịch bản, lịch nội dung, import thống kê, gợi ý AI, lưu file.
- Đăng nhập nhiều người dùng/đăng ký, quản lý allowlist qua UI, đăng nhập bằng nhà cung cấp khác, đăng nhập bằng TikTok.
- Refresh token/phiên Google, đa instance (Redis cho state), mã hóa Data Protection key at-rest.
- Migrate dữ liệu dev cũ; test E2E trình duyệt tự động; i18n (chỉ tiếng Anh).
- Sửa `CLAUDE.md`/`appsettings.json` ngay lúc viết spec (chỉ ở bước implement).

## Câu hỏi còn mở
Không có câu hỏi chặn cho lát này. Các điểm sau là ghi nhận cho lát sau, không chặn:
- Q1 (lát tunnel/sandbox): Google có chấp nhận redirect URI host tunnel không, và cách cho luồng "Google login + TikTok connect" dùng chung một host khi TikTok chỉ gọi HTTPS (D1 chỉ đúng khi cả hai chạy ở localhost; callback TikTok qua tunnel sẽ đặt cookie trên host tunnel). Cần quyết khi làm tunnel.
- Q2 (sandbox): tài khoản Gym có phải cung cấp đăng nhập không; sandbox có trả dữ liệu thật; có key/redirect riêng không; PKCE base64url có được chấp nhận (R2).
- Q3 (deploy): thời điểm deploy Railway, gói không sleep, domain API.

Ghi chú để chủ sản phẩm xem lại khi duyệt: D9 (Disconnect xóa cả `TikTokAccount`) là quyết định của spec-writer, không phải câu hỏi chặn.

## Lịch sử thay đổi
- v1: bản đầu, từ research (approved) và quyết định của chủ sản phẩm 2026-10-15.
- v2 (theo review spec-1): B1 tách AC-15 thành bảng quyết định 3 nhánh có mã lỗi (`TikTok.InvalidState`, `TikTok.UserMismatch`). B2 chốt D9: Disconnect xóa token và `TikTokAccount`; mở rộng AC-18, sửa AC-16, AC-45(e), bỏ Q4. N1 khóa Google = `sub`, thêm cột `GoogleSubject`/`Email` (D2, AC-2, AC-3). N2 viết lại AC-51. N3 fail-fast ở non-Development (AC-8). N4 AC-42 ghi rõ kiểm tra thủ công và tiêu chí. N5 tách `access_denied` / `google_failed` (AC-6). N6 AC-20 nêu tên test `StartTikTokConnect`/`CompleteTikTokConnect`. N7 ghi chú cookie tạm của Google handler ở D1. N8 thêm AC-52 cho đăng nhập khi đã có phiên.
