Status: approved
Approved: 2026-10-15

# Plan: tiktok-review-plan (lát 1: khung FE+BE chạy local, đăng nhập Google, dashboard TikTok)

Spec: [spec.md](spec.md) (approved 2026-10-15). Research: [research.md](research.md). Review spec lần 2: [reviews/spec-2.md](reviews/spec-2.md).

Quy ước đường dẫn: gốc dự án là `D:/Personal Project/ContentHub/` (viết tắt `CH/`). BE = `CH/api/`, FE = `CH/web/`. Mọi đường dẫn BE/FE bên dưới tính từ `CH/` và đã đối chiếu với source thật khi lập plan.

## Điều kiện tiên quyết và lưu ý về công cụ

- `web/CLAUDE.md` vẫn là template TODO (lệnh, quy ước). Plan này lấy lệnh từ `CH/CLAUDE.md` và `CH/api/README.md`; T19 điền `web/CLAUDE.md`. Không đoán thêm lệnh nào khác ngoài bảng dưới.
- Quy tắc Next.js: `web/AGENTS.md` yêu cầu đọc `web/node_modules/next/dist/docs/` (App Router, `cacheComponents`, `useSearchParams` + Suspense, `next/script`) trước khi viết mọi task FE (T12-T18).
- Lệnh chuẩn:

| Việc | Lệnh | Chạy ở |
|---|---|---|
| Hạ tầng DB | `docker compose up -d` | `CH/api` |
| Công cụ dotnet | `dotnet tool restore` | `CH/api` |
| Áp migration | `dotnet ef database update --project src/TikTokManager.Infrastructure --startup-project src/TikTokManager.Api` | `CH/api` |
| Thêm migration | `dotnet ef migrations add <Name> --project src/TikTokManager.Infrastructure --startup-project src/TikTokManager.Api` | `CH/api` |
| Chạy BE | `dotnet run --project src/TikTokManager.Api --launch-profile https` (https://localhost:7031) | `CH/api` |
| Test BE | `dotnet test` (hoặc `dotnet test --filter "FullyQualifiedName~<Tên>"`) | `CH/api` |
| FE | `npm install`, `npm run dev`, `npm run lint`, `npm run build` | `CH/web` |
| Test FE (mới, T12) | `npm test` (= `node --test`, không thêm package) | `CH/web` |

### Quản lý thay đổi (git) cho hai repo: VẤN ĐỀ CẦN CHỦ SẢN PHẨM QUYẾT ĐỊNH TRƯỚC T0

Thực trạng đã kiểm tra: chỉ `CH/web` có `.git` (nhánh hiện tại `main`; có untracked `.claude/` và `docs/features/login-dashboard/` không thuộc tính năng này, KHÔNG được `git add` hai thứ đó, luôn `git add` theo đường dẫn cụ thể). `CH/api` không phải git repo (có sẵn `.gitignore` chặn `bin/ obj/ appsettings.Development.json`). Thư mục gốc `CH/` cũng không phải repo. Team-rules yêu cầu "mỗi task một commit trên `feat/tiktok-review-plan`", nên BE hiện KHÔNG thể tuân thủ.

- Phương án đề xuất (cần chủ sản phẩm đồng ý, vì tạo repo mới): `git init` trong `CH/api`, commit nền `chore: baseline before tiktok-review-plan` trên `main` (đã có `.gitignore`), rồi `git switch -c feat/tiktok-review-plan`; mỗi task BE (T1-T11) một commit `feat|test|fix(tiktok-review-plan): ...` trong repo này. Không thêm remote, không push.
- Phương án dự phòng nếu chủ sản phẩm từ chối: BE không có commit; trước T1 copy `api/src` và `api/tests` (bỏ `bin/ obj/`) sang `D:/Personal Project/ContentHub-backup/api-baseline/` (ngoài cả hai repo, không phải scratchpad của phiên). Sau mỗi task BE, ghi danh sách file đã đổi vào một file ghi chú ngoài repo `D:/Personal Project/ContentHub-backup/be-changes.md` (KHÔNG tạo commit rỗng trong `web`, để không làm bẩn lịch sử nhánh FE). Chỗ nào plan nói "`git diff --stat` trong api" thì ở phương án này dùng `diff -r -q "D:/Personal Project/ContentHub-backup/api-baseline/tests" "D:/Personal Project/ContentHub/api/tests"` (và tương tự với `src`), loại `bin`/`obj` bằng `-x bin -x obj`. Review BE dùng `diff -ru` với bản sao lưu.
- FE (`web`): tạo nhánh `git switch -c feat/tiktok-review-plan` từ `main` (main đã chứa 2 commit approve research/spec); mỗi task FE (T12-T19) một commit. Plan này được commit riêng `docs(tiktok-review-plan): add plan` sau khi chủ sản phẩm duyệt. Không push `main`, không force push; push nhánh/PR chỉ khi chủ sản phẩm đồng ý.
- `web/.gitignore` có dòng `.env*` nên `web/.env.example` hiện KHÔNG nằm trong git (đã kiểm tra `git ls-files`). T12 phải thêm `!.env.example` vào `web/.gitignore` để file mẫu được commit (AC-49).

## Thiết kế tổng quan

### Thành phần thay đổi

BE (`api/`, Clean Architecture, use case trong `Application/Features`):
- Domain: `AppUser` thêm `GoogleSubject` (duy nhất), `Email`; bỏ `AppUser.Create(now)` (chỉ còn factory tạo từ Google).
- Application: ports mới `IAllowedEmailPolicy`, `IAppUserRepository.GetByGoogleSubjectAsync`, `ITikTokAccountRepository.Remove(account)`; `IOAuthStateStore` đổi sang lưu `OAuthStateEntry(UserId, CodeVerifier)`; use case mới `SignInWithGoogle`; sửa `StartTikTokConnect`, `CompleteTikTokConnect`, `DisconnectTikTok`, `GetMe` (thêm `Email`); thêm lỗi `Auth.EmailNotAllowed`, `Auth.EmailNotVerified`, `TikTok.UserMismatch`, `TikTok.AlreadyLinked`, `TikTok.AlreadyConnected`, `TikTok.AccessDenied`, `TikTok.AuthFailed`.
- Infrastructure: `AuthOptions` (`Auth:AllowedEmails`) + `AllowedEmailPolicy`; `MemoryOAuthStateStore` theo entry mới; EF config + migration `AddGoogleIdentityToAppUser`; repo mới.
- Api: `GoogleAuthController` (`api/auth/google/login`, `api/auth/google/exchange`), cấu hình Google handler + cookie ngoài `tm_external` + kiểm tra cấu hình lúc khởi động, `AuthCookie` helper dùng chung, sửa `TikTokAuthController` (connect/callback/logout), `JwtBearerEvents.OnChallenge` ghi problem+json, `Program.cs`.
- Test: thêm project `tests/TikTokManager.Api.Tests` (project mới, KHÔNG thêm package mới: dùng đúng các package đang có ở hai project test hiện tại); cập nhật `CompleteTikTokConnectTests`; thêm test mới.
- Config: `appsettings.json` (scope 3, `Auth`, `Authentication:Google` placeholder rỗng), `appsettings.Development.example.json`.

FE (`web/`, Next 16.4, `cacheComponents`):
- `src/lib/api/*` (fetch wrapper, kiểu, URL builder, map thông báo lỗi), theme (script chống flash + nút chuyển), header/footer trong root layout, trang `/login`, `/dashboard` (+ component), landing mới, Privacy/Terms sửa nội dung, `.env.example`.

### Luồng dữ liệu

1. Đăng nhập: FE `/login` -> điều hướng toàn trang `{API}/api/auth/google/login` -> BE `Challenge("Google")` (302 Google, `redirect_uri` = `{API}/api/auth/google/callback`, scope `openid email profile`, `state`/correlation do handler Google quản lý) -> Google gọi callback (handler Google xử lý, ghi cookie ngoài `tm_external`, 302 sang `{API}/api/auth/google/exchange`) -> `exchange` đọc claim (`sub`, `email`, `email_verified`), gọi use case `SignInWithGoogle` (allowlist, tạo/tìm `AppUser`), thành công thì phát cookie `tm_auth` (ghi đè cookie cũ nếu có), xóa `tm_external`, 302 `{Frontend:Url}/dashboard`; lỗi thì 302 `{Frontend:Url}/login?error=<code>` mà KHÔNG đụng cookie `tm_auth`.
2. Connect TikTok: FE nút "Connect TikTok" -> `{API}/api/auth/tiktok/connect` -> nếu chưa đăng nhập 302 `{Frontend:Url}/login`; nếu đã đăng nhập lưu state kèm `userId` + code_verifier, 302 TikTok -> callback `{API}/api/auth/tiktok/callback` -> use case kiểm tra theo thứ tự ưu tiên, gắn `TikTokAccount` + credential vào user hiện tại, 302 `{Frontend:Url}/dashboard` hoặc `/dashboard?error=<code>`.
3. Dashboard: FE gọi `GET /api/me` (một lần/lần vào trang); nếu `isTikTokConnected` thì gọi `/api/me/tiktok/account` và `/api/me/tiktok/videos`. 401 ở bất kỳ call nào -> `/login`.
4. Disconnect: `POST /api/auth/tiktok/disconnect` revoke best-effort rồi xóa `TikTokAccount` (cascade xóa credential). Logout: xóa cookie.

### Quyết định kỹ thuật chính (và lý do)

- P1. Một NuGet mới duy nhất: `Microsoft.AspNetCore.Authentication.Google`, chỉ thêm vào `api/src/TikTokManager.Api/TikTokManager.Api.csproj`, cùng dòng phiên bản 10.0.x với `Microsoft.AspNetCore.Authentication.JwtBearer` (đang 10.0.13; nếu 10.0.13 chưa có thì lấy bản 10.0.x gần nhất, ghi phiên bản thực tế vào commit). Project test mới `TikTokManager.Api.Tests` là project, không phải package mới; không thêm `Microsoft.AspNetCore.Mvc.Testing` (xem rủi ro RK6). npm: KHÔNG thêm package nào (test FE dùng `node --test` có sẵn trong Node 24.16 đang cài; theme, fetch, dialog tự viết).
- P2. Handler Google không tự đăng nhập user. Dùng cookie ngoài riêng `tm_external` làm `SignInScheme` của Google (chỉ để mang claim từ callback sang action `exchange`, hạn ngắn, HttpOnly, Secure), rồi action `exchange` mới gọi use case và phát `tm_auth`. Lý do: giữ logic allowlist/tạo user trong Application (test được bằng NSubstitute) và không lẫn với `tm_auth`. `DefaultAuthenticateScheme`/`DefaultChallengeScheme` vẫn là JwtBearer (không đổi hành vi 401 của API); `Challenge("Google")` và `Authenticate("tm_external")` luôn gọi đích danh scheme.
- P3. Callback Google dùng `CallbackPath = /api/auth/google/callback` (redirect URI đăng ký ở Google: `https://localhost:7031/api/auth/google/callback`). Cookie correlation do handler Google tự set (SameSite=None; Secure) ở origin `https://localhost:7031`; BE bắt buộc chạy profile https.
- P4. Claim `email_verified` không được map mặc định bởi Google handler: thêm `ClaimActions.MapJsonKey("email_verified", "email_verified")`, parse không phân biệt hoa thường. `SaveTokens = false` (không lưu token Google; khớp Privacy). Thêm `prompt=select_account` qua `AuthenticationProperties` để chọn được tài khoản khác (cần cho AC-48 và AC-52).
- P5. Cấu hình thiếu ở Development: KHÔNG đăng ký scheme Google (vì handler OAuth ném lỗi khi `ClientId/ClientSecret` rỗng và sẽ làm hỏng mọi request qua `UseAuthentication`). `google/login` kiểm tra `IAuthenticationSchemeProvider.GetSchemeAsync("Google")`; null thì trả 503 `application/problem+json` với `code = Auth.GoogleNotConfigured`. Ở môi trường khác Development: thiếu `Authentication:Google:ClientId/ClientSecret` hoặc `Auth:AllowedEmails` rỗng thì `Program` ném `InvalidOperationException` với thông điệp liệt kê TÊN khóa thiếu (không in giá trị) trước `builder.Build()`. Logic kiểm tra là hàm thuần để unit test.
- P6. Cấu hình khóa: `Authentication:Google:ClientId`, `Authentication:Google:ClientSecret` (user-secrets/env, không vào repo); `Auth:AllowedEmails` (mảng; giá trị ban đầu `hungle692002@gmail.com` trong `appsettings.json`, đây là email công khai đã có trong `web/src/lib/site.ts`, không phải secret). Allowlist trim + so khớp không phân biệt hoa thường; rỗng/thiếu thì từ chối tất cả (fail-closed).
- P7. Thứ tự kiểm tra trong `SignInWithGoogle` (chốt): (1) thiếu claim email hoặc rỗng -> `Auth.EmailNotVerified`; (2) email không thuộc allowlist -> `Auth.EmailNotAllowed` (kiểm tra TRƯỚC `email_verified` để không lộ gì cho email ngoài allowlist; email ngoài allowlist + chưa verified vẫn là `email_not_allowed`); (3) `email_verified != true` -> `Auth.EmailNotVerified`; (4) tìm `AppUser` theo `GoogleSubject`, có thì cập nhật `Email` nếu đổi, chưa có thì tạo; (5) phát JWT. Nhờ (2) đứng trước (4), AC-3 (email mới ngoài allowlist) bị từ chối và không cập nhật cột `Email`. Ánh xạ mã sang FE: `Auth.EmailNotAllowed -> email_not_allowed`, `Auth.EmailNotVerified -> email_not_verified`; callback có `error=access_denied` -> `access_denied`; mọi lỗi khác (state/correlation sai, đổi code lỗi, claim thiếu `sub`, exception) -> `google_failed`.
- P8. Cột DB: `GoogleSubject` varchar(255) NULLABLE trong DB + unique index (Postgres coi NULL là khác nhau nên dòng cũ không vi phạm; D8 cho phép xóa DB dev), `Email` varchar(320) nullable. Factory `AppUser.CreateFromGoogle(subject, email, now)` bắt buộc subject/email không rỗng nên user mới luôn có đủ. Không migrate dữ liệu cũ.
- P9. `connect` vẫn giữ `[AllowAnonymous]` ở tầng pipeline (khác chữ trong AC-11, "không còn `[AllowAnonymous]`") nhưng KIỂM TRA đăng nhập trong use case và trả 302 `{Frontend:Url}/login`. Lý do: bỏ attribute thì FallbackPolicy trả 401 JSON cho một điều hướng trình duyệt, không đạt "302 về /login". Đây là diễn giải ý định AC-11 (không bao giờ chuyển sang TikTok khi chưa đăng nhập); test khẳng định hành vi, không khẳng định có/không attribute. **P9 lệch chữ AC-11 của spec đã duyệt ("không còn `[AllowAnonymous]`"): chủ sản phẩm cần xác nhận bằng văn bản khi duyệt plan này (hoặc ghi vào lịch sử spec v3); spec không bị sửa trong bước plan.** Tương tự P8 (`GoogleSubject` nullable trong DB) hơi lệch D2 "bắt buộc với user mới" nhưng được factory `CreateFromGoogle` bảo đảm. Authentication middleware vẫn nạp `HttpContext.User` từ cookie trên endpoint anonymous nên `ICurrentUser` hoạt động ở cả `connect` và `callback`.
- P10. `IOAuthStateStore` đổi thành `SaveAsync(state, OAuthStateEntry entry, ttl, ct)` / `ConsumeAsync(state, ct) -> OAuthStateEntry?`; vẫn in-memory, dùng một lần, TTL 10 phút (chạy 1 instance, R9 giữ nguyên).
- P11. AC-10: `JwtBearer` mặc định trả 401 không body; thêm `OnChallenge` (gọi `HandleResponse`) ghi `application/problem+json` với `code = Auth.Unauthenticated` (status 401, `title` = code, theo đúng dạng `ApiControllerBase.Problem`). Implementer kiểm tra bằng curl trước; nếu đã đạt thì chỉ thêm test, không đổi code.
- P12. Disconnect (D9) xóa `TikTokAccount`; EF cascade (đã cấu hình ở `Configurations.cs`: `HasOne(a => a.Credential).OnDelete(Cascade)`) xóa credential. `OpenId` unique index được giải phóng nên nối lại với user khác hợp lệ (AC-16).
- P13. Theme (D6): tách khỏi `prefers-color-scheme` thuần CSS sang class `dark` trên `<html>`. Script nội tuyến trong `<head>` của root layout đặt class trước paint (đọc `localStorage["theme"]`, thiếu thì `matchMedia`), `suppressHydrationWarning` trên `<html>`; Tailwind 4 dùng `@custom-variant dark (&:where(.dark, .dark *))` trong `globals.css`. Các class `dark:` hiện có trong `page.tsx` vẫn hoạt động.
- P14. Guard FE (D5) phía client: component `useSession()` gọi `GET /api/me`; trạng thái `loading | authenticated | unauthenticated`. Trang `/dashboard` chỉ render dữ liệu khi `authenticated`; khi loading render khung trung tính (AC-25). 401 từ bất kỳ call = đi `/login?error=session_expired` (mã chỉ FE dùng, không do BE trả).
- P15. Xử lý `?error=` trên `/dashboard`: đọc bằng `useSearchParams` (trong `<Suspense>` do `cacheComponents`), lưu vào state, rồi `router.replace("/dashboard")` để xóa tham số (AC-39).
- P16. Test FE: không có framework FE trong repo. Dùng `node --test` (Node 24.16 chạy `.ts` trực tiếp) cho logic thuần: `lib/api/problem`, `lib/api/messages`, chuẩn hóa lỗi. Import trong các file này dùng đường dẫn tương đối kèm đuôi `.ts`, nên `tsconfig.json` thêm `allowImportingTsExtensions: true` (đã `noEmit`). Nếu việc này làm `next build`/lint lỗi và không xử lý gọn được, hạ xuống kiểm thủ công và ghi lại; không thêm package. Giao diện kiểm thủ công (spec đã loại E2E tự động).

### Quyết định cho 5 nit còn lại của review spec-2 (ghi tại task liên quan)

| Nit | Quyết định cụ thể | Task |
|---|---|---|
| N1 AC-18 kết quả kép | Disconnect khi chưa nối (không có `TikTokAccount` của user) trả 404 `TikTok.NotConnected`, không 500; không idempotent 204. Lần disconnect thứ hai sau D9 rơi vào nhánh này. FE coi 404 là "đã ngắt" (AC-38). Test: lần 1 -> 204, lần 2 -> 404. | T6 |
| N2 thứ tự khi callback có `error` | Nhánh 1 (không có cookie hợp lệ) luôn xét trước, kể cả có `error` -> 302 `/login` không `error`. Qua nhánh 1 rồi mới xét `error` của TikTok: không kiểm tra tính hợp lệ của state (từ chối consent không gắn gì), chỉ hủy state nếu có và tồn tại (best effort), redirect `/dashboard?error=TikTok.AccessDenied` (khi `error=access_denied`) hoặc `TikTok.AuthFailed` (mọi `error` khác). Giá trị `error` thô từ query KHÔNG bao giờ được phản chiếu vào URL. Có `error` kèm state sai: vẫn ra `TikTok.AccessDenied/AuthFailed` (không `InvalidState`), vì không có hành động nào được thực hiện. | T5, T10 |
| N3 state khi `AlreadyLinked` | State đã bị tiêu thụ ngay từ bước `ConsumeAsync` (một lần dùng) nên không dùng lại được ở cả nhánh `UserMismatch` lẫn `AlreadyLinked`; test khẳng định `ConsumeAsync` được gọi đúng 1 lần và lần gọi thứ hai trả null (test thật trên `MemoryOAuthStateStore`). Thêm: ở `AlreadyLinked` gọi revoke best-effort token vừa nhận (tránh quyền treo bên TikTok); lỗi revoke không đổi kết quả. | T5 |
| N4 lỗi TikTok khi đổi code/userinfo | Mọi `Result` lỗi của handler (đổi code, kiểm scope, user info) được controller redirect `/dashboard?error=<Error.Code>` với `Error.Code` là hằng của BE (không phản chiếu chuỗi từ TikTok). Các mã thực tế hiện có: `TikTok.InvalidState` (TikTok `invalid_grant` khi đổi code), `TikTok.InvalidRequest`, `TikTok.OAuthError`, `TikTok.Unavailable`, `TikTok.InvalidResponse`, `TikTok.MissingRequiredScope`, `TikTok.ApiError`, `TikTok.ReconnectRequired`, `TikTok.ScopeNotGranted`, `TikTok.RateLimited`, `TikTok.InvalidParams`. FE map mã đã biết sang thông báo, mã lạ -> thông báo chung (AC-39). Test cho ít nhất: đổi code lỗi Upstream -> `TikTok.OAuthError`, `invalid_grant` -> `TikTok.InvalidState`, thiếu scope -> `TikTok.MissingRequiredScope`; mỗi cái không tạo account/credential. | T5, T10 |
| N5 đánh số AC-52 | Không sửa spec. Ma trận truy vết liệt kê AC-52 ngay sau AC-21 (nhóm B) và tên test BE dùng tiền tố `Ac52_`. | Ma trận |

Bổ sung (khoảng trống spec, plan chốt, cần chủ sản phẩm biết): khi user đã nối TikTok `open_id` X rồi nối thêm `open_id` Y khác, spec chưa nói. Plan chốt: từ chối bằng `TikTok.AlreadyConnected` (409) ở callback, redirect `/dashboard?error=TikTok.AlreadyConnected`, user phải Disconnect trước (giữ bất biến "một user một TikTok account"; `GetByAppUserIdAsync` dùng `FirstOrDefault`). FE có thông báo cho mã này. Ngoài AC; không có AC để truy vết, test thuộc T5.

## Tasks

Quy ước chung cho mọi task: làm theo TDD (test viết/cập nhật trước, thấy fail đúng lý do, rồi code); không sửa/xóa test để cho pass (chỉ các test của `StartTikTokConnect`/`CompleteTikTokConnect`/controller được sửa theo AC-20); mỗi task kết thúc bằng một commit theo Conventional Commits trên nhánh `feat/tiktok-review-plan` của repo tương ứng; sau mỗi task BE `dotnet test` toàn bộ phải xanh, sau mỗi task FE `npm run lint` và `npm run build` phải qua. Codebase luôn ở trạng thái build được giữa các task.

### Chuẩn bị

- [ ] **T0** — Chốt cách theo dõi git (xem mục trên), tạo nhánh, ghi baseline.
  - File: không sửa file sản phẩm. Tạo nhánh `feat/tiktok-review-plan` ở `CH/web` (từ `main`) và, nếu được duyệt, `git init` + commit baseline + tạo nhánh ở `CH/api`.
  - Đáp ứng: tiền đề cho AC-20, AC-46 (đo được baseline trước khi sửa).
  - Phụ thuộc: chủ sản phẩm duyệt plan và chọn phương án git cho `api/`.
  - Kiểm tra: `git -C "D:/Personal Project/ContentHub/web" branch --show-current` in `feat/tiktok-review-plan`; `git -C "D:/Personal Project/ContentHub/api" branch --show-current` cùng tên (nếu được duyệt `git init`); baseline: `node -v` (ghi phiên bản; plan giả định 24.16, cần cho `node --test` chạy `.ts` ở T12), `cd api && dotnet build && dotnet test` xanh (ghi số test), `cd web && npm run lint && npm run build` ghi kết quả (baseline đỏ nào có sẵn thì ghi lại để không bị đổ lỗi nhầm). Commit: không có (chỉ ghi chú vào mô tả commit đầu tiên của T1/T12).

### Backend

- [ ] **T1** — Cấu hình scope + allowlist: thêm NuGet Google, `AuthOptions`, `IAllowedEmailPolicy`/`AllowedEmailPolicy`, bỏ `user.info.profile` khỏi scope mặc định, dựng project test `TikTokManager.Api.Tests`.
  - File:
    - `api/src/TikTokManager.Api/TikTokManager.Api.csproj` (thêm `PackageReference Include="Microsoft.AspNetCore.Authentication.Google"`, đây là dependency mới duy nhất của dự án)
    - `api/src/TikTokManager.Api/appsettings.json` (`TikTok:Scopes` = `user.info.basic,user.info.stats,video.list`; thêm `Auth:AllowedEmails: ["hungle692002@gmail.com"]`; thêm `Authentication:Google:ClientId` và `ClientSecret` rỗng làm placeholder, không giá trị thật)
    - `api/src/TikTokManager.Api/appsettings.Development.example.json` (placeholder `Authentication:Google:ClientId: "your-google-client-id"`; ClientSecret KHÔNG nằm trong file, chỉ ghi chú qua user-secrets ở README)
    - `api/src/TikTokManager.Application/Abstractions/Ports.cs` (thêm `IAllowedEmailPolicy { bool IsAllowed(string? email); }`)
    - `api/src/TikTokManager.Infrastructure/Auth/AuthOptions.cs` (mới), `api/src/TikTokManager.Infrastructure/Auth/AllowedEmailPolicy.cs` (mới), `api/src/TikTokManager.Infrastructure/DependencyInjection.cs` (bind `Auth`, đăng ký policy singleton)
    - `api/tests/TikTokManager.Infrastructure.Tests/AllowedEmailPolicyTests.cs` (mới)
    - `api/tests/TikTokManager.Api.Tests/TikTokManager.Api.Tests.csproj` (mới; cùng package/phiên bản như `TikTokManager.Application.Tests`: coverlet.collector 6.0.4, FluentAssertions 7.2.0 (pin 7.x), Microsoft.NET.Test.Sdk 17.14.1, NSubstitute 6.2.0, xunit 2.9.3, xunit.runner.visualstudio 3.1.4; `ProjectReference` tới Api; thêm vào `TikTokManager.sln` bằng `dotnet sln add`; link `appsettings.json` của Api làm Content copy-to-output để test đọc cấu hình thật)
    - `api/tests/TikTokManager.Api.Tests/ConfigFileTests.cs` (mới; MỘT file duy nhất cho mọi test đọc file cấu hình: T1 thêm test scope, T11 thêm test không có secret vào cùng file, không tạo file thứ hai trùng việc)
  - Đáp ứng: AC-13, AC-7 (mức policy: rỗng/thiếu thì từ chối mọi email), AC-20 (nền test).
  - Phụ thuộc: T0.
  - Kiểm tra: `cd api && dotnet test --filter "FullyQualifiedName~AllowedEmailPolicyTests|FullyQualifiedName~ConfigFileTests"` xanh. Test cụ thể: policy so khớp không phân biệt hoa thường và trim khoảng trắng ở cấu hình lẫn đầu vào; allowlist rỗng, thiếu, hoặc toàn chuỗi trắng thì `IsAllowed` luôn false; email null/trắng thì false; test đọc `appsettings.json` thật xác nhận `TikTok:Scopes` tách ra đúng ba phần tử `user.info.basic`, `user.info.stats`, `video.list` và không chứa `user.info.profile`; thêm một test (Infrastructure.Tests, file mới, không sửa `TikTokOAuthClientTests`) dựng `TikTokOAuthClient` với ba scope đó và khẳng định URL authorize chứa đủ ba scope. Sau đó `cd api && dotnet build` không cảnh báo mới về package. Commit: `feat(tiktok-review-plan): add allowlist policy, Google package and 3-scope config`.

- [ ] **T2** — Domain + DB: `AppUser` có `GoogleSubject`/`Email`, EF config, migration, repo tra theo `sub`.
  - File:
    - `api/src/TikTokManager.Domain/Entities/AppUser.cs` (thêm thuộc tính, `CreateFromGoogle(subject, email, now)` validate không rỗng, `UpdateEmail(email)`; xóa `Create(now)` vì chỉ `CompleteTikTokConnect` dùng, sẽ sửa ở T5; để build được ở T2, giữ tạm `Create(now)` đánh dấu `[Obsolete]` và xóa ở T5)
    - `api/src/TikTokManager.Infrastructure/Persistence/Configurations/Configurations.cs` (`AppUserConfiguration`: `GoogleSubject` MaxLength 255 + unique index, `Email` MaxLength 320)
    - `api/src/TikTokManager.Infrastructure/Persistence/Migrations/<timestamp>_AddGoogleIdentityToAppUser.cs` + `.Designer.cs` + cập nhật `AppDbContextModelSnapshot.cs` (sinh bằng `dotnet ef migrations add AddGoogleIdentityToAppUser ...`, không sửa tay snapshot)
    - `api/src/TikTokManager.Application/Abstractions/Ports.cs` (`IAppUserRepository.GetByGoogleSubjectAsync`)
    - `api/src/TikTokManager.Infrastructure/Persistence/Repositories/Repositories.cs` (cài đặt)
    - `api/tests/TikTokManager.Application.Tests/AppUserTests.cs` (mới, kiểm tra factory/validate; project Application.Tests chưa tham chiếu Domain trực tiếp thì dùng tham chiếu bắc cầu qua Application, đã có `using TikTokManager.Domain.Entities` ở test hiện tại nên hợp lệ)
  - Đáp ứng: AC-2, AC-3 (phần dữ liệu: cột + duy nhất theo `sub`), D2.
  - Phụ thuộc: T0.
  - Kiểm tra: `cd api && dotnet build && dotnet test` (toàn bộ) xanh, trong đó `--filter "FullyQualifiedName~AppUserTests"` xanh; `cd api && docker compose up -d && dotnet tool restore && dotnet ef database update --project src/TikTokManager.Infrastructure --startup-project src/TikTokManager.Api` thành công trên DB dev (được phép xóa DB dev theo D8: `docker compose down -v` rồi `up -d` nếu migration cũ vướng dữ liệu); kiểm cột bằng `docker compose exec` vào Postgres chạy `\d app_users` thấy `GoogleSubject`, `Email`, unique index trên `GoogleSubject`. Commit: `feat(tiktok-review-plan): add Google identity columns to AppUser`.

- [ ] **T3** — Use case `SignInWithGoogle` (allowlist, `email_verified`, tạo/tìm user theo `sub`, phát JWT).
  - File:
    - `api/src/TikTokManager.Application/Features/Auth/SignInWithGoogle.cs` (mới; command `SignInWithGoogleCommand(string? Subject, string? Email, bool EmailVerified)`, result `SignInWithGoogleResult(Guid UserId, string AuthToken, DateTimeOffset ExpiresAt)`, validator FluentValidation, handler theo thứ tự P7)
    - `api/src/TikTokManager.Application/Common/ApplicationErrors.cs` (thêm `EmailNotAllowed` = `Auth.EmailNotAllowed` (Forbidden), `EmailNotVerified` = `Auth.EmailNotVerified` (Forbidden))
    - `api/src/TikTokManager.Application/DependencyInjection.cs` (đăng ký handler)
    - `api/tests/TikTokManager.Application.Tests/SignInWithGoogleTests.cs` (mới)
  - Đáp ứng: AC-2, AC-3, AC-4, AC-5, AC-7.
  - Phụ thuộc: T1, T2.
  - Kiểm tra: `cd api && dotnet test --filter "FullyQualifiedName~SignInWithGoogleTests"`. Test: email trong allowlist + verified + `sub` mới -> tạo đúng một `AppUser` với `GoogleSubject`/`Email`, `SaveChanges` một lần, token được phát cho user đó (AC-2); `sub` đã có -> không `Add`, trả cùng `UserId` (AC-3); `sub` đã có với email mới trong allowlist -> cột `Email` được cập nhật và lưu; `sub` đã có với email mới NGOÀI allowlist -> `EmailNotAllowed`, không cập nhật `Email`, không phát token (AC-3, AC-4); email ngoài allowlist -> `EmailNotAllowed`, không `Add`, không phát token, không `SaveChanges` (AC-4); email trong allowlist nhưng `EmailVerified=false` hoặc email null -> `EmailNotVerified`, không tạo user (AC-5); allowlist rỗng -> mọi email bị từ chối (AC-7); email ngoài allowlist và chưa verified -> `EmailNotAllowed` (thứ tự P7); `Subject` rỗng -> lỗi validation, không tạo user. Commit: `feat(tiktok-review-plan): add SignInWithGoogle use case`.

- [ ] **T4** — State store mang `userId`; `StartTikTokConnect` yêu cầu đăng nhập.
  - File:
    - `api/src/TikTokManager.Application/Abstractions/Ports.cs` (thêm `OAuthStateEntry(Guid UserId, string CodeVerifier)`; đổi chữ ký `IOAuthStateStore`)
    - `api/src/TikTokManager.Application/Features/Connect/StartTikTokConnect.cs` (inject `ICurrentUser`; `UserId` null -> `ApplicationErrors.Unauthenticated`, không `SaveAsync`; có user -> lưu entry kèm `userId`)
    - `api/src/TikTokManager.Infrastructure/Security/MemoryOAuthStateStore.cs` (lưu/trả entry)
    - `api/src/TikTokManager.Application/Features/Connect/CompleteTikTokConnect.cs` (chỉ sửa tối thiểu để build với chữ ký mới: dùng `entry.CodeVerifier`; phần logic đầy đủ ở T5)
    - `api/tests/TikTokManager.Application.Tests/StartTikTokConnectTests.cs` (mới)
    - `api/tests/TikTokManager.Infrastructure.Tests/MemoryOAuthStateStoreTests.cs` (mới)
    - `api/tests/TikTokManager.Application.Tests/CompleteTikTokConnectTests.cs` (chỉ sửa để biên dịch với `ConsumeAsync` trả entry; việc viết lại theo AC-14..17 làm ở T5)
  - Đáp ứng: AC-11 (mức use case: chưa đăng nhập thì không có URL TikTok và không lưu state), AC-12.
  - Phụ thuộc: T0.
  - Kiểm tra: `cd api && dotnet build && dotnet test` (toàn bộ, phải xanh vì T4 đổi port dùng chung) và riêng `dotnet test --filter "FullyQualifiedName~StartTikTokConnectTests|FullyQualifiedName~MemoryOAuthStateStoreTests|FullyQualifiedName~CompleteTikTokConnectTests"`. Test: chưa đăng nhập -> `Auth.Unauthenticated`, `oauthClient.BuildAuthorizeUrl` và `stateStore.SaveAsync` không được gọi (AC-11); đã đăng nhập -> `SaveAsync` nhận state không rỗng, entry có đúng `userId` và verifier, TTL 10 phút, URL trả về lấy từ `BuildAuthorizeUrl` với challenge tương ứng verifier (AC-12); `MemoryOAuthStateStore`: save rồi consume lần 1 trả entry đúng, consume lần 2 trả null (một lần dùng), hết TTL trả null. Commit: `feat(tiktok-review-plan): require signed-in user to start TikTok connect`.

- [ ] **T5** — Viết lại `CompleteTikTokConnect`: gắn TikTok vào user đang đăng nhập, thứ tự ưu tiên lỗi, AlreadyLinked/AlreadyConnected, không tạo user.
  - File:
    - `api/src/TikTokManager.Application/Features/Connect/CompleteTikTokConnect.cs` (command `(Code, State, ProviderError)`; bỏ `IAppUserRepository`, `IAuthTokenIssuer` khỏi handler; trả `Result` không còn token; validator chỉ kiểm `Code` khi đã qua bước state)
    - `api/src/TikTokManager.Application/Common/ApplicationErrors.cs` (thêm `UserMismatch` = `TikTok.UserMismatch` (Forbidden), `AlreadyLinked` = `TikTok.AlreadyLinked` (Conflict), `AlreadyConnected` = `TikTok.AlreadyConnected` (Conflict), `AccessDenied` = `TikTok.AccessDenied` (Validation), `AuthFailed` = `TikTok.AuthFailed` (Validation))
    - `api/src/TikTokManager.Application/DependencyInjection.cs` (đổi đăng ký kiểu trả về)
    - `api/src/TikTokManager.Api/Controllers/TikTokAuthController.cs` (SỬA TỐI THIỂU để `Api` còn build: `callback` truyền `error` vào command, bỏ `Response.Cookies.Append` và việc đọc `AuthToken/ExpiresAt`, thành công vẫn redirect `/dashboard`; hành vi redirect lỗi/`/login` đầy đủ làm ở T10)
    - `api/src/TikTokManager.Domain/Entities/AppUser.cs` (xóa hẳn `Create(now)` còn `[Obsolete]` từ T2)
    - `api/tests/TikTokManager.Application.Tests/CompleteTikTokConnectTests.cs` (sửa/viết lại có chủ đích theo AC-20; không động tới test account/videos/refresh)
  - Đáp ứng: AC-14, AC-15, AC-16, AC-17, AC-51 (connect chỉ kiểm bằng client giả), N2, N3, N4.
  - Phụ thuộc: T2, T4.
  - Kiểm tra: `cd api && dotnet build && dotnet test` (TOÀN BỘ solution gồm project Api phải build và test xanh, vì T5 đổi command/result dùng chung với controller) và riêng `dotnet test --filter "FullyQualifiedName~CompleteTikTokConnectTests"`. Thứ tự trong handler, nhánh nào khớp trước thì dừng: (a) `currentUser.UserId` null -> `Auth.Unauthenticated`, KHÔNG `ConsumeAsync`, KHÔNG gọi TikTok; (b) `ProviderError` có giá trị -> hủy state nếu `State` không rỗng (best effort), trả `AccessDenied` nếu `ProviderError == "access_denied"` còn lại `AuthFailed`; (c) `State` rỗng hoặc `ConsumeAsync` trả null -> `InvalidState`; (d) `entry.UserId != userId` -> `UserMismatch` (state đã bị consume); (e) `Code` rỗng -> lỗi validation; (f) đổi code lỗi / thiếu scope basic / user info lỗi -> trả đúng `Error` gốc (N4); (g) `GetByOpenIdAsync`: account thuộc user khác -> `AlreadyLinked` + revoke best-effort token vừa nhận, không đổi dữ liệu; (h) user hiện tại đã có account với `OpenId` khác -> `AlreadyConnected`, revoke best-effort; (i) account của chính user -> `UpdateProfile` + cập nhật hoặc thêm credential, không tạo bản trùng (AC-16 ý 3); (j) chưa có account -> `TikTokAccount.Create(userId, ...)` + credential mã hóa, KHÔNG `users.Add`, `SaveChanges` đúng 1 lần (AC-14). Test riêng cho từng nhánh AC-15 (3 test) cộng test hai điều kiện đồng thời (không cookie + state sai -> `Unauthenticated`, `ConsumeAsync` không được gọi); test `open_id` từng gắn user cũ nhưng account đã bị xóa (repo trả null) -> gắn bình thường (AC-16 ý 2); test N3: `ConsumeAsync` gọi đúng 1 lần ở nhánh `UserMismatch` và `AlreadyLinked`; các nhánh lỗi không gọi `ExchangeCodeAsync`/`SaveChanges` khi nói là không (nhánh a-e). Commit: `feat(tiktok-review-plan): attach TikTok account to the signed-in user on callback`.

- [ ] **T6** — `DisconnectTikTok` xóa luôn `TikTokAccount` (D9) và trả 404 khi chưa nối.
  - File:
    - `api/src/TikTokManager.Application/Features/Connect/DisconnectTikTok.cs` (account null -> `NotConnected`; revoke best-effort khi lấy được token (giữ logic hiện có); `accounts.Remove(account)` thay cho `RemoveCredential`)
    - `api/src/TikTokManager.Application/Abstractions/Ports.cs` (`ITikTokAccountRepository.Remove(TikTokAccount)`; có thể giữ hoặc bỏ `RemoveCredential` nếu không còn nơi dùng, kiểm bằng build)
    - `api/src/TikTokManager.Infrastructure/Persistence/Repositories/Repositories.cs` (cài `Remove`)
    - `api/tests/TikTokManager.Application.Tests/DisconnectTikTokTests.cs` (mới); `api/tests/TikTokManager.Infrastructure.Tests/AccountRemovalTests.cs` (mới; KHÔNG dùng provider EF in-memory vì là package mới ngoài danh sách; hai phần chốt: (a) test metadata: dựng `AppDbContext` bằng `UseNpgsql("Host=localhost;...")` không mở kết nối, lấy `Model.FindEntityType(typeof(TikTokAccount))`, khẳng định FK sang `TikTokCredential` có `DeleteBehavior.Cascade` (đối chiếu `Configurations.cs:36-38`) và `OpenId` có unique index; (b) test tích hợp Postgres dev đánh dấu `[Fact(Skip = ...)]` động qua điều kiện, bỏ qua khi không kết nối được DB, chèn user + account + credential, gọi `Remove` + `SaveChanges`, rồi `Count` cả hai bảng của user bằng 0. Việc xóa dòng thật trên DB dev còn được kiểm lại ở T20 bằng `SELECT count(*) FROM tiktok_accounts WHERE "AppUserId" = '<id>'` và tương tự `tiktok_credentials` (= 0 sau disconnect))
  - Đáp ứng: AC-18, AC-16 (ý 2: `open_id` được giải phóng), N1.
  - Phụ thuộc: T2.
  - Kiểm tra: `cd api && dotnet build && dotnet test` (toàn bộ) xanh, trong đó `--filter "FullyQualifiedName~DisconnectTikTokTests|FullyQualifiedName~AccountRemovalTests"` xanh. Test: đã nối -> `Result.Success`, `accounts.Remove(account)` được gọi, `SaveChanges` 1 lần; revoke lỗi hoặc không lấy được token -> vẫn xóa và thành công; chưa đăng nhập -> `Unauthenticated`; chưa nối (repo trả null) -> `NotConnected` (404), không 500, không `SaveChanges` (N1). Test metadata (a) bảo đảm cascade; test tích hợp (b) chạy khi có DB. Commit: `feat(tiktok-review-plan): delete TikTok account on disconnect`.

- [ ] **T7** — `GET /api/me` trả thêm `email`.
  - File:
    - `api/src/TikTokManager.Application/Features/Me/GetMe.cs` (`MeDto(UserId, CreatedAt, Email, IsTikTokConnected, TikTokDisplayName)`; `Email` lấy từ `AppUser.Email`)
    - `api/tests/TikTokManager.Application.Tests/GetMeTests.cs` (mới)
  - Đáp ứng: AC-9 (phần `email`, `isTikTokConnected=false` và `tikTokDisplayName=null` khi chưa nối).
  - Phụ thuộc: T2.
  - Kiểm tra: `cd api && dotnet build && dotnet test` (toàn bộ, vì `MeDto` đổi) xanh, trong đó `--filter "FullyQualifiedName~GetMeTests"`. Test: user chưa nối -> `IsTikTokConnected=false`, `TikTokDisplayName=null`, `Email` đúng; đã nối (credential khác null) -> `true` và display name; account tồn tại nhưng credential null -> `false`; user không tồn tại -> `Unauthenticated`. Kiểm tra JSON camelCase ở T11. Commit: `feat(tiktok-review-plan): expose email in /api/me`.

- [ ] **T8** — Nối Google vào pipeline: cookie ngoài, `AddGoogle`, kiểm tra cấu hình khi khởi động, endpoint `google/login`.
  - File:
    - `api/src/TikTokManager.Api/Auth/GoogleAuthSetup.cs` (mới; `AddGoogleSignIn(builder)` đăng ký cookie `tm_external` (HttpOnly, Secure Always, SameSite Lax, hạn 5 phút) và `AddGoogle` với `SignInScheme = "tm_external"`, `CallbackPath = /api/auth/google/callback`, scope `openid email profile`, `SaveTokens=false`, `MapJsonKey("email_verified", ...)`; hàm thuần chữ ký cố định `static IReadOnlyList<string> MissingConfigurationKeys(string? clientId, string? clientSecret, IReadOnlyCollection<string>? allowedEmails)` chỉ trả danh sách TÊN khóa thiếu (`Authentication:Google:ClientId`, `Authentication:Google:ClientSecret`, `Auth:AllowedEmails`), KHÔNG biết môi trường; hành vi theo môi trường do `Program` quyết: danh sách rỗng -> đăng ký Google; danh sách khác rỗng và Development -> không đăng ký scheme Google, log cảnh báo tên khóa; danh sách khác rỗng và không phải Development -> ném `InvalidOperationException` kèm tên khóa. Phần quyết định này cũng nằm trong một hàm thuần thứ hai `static StartupDecision Decide(bool isDevelopment, IReadOnlyList<string> missing)` (enum `RegisterGoogle | SkipGoogle | FailFast`) để test được)
    - `api/src/TikTokManager.Api/Controllers/GoogleAuthController.cs` (mới; action `GET api/auth/google/login` `[AllowAnonymous]`: scheme không tồn tại -> 503 problem+json `Auth.GoogleNotConfigured`; có -> `Challenge` với `RedirectUri = /api/auth/google/exchange` và `prompt=select_account`)
    - `api/src/TikTokManager.Api/Program.cs` (gọi setup trước `Build()`; không đăng ký scheme Google nếu Development thiếu cấu hình; ném `InvalidOperationException` ở môi trường khác khi thiếu; đăng ký `IAllowedEmailPolicy` đã có từ T1)
    - `api/tests/TikTokManager.Api.Tests/GoogleAuthSetupTests.cs` (mới), `api/tests/TikTokManager.Api.Tests/GoogleLoginEndpointTests.cs` (mới)
  - Đáp ứng: AC-1 (hành vi redirect kiểm ở T11), AC-8.
  - Phụ thuộc: T1.
  - Kiểm tra: `cd api && dotnet test --filter "FullyQualifiedName~GoogleAuthSetupTests|FullyQualifiedName~GoogleLoginEndpointTests"`. Test tách hai nhánh: (1) `MissingConfigurationKeys`: đủ cấu hình -> rỗng; thiếu ClientId, thiếu ClientSecret, allowlist rỗng/null/toàn khoảng trắng -> trả đúng tên khóa tương ứng và không chứa giá trị truyền vào; (2) `Decide`: Development + có khóa thiếu -> `SkipGoogle`; non-Development (Staging, Production) + có khóa thiếu -> `FailFast`; không thiếu -> `RegisterGoogle` ở cả hai môi trường; controller với `IAuthenticationSchemeProvider` giả không có scheme "Google" -> 503, `ProblemDetails.Extensions["code"] == "Auth.GoogleNotConfigured"`, không lộ tên giá trị cấu hình; có scheme -> trả `ChallengeResult` với `RedirectUri` đúng và `prompt=select_account`. Thủ công (có thể làm ở T11): chạy BE Development không có secret Google -> khởi động, `/health` 200, `google/login` 503 problem+json. Commit: `feat(tiktok-review-plan): wire Google sign-in and startup config validation`.

- [ ] **T9** — Callback Google: action `exchange`, `OnRemoteFailure`, `AuthCookie` helper, ghi đè phiên (AC-52).
  - File:
    - `api/src/TikTokManager.Api/Auth/AuthCookie.cs` (mới; chứa `Name = "tm_auth"`, `Append(response, token, expiresAt)`, `Delete(response)` với đúng thuộc tính hiện có: HttpOnly, Secure, SameSite Lax, Path `/`, IsEssential)
    - `api/src/TikTokManager.Api/Controllers/GoogleAuthController.cs` (action `GET api/auth/google/exchange` `[AllowAnonymous]`: `AuthenticateAsync("tm_external")`; thất bại -> `/login?error=google_failed`; đọc `sub` (`ClaimTypes.NameIdentifier`), `email`, `email_verified`; gọi `ICommandHandler<SignInWithGoogleCommand, SignInWithGoogleResult>`; thành công -> `AuthCookie.Append` + 302 `{Frontend:Url}/dashboard`; lỗi -> ánh xạ P7, KHÔNG gọi `AuthCookie.Delete`/`Append`; luôn `SignOutAsync("tm_external")` rồi redirect; không log claim/token; mọi exception -> `google_failed`, không 500)
    - `api/src/TikTokManager.Api/Auth/GoogleAuthSetup.cs` (thêm `Events.OnRemoteFailure`: lấy `context.Failure?.Data["error"]`; `access_denied` -> redirect `/login?error=access_denied`, còn lại `google_failed`; `HandleResponse()`; không log URL có `code`; ghi chú: implementer xác nhận khóa `Data["error"]` bằng thử thực tế vì đây là chi tiết của handler OAuth ở bản 10.x)
    - `api/src/TikTokManager.Api/Program.cs` (đổi `TikTokAuthController.AuthCookieName` sang `AuthCookie.Name`)
    - `api/tests/TikTokManager.Api.Tests/GoogleExchangeTests.cs` (mới)
  - Đáp ứng: AC-2, AC-4, AC-5, AC-6, AC-52.
  - Phụ thuộc: T3, T8.
  - Kiểm tra: `cd api && dotnet test --filter "FullyQualifiedName~GoogleExchangeTests"`. Dùng `DefaultHttpContext` với `RequestServices` giả `IAuthenticationService`. Test: claim hợp lệ + handler thành công -> Response có `Set-Cookie` `tm_auth` với HttpOnly, Secure, SameSite=Lax, hạn bằng `ExpiresAt`, 302 tới `{Frontend:Url}/dashboard` (AC-2); handler trả `EmailNotAllowed` -> 302 `/login?error=email_not_allowed`, không có `Set-Cookie` cho `tm_auth` (AC-4); `EmailNotVerified` -> `email_not_verified` (AC-5); authenticate thất bại, thiếu `sub`, handler ném exception -> `google_failed`, không 500; OnRemoteFailure với `error=access_denied` -> `access_denied`, với correlation failed -> `google_failed` (AC-6); AC-52: request đã mang cookie `tm_auth` của user A + callback thành công -> phát cookie mới (khác giá trị), user theo `sub` vừa đăng nhập; request mang cookie cũ + callback thất bại -> không có bất kỳ header `Set-Cookie` nào đụng `tm_auth` (không đổi, không xóa); `tm_external` luôn bị xóa. Commit: `feat(tiktok-review-plan): handle Google callback and issue session cookie`.

- [ ] **T10** — Sửa `TikTokAuthController` và `JwtBearer` challenge: connect cần đăng nhập, callback gắn user, lỗi về `/dashboard`, logout, 401 problem+json.
  - File:
    - `api/src/TikTokManager.Api/Controllers/TikTokAuthController.cs` (`connect`: lỗi `Auth.Unauthenticated` -> 302 `{Frontend:Url}/login` không tham số `error`; lỗi khác -> `/dashboard?error=<code>`; `callback`: nhận `code`, `state`, `error`, gọi handler mới, KHÔNG set cookie `tm_auth` nữa (cookie do Google đăng nhập phát), `Unauthenticated` -> 302 `/login` không `error`, mọi lỗi khác -> 302 `{Frontend:Url}/dashboard?error=<Error.Code>` (N4), thành công -> 302 `{Frontend:Url}/dashboard`; xóa route `/connect`; `logout` dùng `AuthCookie.Delete`; bỏ hằng `AuthCookieName`)
    - `api/src/TikTokManager.Api/Auth/JwtChallenge.cs` (mới; lớp tĩnh `JwtChallenge.WriteUnauthenticatedAsync(JwtBearerChallengeContext)`: `HandleResponse()`, status 401, `application/problem+json` với `code = Auth.Unauthenticated`, `title` = code)
    - `api/src/TikTokManager.Api/Program.cs` (chỉ gắn `Events.OnChallenge = JwtChallenge.WriteUnauthenticatedAsync`, không để logic inline để test được bằng `DefaultHttpContext` mà không cần `WebApplicationFactory`)
    - `api/tests/TikTokManager.Api.Tests/TikTokAuthControllerTests.cs` (mới), `api/tests/TikTokManager.Api.Tests/UnauthenticatedProblemTests.cs` (mới; gọi thẳng `JwtChallenge`)
  - Đáp ứng: AC-11, AC-15 (ánh xạ 3 nhánh sang URL), AC-17, AC-19, AC-10, AC-14 (redirect thành công).
  - Phụ thuộc: T4, T5, T6, T9.
  - Kiểm tra: `cd api && dotnet build && dotnet test` (toàn bộ) xanh, trong đó `--filter "FullyQualifiedName~TikTokAuthControllerTests|FullyQualifiedName~UnauthenticatedProblemTests"`. Test: connect với handler trả `Unauthenticated` -> `RedirectResult` tới `{Frontend:Url}/login` đúng bằng, không có `?error` (AC-11); connect thành công -> redirect tới URL do handler trả; callback: `Unauthenticated` -> `/login` không error (nhánh 1); `InvalidState` -> `/dashboard?error=TikTok.InvalidState` (nhánh 2); `UserMismatch` -> `/dashboard?error=TikTok.UserMismatch` (nhánh 3); `AlreadyLinked` -> `/dashboard?error=TikTok.AlreadyLinked`; `AccessDenied` -> `/dashboard?error=TikTok.AccessDenied` (AC-17); thành công -> `/dashboard` và không có `Set-Cookie`; logout -> 204 và `Set-Cookie` xóa `tm_auth` (AC-19); `OnChallenge` ghi 401, `Content-Type: application/problem+json`, body JSON có `code = Auth.Unauthenticated` (AC-10). `GET /api/me` ngay sau logout trả 401 kiểm ở T11. Commit: `feat(tiktok-review-plan): rework TikTok connect/callback/logout for signed-in users`.

- [ ] **T11** — Chốt BE: build sạch, toàn bộ test xanh, smoke bằng curl (các AC không test tự động được).
  - File: không sửa code (nếu phát hiện lỗi thì sửa ở đúng task gốc rồi chạy lại). Thêm vào CÙNG file `api/tests/TikTokManager.Api.Tests/ConfigFileTests.cs` đã tạo ở T1 (không tạo file mới) các test khẳng định `appsettings.json` và `appsettings.Development.example.json` không có giá trị cho `ClientSecret`/`Jwt:Key`).
  - Đáp ứng: AC-20, AC-21 (kiểm CORS), AC-1/AC-8/AC-9/AC-10/AC-19 (smoke), AC-49 (phần: không secret trong file mẫu).
  - Phụ thuộc: T1-T10.
  - Kiểm tra: `cd api && dotnet build && dotnet test` toàn bộ xanh; test của account, videos, refresh (`GetMyTikTokVideosTests`, `TikTokAccessTokenProviderTests`, `TikTokDisplayApiClientTests`, `TikTokOAuthClientTests`) không bị sửa (`git diff --stat main -- tests/TikTokManager.Infrastructure.Tests tests/TikTokManager.Application.Tests/GetMyTikTokVideosTests.cs` trong repo api xác nhận chỉ có các file test được phép; ở phương án git dự phòng dùng `diff -r -q` với bản sao lưu `ContentHub-backup/api-baseline`). Smoke (BE chạy profile https, `dotnet dev-certs https --trust` đã chạy, secret chỉ qua env/user-secrets, ClientId/ClientSecret Google DÙNG GIÁ TRỊ GIẢ cho phần này vì chỉ cần thấy redirect): `curl -sk -i https://localhost:7031/api/auth/google/login` -> 302, `Location` bắt đầu `https://accounts.google.com/`, chứa `client_id=`, `scope=openid%20email%20profile` (hoặc `+`), `state=`, `redirect_uri=https%3A%2F%2Flocalhost%3A7031%2Fapi%2Fauth%2Fgoogle%2Fcallback` (AC-1); không cấu hình Google -> BE vẫn lên, `/health` 200, `google/login` 503 problem+json (AC-8); `curl -sk -i https://localhost:7031/api/me` -> 401 `application/problem+json` có `"code":"Auth.Unauthenticated"` (AC-10); `curl -sk -i -H "Origin: http://localhost:3000" https://localhost:7031/health` có `Access-Control-Allow-Origin: http://localhost:3000` và `Access-Control-Allow-Credentials: true`; với `-H "Origin: http://evil.example"` KHÔNG có header `Access-Control-Allow-Origin` (AC-21); `curl -sk -i https://localhost:7031/api/auth/tiktok/connect` -> 302 `Location: http://localhost:3000/login` (AC-11). Ghi kết quả vào mô tả commit. Commit: `test(tiktok-review-plan): BE checkpoint` (nếu có thay đổi file) hoặc không commit.

- [ ] **T11b** — Spike cookie (RK1): cookie `tm_auth` Lax+Secure đặt từ `https://localhost:7031` có được gửi trong `fetch(..., {credentials:"include"})` từ `http://localhost:3000` trên Chrome/Edge không. Không cần Google thật. Phải xong TRƯỚC T12-T18.
  - File: không commit code sản phẩm. Dùng một thay đổi tạm, KHÔNG commit và được hoàn tác sau spike (`git checkout -- <file>` hoặc xóa khỏi `api/src/TikTokManager.Api/Program.cs`): endpoint `GET /api/dev/spike-cookie` chỉ khi `IsDevelopment()`, `[AllowAnonymous]`, phát JWT cho một `AppUser` chèn tay vào DB dev (dùng `IAuthTokenIssuer` + `AuthCookie.Append`, `Jwt:Key` qua user-secrets). Kết quả ghi vào `web/docs/features/tiktok-review-plan/spike-cookie.md` (commit `docs(tiktok-review-plan): record cookie spike result`; không chứa token, chỉ ghi trình duyệt/phiên bản và đạt/không đạt).
  - Đáp ứng: giảm RK1; tiền đề cho AC-47, AC-23/AC-25/AC-26/AC-30 (mọi hành vi FE phụ thuộc cookie gửi được).
  - Phụ thuộc: T10, T11.
  - Kiểm tra: chạy BE `--launch-profile https` và FE `npm run dev`. (1) Trên Chrome rồi Edge, điều hướng toàn trang tới `https://localhost:7031/api/dev/spike-cookie` (giống cách callback Google thật đặt cookie); xác nhận cookie `tm_auth` xuất hiện (DevTools Application, HttpOnly, Secure, Lax). (2) Mở `http://localhost:3000`, trong Console chạy `fetch("https://localhost:7031/api/me",{credentials:"include"}).then(r=>r.status)`. Tiêu chí đạt = trả 200 (request `/api/me` mang cookie `tm_auth`, kiểm ở tab Network cột Cookies). Nếu 401: quyết định TRƯỚC khi làm T12-T16, rồi lặp lại spike với phương án đã chọn: (A) chạy FE bằng `next dev --experimental-https` (đọc docs Next trong `node_modules`), `Frontend:Url=https://localhost:3000`, `NEXT_PUBLIC_API_URL` giữ `https://localhost:7031`; hoặc (B) `SameSite=None; Secure` chỉ ở Development trong `AuthCookie`. Chọn A trước (không đổi mô hình bảo mật); cả hai đều đổi D1 của spec nên PHẢI báo chủ sản phẩm và ghi quyết định vào `spike-cookie.md`; T12 (script/`.env.example`), T9/T10 (`AuthCookie`) và T19 (README) áp dụng quyết định này. Sau spike chạy `git status` ở `api` để chắc chắn endpoint tạm đã bị gỡ và `cd api && dotnet build && dotnet test` xanh.

### Frontend

(Tất cả task FE bắt đầu sau T11b để biết trước mô hình cookie/scheme của dev. Các bước kiểm thủ công tích hợp cần T11 xong. Mỗi task FE phải đọc docs Next trong `node_modules/next/dist/docs/` trước khi viết.)

- [ ] **T12** — Lớp gọi API, biến môi trường, test logic thuần, không thêm package.
  - File:
    - `web/src/lib/api/config.ts` (mới; `API_URL = process.env.NEXT_PUBLIC_API_URL`, không có giá trị mặc định ngầm sai; helper `apiUrl(path)`, `googleLoginUrl()`, `tiktokConnectUrl()`)
    - `web/src/lib/api/problem.ts` (mới; kiểu `ApiError { status, code, title }`, hàm `parseError(res)` đọc `application/problem+json`; body khác problem+json, JSON hỏng, lỗi mạng -> `ApiError` chung `{ status: 0 hoặc status thật, code: "Network.Unknown", title: "Network/unknown error" }`, không throw không bắt)
    - `web/src/lib/api/client.ts` (mới; `apiFetch` luôn `credentials: "include"`; không đọc/lưu token; trả `Result` hoặc throw `ApiError` có kiểu, một cách thống nhất)
    - `web/src/lib/api/types.ts` (mới; `Me`, `TikTokAccount`, `Video`, `VideoPage` đúng contract camelCase, field có thể `null`)
    - `web/src/lib/api/endpoints.ts` (mới; `getMe`, `getAccount`, `getVideos(cursor, maxCount=20)`, `disconnectTikTok`, `logout`)
    - `web/src/lib/api/problem.test.ts`, `web/src/lib/api/client.test.ts` (mới; chạy bằng `node --test`)
    - `web/package.json` (thêm script `"test": "node --test"`; không thêm dependency), `web/tsconfig.json` (`allowImportingTsExtensions: true` nếu cần theo P16)
    - `web/.env.example` (thêm `NEXT_PUBLIC_API_URL=https://localhost:7031`), `web/.gitignore` (thêm `!.env.example`)
  - Đáp ứng: AC-28, AC-29.
  - Phụ thuộc: T0, T11b (quyết định scheme/cookie của dev có thể đổi script `dev` và `.env.example`).
  - Kiểm tra: `cd web && npm test` xanh (test: problem+json hợp lệ -> `status/code/title` đúng; text/HTML body, JSON hỏng, `fetch` ném lỗi -> `ApiError` chung "Network/unknown error"; mọi request truyền `credentials: "include"` và URL bắt đầu bằng `NEXT_PUBLIC_API_URL`); `cd web && npm run lint && npm run build` qua; `git -C web check-ignore .env.example` KHÔNG in gì (không còn bị ignore) và `git -C web status --short` hiện `.env.example` là file mới. Commit: `feat(tiktok-review-plan): add typed API client`.

- [ ] **T13** — Theme sáng/tối không nháy + khung trang (header có nút theme và "Sign in", footer có Terms/Privacy trên mọi trang).
  - File:
    - `web/src/app/layout.tsx` (script chống flash trong `<head>`, `suppressHydrationWarning` trên `<html>`, bọc `SiteHeader` + `children` + `SiteFooter`)
    - `web/src/app/globals.css` (`@custom-variant dark`, biến màu theo class `.dark`, bỏ `@media (prefers-color-scheme)` hoặc giữ làm giá trị mặc định tương đương script; kiểm tra tương phản)
    - `web/src/components/ThemeToggle.tsx` (mới, client; lưu `localStorage["theme"]` chỉ giá trị `light|dark`, nút có `aria-label`)
    - `web/src/components/SiteHeader.tsx`, `web/src/components/SiteFooter.tsx` (mới; footer luôn thấy link "Terms" -> `/terms` và "Privacy" -> `/privacy`)
    - `web/src/components/LegalLayout.tsx` (điều chỉnh bố cục nếu header/footer trùng lặp)
  - Đáp ứng: AC-42, AC-43, AC-22 (một phần: khung chung, nội dung tiếng Anh).
  - Phụ thuộc: T11b.
  - Kiểm tra: `cd web && npm run lint && npm run build`. Thủ công (AC-42 là kiểm tra thủ công theo spec): `npm run dev`, mở `/`, `/login` (sau T14), `/dashboard` (sau T15), `/terms`, `/privacy`: nút theme đổi class trên `<html>` và giữ sau reload; lần đầu theo `prefers-color-scheme` (đổi thiết lập OS/DevTools Rendering để thử); hard reload (Ctrl+Shift+R) ở dark và ở light quan sát bằng Performance panel với CPU throttle 6x: không có khung hình sai theme; Lighthouse Accessibility/DevTools contrast >= 4.5:1 cho chữ chính và chữ trên nút ở cả hai theme trên landing, login, dashboard; footer thấy ngay link Terms/Privacy trên cả 5 trang (AC-43). Commit: `feat(tiktok-review-plan): add theme toggle, header and footer`.

- [ ] **T14** — Trang `/login`: nút Sign in with Google, thông báo lỗi, chuyển hướng nếu đã đăng nhập.
  - File:
    - `web/src/app/login/page.tsx` (mới; server component mỏng, bọc `<Suspense>` quanh phần dùng `useSearchParams`, `metadata.title = "Sign in"`)
    - `web/src/components/login/LoginView.tsx` (mới, client; gọi `getMe`: 200 -> `router.replace("/dashboard")` (AC-26), 401 -> hiện form; nút điều hướng toàn trang tới `googleLoginUrl()` bằng `window.location.assign` hoặc thẻ `<a href>`, KHÔNG fetch/XHR (AC-23))
    - `web/src/lib/api/messages.ts` (mới; `loginErrorMessage(code)`: `email_not_allowed` ("This Google account is not allowed to use this app." không nhắc email nào), `email_not_verified`, `google_failed`, `access_denied`, `session_expired` ("Your session has expired. Please sign in again."), mã lạ -> thông báo chung; không bao giờ in mã thô) và `web/src/lib/api/messages.test.ts`
  - Đáp ứng: AC-22 (route `/login`), AC-23, AC-24, AC-26.
  - Phụ thuộc: T12, T13.
  - Kiểm tra: `cd web && npm test` (map thông báo: mỗi mã biết ra đúng chuỗi, mã lạ ra chuỗi chung, không chuỗi nào chứa `@`) và `npm run lint && npm run build`. Thủ công: mở `/login?error=email_not_allowed` rồi `email_not_verified`, `google_failed`, `access_denied`, `foo` -> đúng thông báo, không stack trace/mã thô; DevTools Network khi bấm nút thấy một điều hướng document tới `{API}/api/auth/google/login`, không có request fetch/xhr; có phiên hợp lệ (sau T11) mở `/login` -> về `/dashboard`. Commit: `feat(tiktok-review-plan): add login page`.

- [ ] **T15** — Dashboard khung: guard, trạng thái chưa nối, Sign out, thông báo `?error=`, xử lý 401.
  - File:
    - `web/src/app/dashboard/page.tsx` (mới; `<Suspense>` + `metadata`)
    - `web/src/components/dashboard/DashboardView.tsx` (mới, client; `useSession` gọi `getMe` một lần; 401 -> `router.replace("/login?error=session_expired")`; loading -> khung trung tính, không render dữ liệu; hiện email của chính user và "TikTok not connected" + nút "Connect TikTok" (điều hướng toàn trang tới `tiktokConnectUrl()`) + nút "Sign out" (gọi `logout` rồi `router.replace("/login")`); khi `isTikTokConnected=false` không gọi `/api/me/tiktok/*`)
    - `web/src/lib/api/useSession.ts` (mới), `web/src/components/dashboard/ErrorBanner.tsx` (mới)
    - `web/src/lib/api/messages.ts` và `.test.ts` (thêm `dashboardErrorMessage(code)` cho `TikTok.InvalidState`, `TikTok.UserMismatch`, `TikTok.AlreadyLinked`, `TikTok.AlreadyConnected`, `TikTok.AccessDenied`, `TikTok.AuthFailed`, `TikTok.MissingRequiredScope`, `TikTok.OAuthError`, `TikTok.Unavailable`, mã lạ -> thông báo chung)
    - đọc `?error=` bằng `useSearchParams` rồi `router.replace("/dashboard")` xóa tham số (P15)
  - Đáp ứng: AC-25, AC-27, AC-30, AC-39, AC-40 (Sign out), AC-41, AC-22 (route `/dashboard`).
  - Phụ thuộc: T12, T13.
  - Kiểm tra: `cd web && npm test && npm run lint && npm run build`. Thủ công với BE chạy (sau T11): chưa đăng nhập mở `/dashboard` -> chỉ thấy khung loading trung tính rồi về `/login`, không thấy dữ liệu (AC-25); đã đăng nhập: thấy email của mình, "TikTok not connected", nút Connect/Sign out, Network không có request `/api/me/tiktok/*` (AC-30); mở `/dashboard?error=TikTok.AlreadyLinked` và `?error=zzz` -> thông báo tương ứng/chung, URL tự thành `/dashboard`, reload không hiện lại (AC-39); xóa cookie `tm_auth` thủ công (hoặc chờ hết hạn) rồi thao tác -> về `/login` kèm "Your session has expired. Please sign in again." (AC-27); Sign out -> `/login`, quay lại `/dashboard` bị đẩy về `/login` (AC-40); màn hình không hiện token, `openId` hay email khác (AC-41). Commit: `feat(tiktok-review-plan): add dashboard shell with session guard`.

- [ ] **T16** — Dashboard khi đã nối TikTok: account, stats, lưới video, Load more, các trạng thái lỗi, Disconnect.
  - File:
    - `web/src/components/dashboard/AccountCard.tsx` (mới; avatar (`<img>`), display name, follower/following/likes/video count; ẩn `username`, `bioDescription`, `isVerified` khi `null`, không in "null"/"undefined"; nút "Disconnect TikTok")
    - `web/src/components/dashboard/VideoGrid.tsx`, `VideoCard.tsx` (mới; cover `<img>` có `onError` đổi sang ô placeholder (đặt `// eslint-disable-next-line @next/next/no-img-element` có lý do: URL cover ngoài miền, hết hạn), title hoặc description rút gọn, ngày đăng, view/like/comment/share, link `shareUrl` nếu có; trạng thái trống "No public videos found for this account."; nút "Load more" gọi `getVideos(cursor, 20)`, nối cuối danh sách, `disabled` trong lúc tải, ẩn khi `hasMore=false`)
    - `web/src/components/dashboard/ConnectionBanner.tsx` (mới; 409 `TikTok.ReconnectRequired` -> banner "TikTok connection expired" + "Reconnect TikTok"; 403 `TikTok.ScopeNotGranted` -> thông báo cấp lại quyền + Reconnect; 404 `TikTok.NotConnected` -> chuyển về trạng thái chưa nối; lỗi khác/mạng -> thông báo chung + "Retry")
    - `web/src/components/dashboard/DisconnectButton.tsx` (mới; bước xác nhận hai bước nội tuyến, không thêm thư viện; xác nhận -> `disconnectTikTok()`; 204 hoặc 404 -> chuyển sang trạng thái chưa nối)
    - `web/src/components/dashboard/DashboardView.tsx` (nối các phần; phần còn lại của trang vẫn dùng được khi một khối lỗi)
    - `web/src/lib/format.ts` và `format.test.ts` (định dạng số/ngày, rút gọn text; logic thuần để test)
  - Đáp ứng: AC-31, AC-32, AC-33, AC-34, AC-35, AC-36, AC-37, AC-38, AC-40 (Disconnect), AC-41.
  - Phụ thuộc: T15.
  - Kiểm tra: `cd web && npm test && npm run lint && npm run build`. Thủ công (kiểm hình dạng UI bằng cách giả lập phản hồi, vì lát này không chạy luồng TikTok thật (AC-51): dùng BE thật với một user có `TikTokAccount` được chèn tạm vào DB dev hoặc đặt chặn/giả phản hồi trong DevTools "Override content"/local mock; không đưa dữ liệu giả vào repo): account đủ field -> thấy avatar, tên, bốn số; `username/bio/isVerified=null` -> ẩn, không có chữ "null"/"undefined" (AC-32); video có đủ thông tin và link; Load more nối thêm và gọi đúng `videos?cursor=<cursor>&maxCount=20`, nút bị khóa khi đang tải (nhấn nhanh hai lần chỉ có một request), ẩn khi `hasMore=false` (AC-34); danh sách rỗng -> câu trống (AC-35); cover URL sai -> placeholder, layout không vỡ (AC-36); chặn response thành 409/404/403/500/offline -> đúng banner/Retry (AC-37, AC-38); Disconnect có bước xác nhận, sau đó về trạng thái chưa nối (AC-40). Commit: `feat(tiktok-review-plan): connected dashboard with account and video grid`.

- [ ] **T17** — Landing `/`: nút Sign in, mô tả đầy đủ và đúng thực tế.
  - File: `web/src/app/page.tsx` (viết lại), có thể thêm `web/src/components/landing/*`, `web/src/lib/site.ts` (nếu cần thêm hằng; `owner`, `contactEmail` đã có)
  - Đáp ứng: AC-44, AC-22 (route `/`, tiếng Anh).
  - Phụ thuộc: T13.
  - Kiểm tra: `cd web && npm run lint && npm run build`; thủ công đối chiếu từng gạch của AC-44 trên trang: nút "Sign in" tới `/login` ở header hoặc hero; app là gì và dành cho ai (công cụ riêng của chủ kênh); tính năng hiện có (chỉ: đăng nhập Google giới hạn allowlist, nối TikTok, xem account/stats, xem danh sách video, ngắt kết nối, đăng xuất); danh sách dữ liệu TikTok theo từng scope (`user.info.basic` = tên + avatar; `user.info.stats` = số follower/following/likes/video; `video.list` = danh sách video public + view/like/comment/share); cách ngắt kết nối và xóa dữ liệu; tên chủ sở hữu và email liên hệ từ `site`. Không còn câu hứa ý tưởng/kịch bản, lịch, AI. Commit: `feat(tiktok-review-plan): rewrite landing page`.

- [ ] **T18** — Privacy và Terms khớp thực tế.
  - File: `web/src/app/privacy/page.tsx`, `web/src/app/terms/page.tsx`, `web/src/lib/site.ts` (cập nhật `lastUpdated`)
  - Đáp ứng: AC-45.
  - Phụ thuộc: T13 (khung trang), nên làm sau T6 để câu về Disconnect đúng thực tế.
  - Kiểm tra: `cd web && npm run lint && npm run build`; đối chiếu AC-45 (a)-(e) bằng đọc: (a) Google dùng email/tên/ảnh để xác minh chủ sở hữu, truy cập giới hạn theo allowlist; (b) liệt kê đúng ba scope và mục đích từng scope; (c) token TikTok lưu mã hóa, ngắt kết nối thì revoke và xóa; (d) xóa mục "Content entered by the Owner" (ý tưởng, kịch bản, lịch, file import), mục AI provider và "file storage" ở phần 2 và 3, bỏ "tokens issued by ... Google" (BE không lưu token Google) ở phần 4; (e) giữ nguyên câu "Disconnecting TikTok deletes the stored TikTok tokens and the TikTok data obtained through them" (hiện ở `privacy/page.tsx` mục 5). Terms: bỏ mục "AI-generated suggestions" và các mô tả tính năng chưa có. `grep -n -i "AI\b\|file storage\|script\|calendar" web/src/app/privacy/page.tsx web/src/app/terms/page.tsx` không còn khẳng định tính năng chưa tồn tại. Commit: `docs(tiktok-review-plan): align privacy policy and terms with the product`.

### Tài liệu và nghiệm thu

- [ ] **T19** — Cập nhật tài liệu và contract (chỉ làm ở bước implement theo spec).
  - File:
    - `CH/CLAUDE.md` (contract: thêm `GET /api/auth/google/login` và callback Google, `connect` yêu cầu đăng nhập (302 `/login` nếu chưa), `/api/me` có `email`, lỗi connect về `/dashboard?error=`, bỏ route `/connect`, bỏ `user.info.profile` ở mục scope, disconnect xóa luôn account, bảng mã lỗi mới, phần cookie/domain nêu cùng host `localhost`, cập nhật "Trạng thái hiện tại" và danh sách FE; không có secret)
    - `web/CLAUDE.md` (thay toàn bộ TODO: sản phẩm, stack, lệnh `npm install` / `npm test` / `npm run lint` / `npm run build` / `npm run dev`, quy ước (đọc docs Next trong `node_modules`, UI tiếng Anh, không token trong JS), nhánh chính `main`)
    - `web/README.md` (thay nội dung create-next-app: chạy local ngắn, biến `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_APP_NAME`, `NEXT_PUBLIC_CONTACT_EMAIL`)
    - `api/README.md` (endpoint Google, cấu hình `Authentication:Google:ClientId`/`ClientSecret` qua user-secrets (`dotnet user-secrets set "Authentication:Google:ClientSecret" "<client secret>"`), `Auth:AllowedEmails`, redirect URI cần đăng ký ở Google Cloud Console `https://localhost:7031/api/auth/google/callback`, `dotnet dev-certs https --trust`, ghi chú Safari/ITP và cookie Secure, mục scope bỏ profile, sửa endpoint table và dòng "lỗi → /connect", ghi project test mới)
    - `api/src/TikTokManager.Api/appsettings.Development.example.json`, `web/.env.example` (đã làm ở T1, T12; rà lại)
  - Nơi lưu `CH/CLAUDE.md`: file này nằm ngoài cả hai repo nên không có commit. Sau khi sửa, chép nguyên bản đã cập nhật vào `web/docs/features/tiktok-review-plan/contract-update.md` (commit trong `web`, không secret) để có lịch sử và reviewer đọc được; chủ sản phẩm tự sao lưu `CH/CLAUDE.md` gốc trước khi sửa (hoặc nếu `api/` đã `git init`, không giúp được vì file ở thư mục cha).
  - Đáp ứng: AC-49, AC-50.
  - Phụ thuộc: T11, T11b, T18 (nội dung cuối cùng của FE/BE đã ổn định).
  - Kiểm tra: `grep -rn "TODO" web/CLAUDE.md` rỗng; `grep -rn "/connect?error\|user.info.profile" CH/CLAUDE.md CH/api/README.md web/CLAUDE.md` không còn nhắc như hiện hành (cho phép nhắc trong ngữ cảnh lịch sử đã ghi rõ); dò secret: `grep -rniE "client_?secret\"?\s*[:=]\s*\"[^\"<]" CH/CLAUDE.md CH/api/README.md CH/api/src/TikTokManager.Api/appsettings*.json web/.env.example web/CLAUDE.md web/README.md` không ra giá trị thật; người đọc làm theo README từ đầu chạy được (đã thử ở T20). Commit riêng từng repo: `docs(tiktok-review-plan): update contract and local run guide` (web gồm `CLAUDE.md` gốc không thuộc repo nào: `CH/CLAUDE.md` nằm ngoài cả hai repo, ghi nhận thay đổi theo phương án git đã chọn ở T0).

- [ ] **T20** — Nghiệm thu local end-to-end.
  - File: không sửa code; ghi kết quả vào mô tả commit/PR hoặc `web/docs/features/tiktok-review-plan/acceptance.md` (nếu chủ sản phẩm muốn lưu).
  - Đáp ứng: AC-47, AC-48, AC-42 (cuối), AC-46, AC-20 (chạy lại toàn bộ), AC-51 (xác nhận luồng TikTok thật không thuộc lát này).
  - Phụ thuộc: T11, T11b, T14-T19.
  - Kiểm tra (chuẩn bị: `docker compose up -d`, `dotnet ef database update ...`, BE `--launch-profile https` với `Frontend:Url=http://localhost:3000`, Google client có redirect URI local, secret Google và `Jwt:Key` qua user-secrets; FE `npm run dev` với `.env.local` chứa `NEXT_PUBLIC_API_URL=https://localhost:7031`): AC-47: Sign in with Google bằng `hungle692002@gmail.com` -> `/dashboard` thấy email và "TikTok not connected"; reload vẫn đăng nhập; Sign out về `/login`; vào lại `/dashboard` bị đẩy về `/login`. AC-48: đăng nhập bằng Google khác ngoài allowlist -> `/login` với thông báo không được phép, và `SELECT count(*) FROM app_users` không tăng. Kiểm cookie: DevTools Application cho thấy `tm_auth` HttpOnly, Secure, SameSite=Lax, host `localhost`. Chạy lại: `cd api && dotnet test`, `cd web && npm test && npm run lint && npm run build` xanh. RK1 đã được spike ở T11b; ở đây xác nhận lại với Google thật. Kiểm xóa dòng thật sau Disconnect (khi đã có tài khoản TikTok nối thử, nếu không thì chèn dòng thử vào DB dev rồi gọi `POST /api/auth/tiktok/disconnect`): `SELECT count(*) FROM tiktok_accounts WHERE "AppUserId" = '<id>'` và `SELECT count(*) FROM tiktok_credentials` của account đó đều bằng 0 (AC-18). Sau khi đạt, cuối cùng đề nghị chủ sản phẩm duyệt để chuyển `/agentteam:review-feature`. Commit: không (chỉ báo cáo).

## Ma trận truy vết

| AC | Task |
|---|---|
| AC-1 | T8 (cấu hình redirect), T11 (kiểm curl) |
| AC-2 | T2, T3, T9 |
| AC-3 | T2, T3 |
| AC-4 | T3, T9 |
| AC-5 | T3, T9 |
| AC-6 | T9 |
| AC-7 | T1, T3 |
| AC-8 | T8, T11 |
| AC-9 | T7, T11 |
| AC-10 | T10, T11 |
| AC-11 | T4, T10, T11 |
| AC-12 | T4 |
| AC-13 | T1 |
| AC-14 | T5, T10 |
| AC-15 | T5, T10 |
| AC-16 | T5, T6 |
| AC-17 | T5, T10 |
| AC-18 | T6 |
| AC-19 | T10, T11 |
| AC-20 | T1, T3-T7, T9-T11, T20 (mỗi task giữ `dotnet test` xanh; T11, T20 chạy toàn bộ) |
| AC-21 | T11 (cấu hình CORS hiện có, không đổi; kiểm bằng curl) |
| AC-52 (nhóm B, đặt sau AC-21 theo N5) | T9 |
| AC-22 | T13, T14, T15, T17 |
| AC-23 | T14 |
| AC-24 | T14 |
| AC-25 | T15 |
| AC-26 | T14 |
| AC-27 | T15 |
| AC-28 | T12 |
| AC-29 | T12 |
| AC-30 | T15 |
| AC-31 | T16 |
| AC-32 | T16 |
| AC-33 | T16 |
| AC-34 | T16 |
| AC-35 | T16 |
| AC-36 | T16 |
| AC-37 | T16 |
| AC-38 | T16 |
| AC-39 | T15 |
| AC-40 | T15 (Sign out), T16 (Disconnect) |
| AC-41 | T15, T16 |
| AC-42 | T13, T20 |
| AC-43 | T13 |
| AC-44 | T17 |
| AC-45 | T18 |
| AC-46 | T12-T18 (mỗi task), T20 (kiểm cuối) |
| AC-47 | T11b (spike cookie), T20 |
| AC-48 | T20 |
| AC-49 | T1, T11, T12, T19 |
| AC-50 | T19 |
| AC-51 | T5 (test với client TikTok giả), T20 (xác nhận ngoài phạm vi) |

Mọi AC-1..AC-52 đều có ít nhất một task.

## Rủi ro

| # | Rủi ro | Giảm thiểu |
|---|---|---|
| RK1 | (đã có spike T11b TRƯỚC mọi task FE) Schemeful same-site: FE `http://localhost:3000` và BE `https://localhost:7031` cùng host nhưng khác scheme; trình duyệt (Chrome/Edge, chưa kiểm chứng trên máy này) có thể coi là cross-site và KHÔNG gửi cookie `tm_auth` (Lax) trong `fetch` từ FE tới BE, khiến `GET /api/me` luôn 401 dù đăng nhập thành công. D1 của spec giả định "cùng site". Đây là rủi ro lớn nhất cho mốc nghiệm thu AC-47. | Spike T11b ngay sau T10/T11, tiêu chí đạt = `/api/me` mang cookie; quyết định (nếu fail) được chốt trước T12-T16 và ghi ở `spike-cookie.md`. Nếu xảy ra: chạy FE bằng HTTPS (`next dev --experimental-https`, đọc docs Next trong `node_modules`) và đặt `Frontend:Url=https://localhost:3000` (CORS và redirect theo), cập nhật README/CLAUDE.md (thuộc T19); phương án phụ: SameSite=None;Secure riêng cho Development. Ghi quyết định cho chủ sản phẩm vì đổi D1. |
| RK2 | Cấu hình handler Google sai gây hỏng toàn bộ pipeline (OAuth handler ném lỗi khi thiếu `ClientId/Secret`), hoặc cookie ngoài/correlation không hoạt động ở `https://localhost:7031`. | P5 (không đăng ký scheme khi thiếu cấu hình ở Development, fail-fast ở môi trường khác); T8 test hàm thuần; T11 smoke khởi động không cấu hình Google; T20 chạy với Google thật; cert dev `dotnet dev-certs https --trust`. |
| RK3 | `git` cho `api/`: không phải repo, không thể commit từng task theo team-rules; mất lịch sử/hoàn tác nếu làm sai. | Mục "Quản lý thay đổi (git)": đề xuất `git init` cục bộ có baseline (cần chủ sản phẩm duyệt) hoặc phương án dự phòng (sao lưu + commit ghi chú trong `web`). Quyết định trước T0, nếu chưa có thì dừng ở T0 theo team-rules. |
| RK4 | Sửa `IOAuthStateStore` và `CompleteTikTokConnect` làm gãy test hiện có hoặc logic đổi code/refresh. | Thay đổi nhỏ có kiểm soát ở T4 (chỉ chữ ký) rồi T5 (logic); các test account/videos/refresh không được sửa (kiểm bằng `git diff --stat` ở T11); cập nhật `CompleteTikTokConnectTests` đúng như AC-20 cho phép. |
| RK5 | Quyết định vượt chữ spec: giữ `[AllowAnonymous]` ở `connect` (P9); từ chối `TikTok.AlreadyConnected` khi user nối `open_id` khác; mã `TikTok.AccessDenied/AuthFailed` do plan đặt; Disconnect lần 2 trả 404. | Nêu rõ trong plan (P9, bảng nit) để reviewer plan và chủ sản phẩm duyệt; nếu không đồng ý thì sửa task T4/T5/T10 trước khi implement. |
| RK6 | Không có test cho pipeline thật (không có `WebApplicationFactory`): `Microsoft.AspNetCore.Mvc.Testing` là package mới và spec giới hạn đúng một NuGet; do đó AC-1, AC-8 (khởi động), AC-10 (toàn pipeline), AC-21, AC-19 (`/api/me` sau logout) chỉ kiểm unit từng phần cộng smoke curl ở T11. | Chấp nhận mặc định; nếu chủ sản phẩm cho phép thêm package test-only thì viết các test tích hợp này ở T8-T11 và cập nhật plan. |
| RK7 | Handler Google dùng `Failure.Data["error"]` / claim mapping `email_verified` có thể khác kỳ vọng ở bản 10.x. | T9 yêu cầu xác nhận bằng thử thực tế; test mức controller/event; T20 chạy với Google thật (kể cả hủy ở màn Google để thấy `access_denied`, AC-6). |
| RK8 | FE không có framework test; nhiều AC FE (AC-25..AC-27, AC-31..AC-41, AC-43, AC-44) chỉ kiểm thủ công; có thể sót khi sửa sau. | Tách logic thuần ra module có `node --test` (T12, T14-T16); danh sách kiểm thủ công cụ thể trong từng task; E2E tự động nằm ngoài phạm vi. |
| RK9 | `cacheComponents`: dùng `useSearchParams`/cookie ngoài `<Suspense>` làm `next build` lỗi; Next 16.4 khác bản đã biết. | Đọc docs trong `node_modules/next/dist/docs/` trước (AGENTS.md); mọi trang dùng search params bọc `<Suspense>`; `npm run build` sau mỗi task FE. |
| RK10 | Bí mật bị đưa nhầm vào repo/tài liệu (Google client secret, `Jwt:Key`, TikTok secret); `.env*` bị ignore làm quên file mẫu. | Chỉ placeholder rỗng/giả trong `appsettings*.json`, `.env.example`; test không-secret trong `ConfigFileTests` (T11) và lệnh grep ở T19; secret chỉ qua user-secrets/env; thêm `!.env.example` vào `.gitignore` (T12). |
| RK11 | Điều kiện nghiệm thu AC-48 cần một tài khoản Google thứ hai; AC-47 cần client Google đã có redirect URI local. | Chủ sản phẩm chuẩn bị trước T20 (đã có client theo D1); nếu thiếu tài khoản thứ hai, kiểm AC-48 bằng test T3/T9 và ghi lại là chưa kiểm thủ công. |
| RK12 | Dữ liệu dev cũ (user tạo bằng TikTok-as-login) làm migration/đăng nhập khó hiểu. | D8: được xóa DB dev (`docker compose down -v`); cột `GoogleSubject` nullable nên migration không vỡ ngay cả khi không xóa. |
| RK13 | Lệch phạm vi/thời điểm: video review cần domain deploy, lát này chỉ local (research R7). | Ngoài phạm vi; không quay video trước khi deploy (lát sau). |

## Dependency mới (tổng kết)

- NuGet: đúng một, `Microsoft.AspNetCore.Authentication.Google` (T1, chỉ ở `TikTokManager.Api.csproj`). Project test mới `TikTokManager.Api.Tests` chỉ dùng các package đã có sẵn trong repo, cùng phiên bản (FluentAssertions giữ 7.x).
- npm: không có. Test FE dùng `node --test` của Node 24.16; theme, fetch, hộp xác nhận tự viết.
