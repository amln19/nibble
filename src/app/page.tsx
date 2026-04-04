import Link from "next/link";

export default function Home() {
  return (
    <main className="mx-auto flex max-w-3xl flex-1 flex-col justify-center gap-8 px-6 py-16">
      <div>
        <h1 className="text-4xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          Welcome
        </h1>
        <p className="mt-4 text-lg leading-relaxed text-zinc-600 dark:text-zinc-400">
          This is a minimal Next.js app with a few example pages. Use the
          navigation above or jump to{" "}
          <Link
            href="/about"
            className="font-medium text-zinc-900 underline underline-offset-4 dark:text-zinc-100"
          >
            About
          </Link>{" "}
          or{" "}
          <Link
            href="/contact"
            className="font-medium text-zinc-900 underline underline-offset-4 dark:text-zinc-100"
          >
            Contact
          </Link>
          .
        </p>
      </div>
    </main>
  );
}
