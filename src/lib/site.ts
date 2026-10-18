// Có thể ghi đè bằng biến môi trường trên Vercel.
export const site = {
  name: process.env.NEXT_PUBLIC_APP_NAME ?? "Hunee Content Hub",
  owner: "Hunee",
  contactEmail:
    process.env.NEXT_PUBLIC_CONTACT_EMAIL ?? "hungle692002@gmail.com",
  lastUpdated: "October 15, 2026",
  lastUpdatedVi: "15/10/2026",
};
