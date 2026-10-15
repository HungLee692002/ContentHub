Verdict: APPROVE
Loại: plan (tiktok-review-plan), lần 2

Blocking (phải sửa):
- Không có.

Kiểm tra các mục lần 1:
- B1 (build hỏng giữa task): ĐÃ XỬ LÝ. T5 đã liệt kê TikTokAuthController.cs (sửa tối thiểu: truyền `error`, bỏ set cookie/AuthToken) và xóa hẳn AppUser.Create ở T5 (T2 giữ tạm [Obsolete]; repo không bật TreatWarningsAsErrors nên cảnh báo CS0618 không làm hỏng build). T4 sửa tối thiểu CompleteTikTokConnect + CompleteTikTokConnectTests để build với chữ ký IOAuthStateStore mới. Lệnh `cd api && dotnet build && dotnet test` (toàn bộ) có ở T2, T4, T5, T6, T7, T10, T11, T11b. Quy ước chung cũng nêu bất biến này.
- B2 (AC-18): ĐÃ XỬ LÝ. T6 chốt (a) test metadata EF dùng UseNpgsql không mở kết nối, kiểm DeleteBehavior.Cascade và unique index OpenId; (b) test tích hợp Postgres dev tự bỏ qua khi không có DB; (c) SQL count ở T20. Không thêm package.
- B3 (spike cookie): ĐÃ XỬ LÝ. T11b đặt sau T10/T11 và trước T12-T18 (T12, T13 phụ thuộc T11b; T14-T17 phụ thuộc gián tiếp). Tiêu chí đạt rõ (`/api/me` mang cookie, 200), có nhánh khi fail (A: FE https `--experimental-https` + Frontend:Url https; B: SameSite=None chỉ Development), yêu cầu báo chủ sản phẩm vì đổi D1, ghi `spike-cookie.md`, dọn endpoint tạm và build/test lại. RK1 và ma trận AC-47 đã cập nhật.
- N1-N6: ĐÃ SỬA. N1: JwtChallenge.cs tách riêng, test bằng DefaultHttpContext (T10). N2: chốt chữ ký MissingConfigurationKeys + Decide(isDevelopment, missing) với enum, hai nhánh test (T8). N3: phương án git dự phòng dùng ContentHub-backup/diff -r, không commit rỗng vào web; T19 nêu nơi lưu CLAUDE.md gốc (contract-update.md). N4: P9/P8 ghi rõ lệch spec, yêu cầu chủ sản phẩm xác nhận khi duyệt. N5: `node -v` trong baseline T0. N6: một ConfigFileTests.cs duy nhất cho T1 và T11.
- Vòng phụ thuộc: không có. Chuỗi T1/T2 -> T3/T4 -> T5 -> T10 (cần T6, T9) -> T11 -> T11b -> T12-T18 -> T19 -> T20 hợp lệ; T8 chỉ cần T1, T9 cần T3+T8.
- Ma trận AC: đủ AC-1..AC-52 (AC-52 đặt sau AC-21 theo N5, T9). Không AC nào bị mất.
- Package mới: vẫn chỉ Microsoft.AspNetCore.Authentication.Google; project test mới dùng đúng package sẵn có; npm không thêm. Không mâu thuẫn spec ngoài P9/P8/AlreadyConnected đã được nêu công khai (RK5).

Non-blocking (nên sửa):
- [N1] T6(b): xunit 2.9.3 không có "skip động" sẵn; `[Fact(Skip=...)]` tĩnh không đủ. Nêu rõ dùng lớp con FactAttribute tự viết (đặt Skip trong constructor khi không kết nối được DB), không dùng package Xunit.SkippableFact.
- [N2] T5 interim controller: ghi rõ callback lỗi tạm thời redirect đâu giữa T5 và T10 (hiện chỉ nói thành công vẫn /dashboard), để implementer không phải đoán.
- [N3] T11b: spike khả năng cao sẽ fail do schemeful same-site (http FE vs https BE). Cân nhắc ghi trước rằng phương án A là mặc định dự kiến để chủ sản phẩm sớm biết D1 sẽ đổi.
- [N4] T11b chạy `git checkout -- <file>` để hoàn tác nhưng nếu `api/` không có git (phương án dự phòng) thì chỉ còn cách xóa tay; đã có chú thích "hoặc xóa khỏi Program.cs", nên thêm bước diff với api-baseline để chắc chắn.
- [N5] T11 dòng kiểm bằng `git diff --stat main -- ...` chỉ nhắc Infrastructure.Tests và GetMyTikTokVideosTests; nên liệt kê rõ các file test mới được phép thêm (T1, T4) để khỏi báo nhầm.

Ghi chú / điểm tốt:
- Plan cụ thể, lệnh kiểm có tiêu chí đo được; thứ tự ưu tiên lỗi callback (P7, N2 bảng) nhất quán giữa phần thiết kế và T5/T10.
- Điểm cần chủ sản phẩm xác nhận khi duyệt: git init cho api/, P9 (giữ [AllowAnonymous] ở connect), P8 (GoogleSubject nullable), TikTok.AlreadyConnected.
