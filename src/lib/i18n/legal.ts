import type { Locale } from "./dictionaries";

export type LegalKind = "terms" | "privacy";

/**
 * Khối nội dung. Trong chuỗi: **đậm**, và các placeholder {name} {owner} {email}
 * được thay bằng giá trị từ `site` khi render.
 */
export type LegalBlock = { p: string } | { ul: string[] };

export type LegalDoc = {
  title: string;
  /** Các đoạn mở đầu (trước mục 1) */
  intro: string[];
  sections: { heading: string; blocks: LegalBlock[] }[];
};

type LegalStrings = {
  tocLabel: string;
  updatedLabel: string;
  tabs: Record<LegalKind, string>;
  back: string;
  docs: Record<LegalKind, LegalDoc>;
};

// Nội dung chuẩn của dự án (bản tiếng Anh gốc + bản dịch tiếng Việt). Nội dung trong Figma chỉ là demo.
export const legal: Record<Locale, LegalStrings> = {
  en: {
    tocLabel: "CONTENTS",
    updatedLabel: "Last updated:",
    tabs: { terms: "Terms of Service", privacy: "Privacy Policy" },
    back: "Back to sign in",
    docs: {
      terms: {
        title: "Terms of Service",
        intro: [
          'These Terms of Service ("Terms") apply to {name} (the "Service"), a private tool built and operated by {owner} ("the Owner").',
        ],
        sections: [
          {
            heading: "1. What the Service is",
            blocks: [
              {
                p: "The Service is a personal content management tool used by the Owner to manage the Owner's own short-form video channel. It helps organize video ideas and scripts, plan a content calendar, view performance statistics of the Owner's own channel, and receive AI-generated content suggestions. Where the Owner chooses to connect a TikTok account, the Service reads that account's profile and video information.",
              },
            ],
          },
          {
            heading: "2. Private, restricted access",
            blocks: [
              {
                ul: [
                  "The Service is **not offered to the public**. Access is limited to the Owner's own Google account; no other accounts are registered or permitted.",
                  "The Service only accesses data belonging to the account that the Owner has personally connected and authorized.",
                ],
              },
            ],
          },
          {
            heading: "3. Third-party platforms",
            blocks: [
              {
                p: "Use of TikTok and Google through the Service is also subject to TikTok's Terms of Service and Community Guidelines and Google's Terms of Service. The Service acts only with the Owner's explicit authorization, which can be revoked at any time from the TikTok or Google account settings or from within the Service. The Service never posts content to a connected account without the Owner's explicit confirmation.",
              },
            ],
          },
          {
            heading: "4. AI-generated suggestions",
            blocks: [
              {
                p: "The Service may use third-party AI models to generate ideas, scripts, captions and hashtags. Suggestions may be inaccurate and are reviewed by the Owner before any use. Fitness-related suggestions are for general content purposes only and are not medical or professional advice.",
              },
            ],
          },
          {
            heading: "5. Acceptable use",
            blocks: [
              {
                p: "The Service is used only in compliance with applicable law and the rules of the platforms it connects to. It is not used to spam, mislead, scrape data belonging to other people, or access accounts the Owner does not control.",
              },
            ],
          },
          {
            heading: "6. Availability and liability",
            blocks: [
              {
                p: 'The Service is provided "as is" without warranties. The Owner may change, suspend or discontinue it at any time, and is not liable for losses arising from its use to the maximum extent permitted by law.',
              },
            ],
          },
          {
            heading: "7. Changes",
            blocks: [
              { p: 'These Terms may be updated; the "Last updated" date above shows the latest version.' },
            ],
          },
          {
            heading: "8. Contact",
            blocks: [{ p: "Questions about these Terms: {email}." }],
          },
        ],
      },
      privacy: {
        title: "Privacy Policy",
        intro: [
          'This Privacy Policy explains what information {name} (the "Service") collects and how it is used. The Service is a private tool built and operated by {owner} ("the Owner") for the Owner\'s own channel. It is not offered to the public, so the only person whose data is processed is the Owner.',
        ],
        sections: [
          {
            heading: "1. Information the Service processes",
            blocks: [
              {
                ul: [
                  "**Google account:** name, email address and profile picture, used only to sign in and to verify that the signed-in account is the Owner's.",
                  "**TikTok account (when connected):** profile information (display name, avatar), profile statistics such as follower and like counts, and the account's own video list with view, like, comment and share counts, according to the permissions the Owner approves.",
                  "**Content entered by the Owner:** ideas, scripts, captions, hashtags, schedules and imported statistics files.",
                ],
              },
            ],
          },
          {
            heading: "2. How the information is used",
            blocks: [
              {
                ul: [
                  "To provide planning, scheduling and analytics features.",
                  "To display performance statistics of the connected channel.",
                  "To generate content suggestions. Text submitted for this purpose (such as a topic or channel description) is sent to a third-party AI provider to produce the result.",
                ],
              },
              {
                p: "The information is read-only with respect to TikTok unless the Owner explicitly requests an action. It is not sold, not used for advertising, and not used to build profiles of any other person.",
              },
            ],
          },
          {
            heading: "3. Service providers",
            blocks: [
              {
                p: "Data is processed by the providers needed to run the Service: website hosting, a database, file storage, an AI provider for suggestions, and Google and TikTok for sign-in and channel data. Information is disclosed otherwise only if required by law.",
              },
            ],
          },
          {
            heading: "4. Storage and security",
            blocks: [
              {
                p: "Data is stored with reputable cloud providers. Access tokens issued by TikTok or Google are stored encrypted and used only to perform requests made by the Owner. Access to the Service is restricted to the Owner's Google account.",
              },
            ],
          },
          {
            heading: "5. Retention, revocation and deletion",
            blocks: [
              {
                ul: [
                  "Disconnecting TikTok in the Service deletes the stored TikTok tokens and the TikTok data obtained through them.",
                  "Access can also be revoked at any time in TikTok (Settings and privacy → Security & permissions → Manage app permissions) or in the Google Account permissions page.",
                  "All stored data can be deleted on request; contact the address below.",
                ],
              },
            ],
          },
          {
            heading: "6. Changes",
            blocks: [
              { p: 'This policy may be updated; the "Last updated" date above shows the latest version.' },
            ],
          },
          {
            heading: "7. Contact",
            blocks: [{ p: "Privacy questions or requests: {email}." }],
          },
        ],
      },
    },
  },
  vi: {
    tocLabel: "NỘI DUNG",
    updatedLabel: "Cập nhật lần cuối:",
    tabs: { terms: "Điều khoản dịch vụ", privacy: "Chính sách bảo mật" },
    back: "Quay lại đăng nhập",
    docs: {
      terms: {
        title: "Điều khoản dịch vụ",
        intro: [
          'Các Điều khoản dịch vụ này ("Điều khoản") áp dụng cho {name} ("Dịch vụ"), một công cụ riêng do {owner} ("Chủ sở hữu") xây dựng và vận hành.',
        ],
        sections: [
          {
            heading: "1. Dịch vụ là gì",
            blocks: [
              {
                p: "Dịch vụ là công cụ quản lý nội dung cá nhân, được Chủ sở hữu dùng để quản lý kênh video ngắn của chính mình. Dịch vụ giúp sắp xếp ý tưởng và kịch bản video, lập lịch nội dung, xem thống kê hiệu suất của kênh của Chủ sở hữu và nhận gợi ý nội dung do AI tạo ra. Khi Chủ sở hữu chọn kết nối tài khoản TikTok, Dịch vụ sẽ đọc thông tin hồ sơ và video của tài khoản đó.",
              },
            ],
          },
          {
            heading: "2. Truy cập riêng tư, có giới hạn",
            blocks: [
              {
                ul: [
                  "Dịch vụ **không được cung cấp cho công chúng**. Quyền truy cập chỉ giới hạn ở tài khoản Google của Chủ sở hữu; không có tài khoản nào khác được đăng ký hoặc cho phép.",
                  "Dịch vụ chỉ truy cập dữ liệu thuộc tài khoản mà Chủ sở hữu đã trực tiếp kết nối và cấp quyền.",
                ],
              },
            ],
          },
          {
            heading: "3. Nền tảng bên thứ ba",
            blocks: [
              {
                p: "Việc sử dụng TikTok và Google thông qua Dịch vụ cũng chịu sự điều chỉnh của Điều khoản dịch vụ và Nguyên tắc cộng đồng của TikTok cũng như Điều khoản dịch vụ của Google. Dịch vụ chỉ hành động khi có sự ủy quyền rõ ràng của Chủ sở hữu, và sự ủy quyền này có thể được thu hồi bất cứ lúc nào từ phần cài đặt tài khoản TikTok hoặc Google, hoặc ngay trong Dịch vụ. Dịch vụ không bao giờ đăng nội dung lên tài khoản đã kết nối nếu Chủ sở hữu chưa xác nhận rõ ràng.",
              },
            ],
          },
          {
            heading: "4. Gợi ý do AI tạo ra",
            blocks: [
              {
                p: "Dịch vụ có thể dùng các mô hình AI của bên thứ ba để tạo ý tưởng, kịch bản, chú thích và hashtag. Các gợi ý có thể không chính xác và được Chủ sở hữu xem xét trước khi sử dụng. Các gợi ý liên quan đến thể hình chỉ nhằm mục đích nội dung chung, không phải lời khuyên y tế hay chuyên môn.",
              },
            ],
          },
          {
            heading: "5. Sử dụng hợp lệ",
            blocks: [
              {
                p: "Dịch vụ chỉ được sử dụng phù hợp với pháp luật hiện hành và quy định của các nền tảng mà nó kết nối. Dịch vụ không được dùng để spam, đánh lừa, thu thập dữ liệu của người khác hoặc truy cập các tài khoản mà Chủ sở hữu không kiểm soát.",
              },
            ],
          },
          {
            heading: "6. Tính sẵn sàng và trách nhiệm",
            blocks: [
              {
                p: 'Dịch vụ được cung cấp "nguyên trạng" và không có bảo đảm nào. Chủ sở hữu có thể thay đổi, tạm ngưng hoặc ngừng Dịch vụ bất cứ lúc nào, và không chịu trách nhiệm đối với các tổn thất phát sinh từ việc sử dụng, trong phạm vi tối đa mà pháp luật cho phép.',
              },
            ],
          },
          {
            heading: "7. Thay đổi",
            blocks: [
              { p: 'Các Điều khoản này có thể được cập nhật; ngày "Cập nhật lần cuối" ở trên cho biết phiên bản mới nhất.' },
            ],
          },
          {
            heading: "8. Liên hệ",
            blocks: [{ p: "Thắc mắc về các Điều khoản này: {email}." }],
          },
        ],
      },
      privacy: {
        title: "Chính sách bảo mật",
        intro: [
          'Chính sách bảo mật này giải thích {name} ("Dịch vụ") thu thập những thông tin nào và sử dụng chúng ra sao. Dịch vụ là công cụ riêng do {owner} ("Chủ sở hữu") xây dựng và vận hành cho kênh của chính mình. Dịch vụ không được cung cấp cho công chúng, nên người duy nhất có dữ liệu được xử lý là Chủ sở hữu.',
        ],
        sections: [
          {
            heading: "1. Thông tin Dịch vụ xử lý",
            blocks: [
              {
                ul: [
                  "**Tài khoản Google:** tên, địa chỉ email và ảnh đại diện, chỉ dùng để đăng nhập và xác minh tài khoản đang đăng nhập là của Chủ sở hữu.",
                  "**Tài khoản TikTok (khi được kết nối):** thông tin hồ sơ (tên hiển thị, ảnh đại diện), số liệu hồ sơ như lượt theo dõi và lượt thích, cùng danh sách video của chính tài khoản với số lượt xem, thích, bình luận và chia sẻ, theo các quyền mà Chủ sở hữu chấp thuận.",
                  "**Nội dung do Chủ sở hữu nhập:** ý tưởng, kịch bản, chú thích, hashtag, lịch đăng và các tệp thống kê được nhập vào.",
                ],
              },
            ],
          },
          {
            heading: "2. Cách sử dụng thông tin",
            blocks: [
              {
                ul: [
                  "Để cung cấp các tính năng lập kế hoạch, lên lịch và phân tích.",
                  "Để hiển thị thống kê hiệu suất của kênh đã kết nối.",
                  "Để tạo gợi ý nội dung. Văn bản gửi cho mục đích này (như chủ đề hoặc mô tả kênh) được gửi đến nhà cung cấp AI bên thứ ba để tạo kết quả.",
                ],
              },
              {
                p: "Thông tin chỉ ở chế độ chỉ đọc đối với TikTok, trừ khi Chủ sở hữu yêu cầu rõ ràng một hành động. Thông tin không được bán, không dùng cho quảng cáo và không dùng để xây dựng hồ sơ về bất kỳ người nào khác.",
              },
            ],
          },
          {
            heading: "3. Nhà cung cấp dịch vụ",
            blocks: [
              {
                p: "Dữ liệu được xử lý bởi các nhà cung cấp cần thiết để vận hành Dịch vụ: lưu trữ website, cơ sở dữ liệu, lưu trữ tệp, nhà cung cấp AI cho các gợi ý, cùng Google và TikTok cho việc đăng nhập và dữ liệu kênh. Thông tin chỉ được tiết lộ theo cách khác khi pháp luật yêu cầu.",
              },
            ],
          },
          {
            heading: "4. Lưu trữ và bảo mật",
            blocks: [
              {
                p: "Dữ liệu được lưu trữ tại các nhà cung cấp đám mây uy tín. Mã truy cập do TikTok hoặc Google cấp được lưu trữ dưới dạng mã hóa và chỉ dùng để thực hiện các yêu cầu do Chủ sở hữu đưa ra. Quyền truy cập Dịch vụ giới hạn ở tài khoản Google của Chủ sở hữu.",
              },
            ],
          },
          {
            heading: "5. Lưu giữ, thu hồi và xóa dữ liệu",
            blocks: [
              {
                ul: [
                  "Ngắt kết nối TikTok trong Dịch vụ sẽ xóa các mã TikTok đã lưu và dữ liệu TikTok lấy được qua các mã đó.",
                  "Quyền truy cập cũng có thể được thu hồi bất cứ lúc nào trong TikTok (Cài đặt và quyền riêng tư → Bảo mật & quyền → Quản lý quyền ứng dụng) hoặc tại trang quyền của Tài khoản Google.",
                  "Toàn bộ dữ liệu đã lưu có thể được xóa theo yêu cầu; hãy liên hệ theo địa chỉ bên dưới.",
                ],
              },
            ],
          },
          {
            heading: "6. Thay đổi",
            blocks: [
              { p: 'Chính sách này có thể được cập nhật; ngày "Cập nhật lần cuối" ở trên cho biết phiên bản mới nhất.' },
            ],
          },
          {
            heading: "7. Liên hệ",
            blocks: [{ p: "Câu hỏi hoặc yêu cầu về quyền riêng tư: {email}." }],
          },
        ],
      },
    },
  },
};
