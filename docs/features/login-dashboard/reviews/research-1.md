Verdict: APPROVE
Loại: research

Blocking (phải sửa):
- Không có.

Non-blocking (nên sửa):
- [N1] Hướng A và dev flow thật mâu thuẫn nhẹ — research.md mục Hướng A, "Nhược" — Dòng "flow TikTok thật cần tunnel (xem hướng B)" chưa rõ. Cookie được set trên host tunnel của callback, nên FE `localhost:3000` không nhận được cookie. Hướng A khi test với TikTok thật vẫn cần FE và API chung một host (reverse proxy/tunnel), đúng như CLAUDE.md mục "Cookie & domain". Nên ghi thẳng rằng test end-to-end ở dev yêu cầu một host chung, và nói rõ A không tự giải quyết được việc đó.
- [N2] `useSearchParams` cần Suspense — research.md mục Đề xuất, `/connect` — Câu "đọc trong Suspense hoặc Client Component `useSearchParams`" dễ hiểu là Client Component thì khỏi cần Suspense. Docs `use-search-params.md` nói đây là hook của Client Component. Với `cacheComponents` thì cả hai cách đều nên bọc `<Suspense>`. Ở bước spec/plan nên ghi rõ điều này.
- [N3] Hướng B ghi "Set-Cookie đi qua rewrite" mà chưa đối chiếu docs `rewrites.md` hay nguồn nào. Mục "Nguồn tham khảo" liệt kê file đó nhưng không có kết luận cụ thể. Nên đánh dấu là giả định hoặc xác minh trước khi chuyển sang B.
- [N4] Hai giả định (`vercel.app` thuộc Public Suffix List, URL ảnh cover hết hạn) đã được đánh dấu là giả định, và đề xuất A phụ thuộc vào câu hỏi mở #1. Vậy câu hỏi #1 (domain deploy) nên được ghi là điều kiện tiên quyết trước khi vào spec, không chỉ là một câu hỏi trong danh sách 8 câu.
- [N5] Mục "Vì sao bây giờ" ghi "để TikTok review thấy luồng Login Kit" mà không có nguồn. Nên đánh dấu là suy đoán hoặc dẫn nguồn.

Ghi chú / điểm tốt:
- Reviewer đã tự kiểm chứng các khẳng định then chốt, tất cả đều đúng:
  - Cookie `tm_auth`: `TikTokAuthController.cs:41-49` set HttpOnly, Secure, SameSite=Lax, Path="/", không có `Domain`, nên là host-only. Lệnh Delete ở `:65-71` cũng không có Domain, nhất quán.
  - Redirect lỗi: `:75-76` dùng `error=Uri.EscapeDataString(code)`. `:34-35` chuyển nguyên giá trị `error` thô của TikTok, khớp với mô tả.
  - CORS: `Program.cs:72-78` dùng `WithOrigins(frontendOrigin)` và `AllowCredentials`.
  - `searchParams` và App Shell: `adopting-partial-prefetching.md:269` nói URL data (`params`, `searchParams`) không thể nằm trong App Shell dùng chung, phải đặt sau `<Suspense>`. Dòng 87 nói `cookies()` và `headers()` thì khác.
  - `proxy.ts`: `16-proxy.md:29` nói proxy dùng được cho optimistic checks, không phải giải pháp quản lý session hay authorization đầy đủ. Repo hiện chưa có `proxy.ts`.
- Cấu trúc tốt: nêu rõ vấn đề, đối tượng và lý do; có 3 hướng với ưu/nhược/độ phức tạp; loại hướng C có lý do; đề xuất kèm đường lui sang B (đổi base URL trong `lib/api.ts`); câu hỏi mở cụ thể; giả định được đánh dấu rõ.
- Hiện trạng FE khớp CLAUDE.md. Mã lỗi và field khớp bảng endpoint.
- Dòng đầu là `Status: draft`, đúng quy tắc.
- Không kiểm tra riêng: giả định PSL của `vercel.app`, danh sách file FE hiện có, mô tả `rewrites.md`.
