import Link from "next/link";
import { site } from "@/lib/site";

export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col justify-center px-4 py-16">
      <h1 className="text-4xl font-bold">{site.name}</h1>
      <p className="mt-4 text-lg text-neutral-600 dark:text-neutral-300">
        {site.name} is a private content management tool built and operated by{" "}
        {site.owner} for managing {site.owner}&apos;s own short-form video
        channel: organizing ideas and scripts, planning a content calendar,
        tracking video performance and getting AI-assisted content suggestions.
      </p>
      <p className="mt-4 text-neutral-600 dark:text-neutral-300">
        Access is restricted to the owner&apos;s own account and is not offered
        to the public.
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
