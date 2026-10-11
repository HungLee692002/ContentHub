import Link from "next/link";
import { site } from "@/lib/site";

export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col justify-center px-4 py-16">
      <h1 className="text-4xl font-bold">{site.name}</h1>
      <p className="mt-4 text-lg text-neutral-600 dark:text-neutral-300">
        Plan, schedule and analyze short-form video content for your channel in
        one place: organize ideas and scripts, manage a content calendar, track
        video performance and get AI-assisted content suggestions.
      </p>
      <nav className="mt-8 flex gap-6 text-sm">
        <Link href="/terms" className="underline">
          Terms of Service
        </Link>
        <Link href="/privacy" className="underline">
          Privacy Policy
        </Link>
      </nav>
    </main>
  );
}
