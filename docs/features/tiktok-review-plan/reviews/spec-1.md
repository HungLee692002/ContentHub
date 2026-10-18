Verdict: REQUEST_CHANGES
Loại: spec (slug: tiktok-review-plan)

Blocking (phải sửa):
- [B1] AC-15 không xác định, không viết test được. Một Then có hai đích ("`/dashboard?error=<code>` ... hoặc `/login` nếu chưa đăng nhập") và gộp nhiều điều kiện bằng "hoặc" (không có cookie / userId lệch / state sai). Hai điều kiện có thể xảy ra cùng lúc: không cookie và state sai. Đề xuất: tách thành bảng quyết định theo thứ tự ưu tiên. Ví dụ: (1) không có cookie hợp lệ thì 302 `/login`; (2) có cookie nhưng state thiếu, sai hoặc hết hạn thì `/dashboard?error=TikTok.InvalidState`; (3) userId cookie khác userId trong state thì `/dashboard?error=<code cụ thể, ví dụ TikTok.InvalidState>`. Ghi rõ mã lỗi cho từng nhánh.
- [B2] AC-45(e) và Q4 để ngỏ một sự thật đã kiểm chứng được. `DisconnectTikTok.cs` chỉ gọi `RemoveCredential` (xóa token) và giữ nguyên `TikTokAccount` (profile/stats đã đồng bộ). `privacy/page.tsx:81-84` đang ghi "deletes the stored TikTok tokens and the TikTok data obtained through them", tức là sai thực tế. Spec không nên đẩy sang plan. Đề xuất: chốt trong spec theo một trong hai cách. (a) Giữ hành vi BE, Privacy chỉ nói "token bị xóa; hồ sơ/thống kê đã đồng bộ được giữ cho tới khi owner yêu cầu xóa". (b) Mở rộng AC-18 để disconnect xóa luôn `TikTokAccount`. Nếu chọn (b) thì phải thêm test và xét lại AC-16, vì sau disconnect `open_id` vẫn còn gắn với user cũ trong cách (a). Đó là thông tin cần có để AC-16 kiểm thử đúng.

Non-blocking (nên sửa):
- [N1] AC-3 và D2 không nói khóa nhận diện Google. Hiện AC-3 chỉ nói "cùng email". Nên ghi dùng `sub` làm khóa chính và email chỉ để đối chiếu allowlist, vì email có thể đổi. `AppUser` hiện chỉ có `Id` và `CreatedAt` (`AppUser.cs`), nên spec cần nêu rõ cột nào thêm vào (GoogleSubject, Email) vì AC-9 cần trả `email`.
- [N2] AC-51 diễn đạt lạ ("nếu có thể ở local", "Given thông tin sandbox/tunnel") và không kiểm thử được. Nội dung thực chất là non-goal và đã có ở mục Ngoài phạm vi. Nên bỏ AC này hoặc viết lại thành "luồng connect TikTok thật không nằm trong nghiệm thu".
- [N3] AC-8 chỉ nói hành vi ở Development. Nên nêu hành vi ở non-Development: ví dụ fail-fast khi khởi động nếu thiếu Google config.
- [N4] AC-42 "không nhấp nháy sai theme" và "tương phản dễ đọc" khó kiểm. Nên ghi rõ đây là kiểm tra thủ công và tiêu chí cụ thể (ví dụ không có frame nào theme sai khi hard reload, tương phản AA).
- [N5] AC-6 gộp `google_failed` và `access_denied` kèm "hoặc". Nên nêu rõ: hủy ở màn Google thì `access_denied`; state sai hoặc lỗi khác thì `google_failed`.
- [N6] AC-20 ("test cũ còn phù hợp vẫn pass") hơi mơ hồ. Nên liệt kê tên test bị thay đổi: `StartTikTokConnect` và `CompleteTikTokConnect`.
- [N7] D1: cookie không tách theo port nên đúng. Nên thêm ghi chú rằng cookie correlation/state của Google handler dùng cookie tạm riêng và cũng phải hoạt động ở `https://localhost:7031`. Nhờ đó plan không bỏ sót.
- [N8] Mục Edge cases có "Đăng nhập Google ở tài khoản khác khi đã có phiên" nhưng không có AC tương ứng. Nên thêm AC hoặc ghi rõ là hành vi mặc định không kiểm thử.

Ghi chú / điểm tốt:
- AC đánh số đầy đủ (AC-1..51), phần lớn dạng Given/When/Then và đo được. Non-goals rõ và khớp các quyết định đã chốt (Google + allowlist `hungle692002@gmail.com`, local-only, connect yêu cầu đăng nhập, UI tiếng Anh, bỏ `user.info.profile`, không tunnel/deploy/video).
- Không thấy mâu thuẫn nội bộ nghiêm trọng. AC-11 và D4 (bỏ `/connect`) khớp nhau. AC-13 khớp quyết định bỏ `user.info.profile`. AC-30 (không gọi `/api/me/tiktok/*`) tương thích với AC-38.
- Khẳng định về source đúng khi đối chiếu: `connect` hiện `[AllowAnonymous]` (`TikTokAuthController.cs:17`); lỗi redirect về `/connect?error=` (`RedirectToConnectError`); cookie HttpOnly/Secure/Lax; `FallbackPolicy` bắt đăng nhập (`Program.cs:70`); `MeDto` chưa có `email` (`GetMe.cs`); `appsettings.json:23` còn `user.info.profile`; `web/CLAUDE.md` còn TODO; `.env.example` chưa có `NEXT_PUBLIC_API_URL`; FE chỉ có `/`, `/terms`, `/privacy`.
- AC-45 khớp tình trạng thực tế: `privacy/page.tsx:71-72` nói lưu "access tokens issued by TikTok or Google" (sai, BE không lưu token Google); Privacy còn nói AI provider, file storage, ideas/schedules/imported files (tính năng chưa tồn tại); `page.tsx:11` và `terms/page.tsx:21,60` cũng hứa ideas/calendar/AI. AC-44 và "Terms rà tương tự" đã bao quát phần này.
- Không lộ secret.
- Phạm vi: lớn (BE Google + migration, FE gồm 5 route, dashboard, theme, rà legal, tài liệu) nhưng vẫn gắn kết quanh một mục tiêu nghiệm thu rõ (Google login end-to-end ở local), nên chấp nhận được cho một lát. Plan nên chia nhỏ theo thứ tự BE rồi FE.
