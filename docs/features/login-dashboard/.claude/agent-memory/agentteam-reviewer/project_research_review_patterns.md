---
name: research-review-patterns
description: Mẫu lỗi nhỏ lặp lại khi review research của ContentHub (dẫn chiếu dòng, đặt tên hướng trùng)
metadata:
  type: project
---

- Research của dự án này thường dẫn chiếu file:dòng khá chính xác; hay lệch 1-2 dòng ở file TSX (vd privacy/page.tsx). Luôn mở lại CompleteTikTokConnect.cs, TikTokAuthController.cs, appsettings.json.
- Research mới kế thừa research cũ nên hay trùng nhãn "Hướng A/B/C" giữa hai tài liệu, gây mơ hồ.
- Câu hỏi mở hay gộp nhiều ý trong một số (vd Q1 host + domain).
- Gốc ContentHub không phải git repo; chỉ web/ có .git. api/ không có Dockerfile.
