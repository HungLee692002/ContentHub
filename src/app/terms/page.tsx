import type { Metadata } from "next";
import { LegalLayout } from "@/components/LegalLayout";

export const metadata: Metadata = { title: "Terms of Service" };

export default function TermsPage() {
  return <LegalLayout kind="terms" />;
}
