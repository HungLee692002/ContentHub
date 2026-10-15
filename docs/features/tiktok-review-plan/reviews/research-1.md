Verdict: APPROVE
Loại: research (slug: tiktok-review-plan)

Blocking (phải sửa):
- Không có.

Non-blocking (nên sửa):
- [N1] research.md:15 — Dẫn chiếu `privacy/page.tsx:22-24, 73-75` lệch nhẹ. Câu "Access to the Service is restricted to the Owner's Google account" nằm ở dòng 72-74. Đề xuất sửa thành 72-74.
- [N2] research.md:27 và :65 — Nhãn "Hướng A" bị dùng cho hai thứ khác nhau. Một là Google ở BE (mục 5), hai là "Hướng A của research cũ" (browser gọi API trực tiếp). Đề xuất đổi nhãn của research cũ thành "Hướng A-cũ" hoặc mô tả bằng lời.
- [N3] research.md:47 — Mục này viết như thể guideline chính thức khẳng định "website không được chỉ là landing/login page". Mục 4 lại trộn nguồn chính thức với blog bên thứ ba (bundle.social). Đề xuất gắn nhãn nguồn cho từng gạch đầu dòng, ví dụ "(guideline)" và "(blog 3rd-party)", để khỏi khẳng định quá mức.
- [N4] research.md:35, 41, 42 — Các điểm TikTok chưa chắc (PKCE base64url với web, sandbox có key hay redirect URI riêng, target user có phải cung cấp đăng nhập không, host `api.` có cần xác minh không) đã được đánh dấu "(chưa chắc)" và có smoke test hoặc rủi ro tương ứng (R2, R3). Cách này đúng, nhưng nên đưa các điểm này vào câu hỏi mở hoặc checklist step 2-3 để không bị bỏ sót khi viết spec.
- [N5] research.md:91-100 — Câu hỏi mở 1 gộp hai ý (host BE và chấp nhận `api.hunee-kifu.com`). Câu 3 và 8 phụ thuộc nhau, vì thư viện OIDC chỉ cần khi chọn Hướng A. Đề xuất tách Q1, gộp Q3 và Q8, và ghi câu nào chặn bước nào. Q1, Q3 và Q7 chặn step 1 và step 4.
- [N6] research.md:62 — Mục 5 quyết định 3 gợi ý các nơi host BE nhưng chưa nêu tiêu chí chọn, ví dụ ngân sách, free tier có sleep (cold start làm lỗi OAuth callback hoặc video demo). Đề xuất thêm một tiêu chí "không sleep/cold start khi quay video và khi reviewer truy cập". Chưa có số liệu giá và tài liệu đã ghi rõ đây là giả định.

Ghi chú / điểm tốt:
- Dẫn chiếu file:dòng kiểm lại với source thật đều đúng:
  - `CompleteTikTokConnect.cs:65-75` tạo `AppUser` cho bất kỳ open_id nào.
  - `TikTokAuthController.cs`: `:17` là `[AllowAnonymous]` trên connect, `:41-49` là cookie `tm_auth` (HttpOnly, Secure, Lax), `:50` redirect `/dashboard`, `:75-76` redirect `/connect?error=`.
  - `appsettings.json:23` có `user.info.profile`, `:30` có `ExpiryMinutes` 10080 (7 ngày).
  - `TikTokScopes.cs:13-21` chỉ gọi field theo scope được cấp.
  - `Pkce.cs:17-19` là base64url, `TikTokOAuthClient.cs:28-29` gửi S256, `:43` gửi `code_verifier`, `:14-15` và `:46-53` khớp.
  - `TikTokAccessTokenProvider.cs:18-66`: semaphore theo account, dùng refresh token mới.
  - `Program.cs`: `:75-78` CORS `WithOrigins` + `AllowCredentials`, `:84` `UseHttpsRedirection`.
  - `MeController.cs`: route `api/me`, `tiktok/account`, `tiktok/videos`.
  - `next.config.ts:5-6` bật `cacheComponents` và `partialPrefetching`.
  - `page.tsx:19-24` là link Terms/Privacy, không có link đăng nhập.
  - `api/README.md:84` nói key Data Protection chưa mã hóa at-rest.
  - Không có Dockerfile trong `api/`. File xác minh TikTok có ở `web/public/tiktoksjZo...txt`.
- Phát hiện quan trọng và đúng: "TikTok = login" mâu thuẫn với quyết định Google + allowlist. Privacy hiện tuyên bố Google sign-in nhưng code chưa có.
- Thông số TikTok khớp tài liệu chính thức reviewer biết và không khẳng định quá mức:
  - Token TTL 86400s và 31536000s, refresh token có thể xoay.
  - Redirect URI: HTTPS, tĩnh, tối đa 10, dưới 512 ký tự.
  - Video list: `max_count` tối đa 20, cursor là Unix ms, chỉ video công khai.
  - Rủi ro PKCE hex và base64url được nêu đúng chỗ, kèm phương án dự phòng.
  - Nguồn chính thức được liệt kê ở cuối tài liệu. Reviewer không truy cập web để xác minh lại các URL này.
- Đề xuất khả thi. Thứ tự step hợp lý, vì smoke test PKCE và sandbox (step 2-3) làm trước khi viết UI. Kế hoạch đủ cho lát cắt gửi review gồm hạ tầng, portal, BE Google, FE, sửa Privacy, video và hồ sơ gửi. Có phương án cứu Hướng C.
- Không lộ secret. Chỉ có tên cấu hình như `ClientSecret` và `Jwt:Key`; connection string dev trong `appsettings.json` là của repo, tài liệu không nhắc tới nó.

Bằng chứng: Đã đọc toàn bộ research.md. Đã mở lại `CompleteTikTokConnect.cs`, `appsettings.json`, `TikTokAuthController.cs`, `Pkce.cs`, `TikTokScopes.cs`, `TikTokOAuthClient.cs`, `TikTokAccessTokenProvider.cs`, `Program.cs` (grep), `MeController.cs` (grep), `next.config.ts`, `privacy/page.tsx` (grep), `page.tsx` (grep), README (grep), `web/public`. Glob xác nhận không có Dockerfile. Không chạy test hay lint vì đây là tài liệu research.
