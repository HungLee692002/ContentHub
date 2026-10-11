// Đổi các giá trị này khi chốt tên app / domain / email liên hệ.
export const site = {
  name: process.env.NEXT_PUBLIC_APP_NAME ?? "ContentHub",
  contactEmail: process.env.NEXT_PUBLIC_CONTACT_EMAIL ?? "contact@example.com",
  lastUpdated: "October 11, 2026",
};
