Verdict: APPROVE
Loại: spec (lần 2, slug: tiktok-review-plan, spec v2)

Blocking (phải sửa):
- Không có.

Kiểm tra B1 và B2 của lần 1

[B1] Đã xử lý thật.
- AC-15 nay là bảng quyết định 3 nhánh có thứ tự ưu tiên: (1) không có cookie thì 302 `/login`, không có tham số `error`; (2) có cookie nhưng state sai thì `/dashboard?error=TikTok.InvalidState`; (3) userId lệch thì `/dashboard?error=TikTok.UserMismatch`.
- Điều kiện đồng thời (không cookie và state sai) đã được xử lý bằng quy tắc "nhánh đầu tiên khớp thì dừng" và có test riêng.
- AC-15 nhất quán với AC-11, AC-14 và AC-16 (`TikTok.AlreadyLinked` chỉ xét sau khi qua AC-15).

[B2] Đã xử lý thật, và khớp code.
- Đối chiếu `api/src/TikTokManager.Application/Features/Connect/DisconnectTikTok.cs:41`: code hiện chỉ gọi `accounts.RemoveCredential`, đúng như spec mô tả.
- `web/src/app/privacy/page.tsx:81-83` có câu "deletes the stored TikTok tokens and the TikTok data obtained through them". Câu này chỉ đúng nếu D9/AC-18 được implement.
- D9 và AC-18 buộc xóa cả `TikTokAccount`. AC-45(e) giữ nguyên câu Privacy và nêu lý do. Q4 đã bỏ.
- Cascade trong `Persistence/Configurations/Configurations.cs:36-38` cho thấy xóa `TikTokAccount` kéo theo xóa credential, nên D9 khả thi.
- `OpenId` có unique index (`Configurations.cs:27`), nên AC-16 yêu cầu xóa account để giải phóng `open_id` là cần thiết và đúng.
- Spec đã ghi D9 là quyết định của spec-writer để chủ sản phẩm xem lại.

8 nit lần 1: cả 8 đã sửa (N1 khóa `sub` + cột `GoogleSubject`/`Email`; N2 AC-51 viết lại; N3 AC-8 fail-fast non-Development; N4 AC-42 kiểm tra thủ công có tiêu chí; N5 AC-6 tách `access_denied`/`google_failed`; N6 AC-20 nêu tên test; N7 D1 ghi chú cookie tạm; N8 AC-52 mới).

Mâu thuẫn mới do việc sửa: không có giữa AC-15, AC-16, AC-18, AC-45, D9 và AC-52. AC-52 đánh số lệch thứ tự nhưng đã ghi chú rõ. Với research: không mâu thuẫn; spec đổi hành vi disconnect và có khai báo.

Non-blocking (nên sửa):
- [N1] AC-18, câu cuối: "idempotent 204 hoặc 404 `TikTok.NotConnected` theo hành vi hiện tại" vẫn là kết quả kép. Code hiện tại (`DisconnectTikTok.cs:24-25`) trả `NotConnected` (404) khi `account?.Credential is null`; sau D9, lần disconnect thứ hai rơi vào nhánh này. Đề xuất: ghi rõ "disconnect khi chưa nối trả 404 `TikTok.NotConnected`, không 500".
- [N2] AC-17 và AC-15 chưa nói rõ thứ tự ưu tiên khi callback có `error` (người dùng từ chối consent) mà không có cookie, hoặc có `error` kèm state sai. Đề xuất: AC-15 nhánh 1 xét trước; nhánh `error` của AC-17 áp dụng sau khi qua xác thực người gọi.
- [N3] AC-16 chưa nói state có bị hủy khi trả `TikTok.AlreadyLinked` hay không. Đề xuất: thêm một câu (nên hủy state).
- [N4] Lỗi từ TikTok khi đổi code hoặc lấy userinfo (ngoài `error` do người dùng hủy) chưa có AC rõ về mã lỗi redirect. Plan nên nêu rõ để test không mơ hồ.
- [N5] Cosmetic: D9 nằm giữa D2 và D3; AC-52 nằm cuối nhóm B.

Ghi chú / điểm tốt
- Phần sửa của v2 gọn, truy vết được qua mục Lịch sử thay đổi.
- Spec giữ fail-closed, có `email_verified`, có ràng buộc state với `userId`, và không lộ secret.
- Các AC mới đều kiểm thử được: AC-15 (3 nhánh), AC-18 (kiểm tra DB), AC-52.
