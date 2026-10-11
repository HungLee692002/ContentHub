import Link from "next/link";
import { site } from "@/lib/site";

export function LegalLayout({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-12">
      <Link href="/" className="text-sm text-neutral-500 hover:underline">
        ← {site.name}
      </Link>
      <h1 className="mt-4 text-3xl font-bold">{title}</h1>
      <p className="mt-1 text-sm text-neutral-500">
        Last updated: {site.lastUpdated}
      </p>
      <div className="mt-8 space-y-6 leading-relaxed [&_h2]:mb-2 [&_h2]:text-xl [&_h2]:font-semibold [&_ul]:list-disc [&_ul]:space-y-1 [&_ul]:pl-6">
        {children}
      </div>
    </main>
  );
}
