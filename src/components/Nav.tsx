"use client";

import { BrandMascot } from "@/components/BrandMascot";
import { NavAuth } from "@/components/NavAuth";
import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/", label: "Discover", icon: "◇" },
  { href: "/box", label: "Recipe box", icon: "♥" },
  { href: "/creations", label: "Posts", icon: "✦" },
] as const;

export function Nav() {
  const pathname = usePathname();

  return (
    <>
      {/* Desktop nav */}
      <header className="hidden border-b-2 border-zinc-100 bg-white md:block">
        <nav className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-6 py-3 lg:px-8">
          <Link
            href="/"
            className="flex items-center gap-2.5 font-bold tracking-tight text-zinc-900"
          >
            <BrandMascot variant="header" priority />
            <span className="text-lg">Nibble</span>
          </Link>
          <ul className="flex items-center gap-1">
            {links.map(({ href, label }) => {
              const active = pathname === href;
              return (
                <li key={href}>
                  <Link
                    href={href}
                    className={`rounded-xl px-4 py-2 text-sm font-bold transition-colors ${
                      active
                        ? "bg-pink-50 text-pink-600"
                        : "text-zinc-500 hover:bg-zinc-50 hover:text-zinc-900"
                    }`}
                  >
                    {label}
                  </Link>
                </li>
              );
            })}
          </ul>
          <NavAuth />
        </nav>
      </header>

      {/* Mobile bottom nav — Duolingo style */}
      <nav
        className="fixed right-0 bottom-0 left-0 z-50 border-t-2 border-zinc-100 bg-white pb-[env(safe-area-inset-bottom)] md:hidden"
        aria-label="Main"
      >
        <ul className="mx-auto flex max-w-lg justify-around px-2 py-2">
          {links.map(({ href, label, icon }) => {
            const active = pathname === href;
            return (
              <li key={href} className="min-w-0 flex-1">
                <Link
                  href={href}
                  className="flex flex-col items-center gap-0.5 py-1"
                >
                  <span
                    className={`flex h-9 w-12 items-center justify-center rounded-xl text-lg transition-colors ${
                      active ? "bg-pink-100 text-pink-600" : "text-zinc-400"
                    }`}
                    aria-hidden
                  >
                    {icon}
                  </span>
                  <span
                    className={`text-[10px] font-bold ${active ? "text-pink-600" : "text-zinc-400"}`}
                  >
                    {label}
                  </span>
                </Link>
              </li>
            );
          })}
          <li className="min-w-0 flex-1">
            <Link href="/account" className="flex flex-col items-center gap-0.5 py-1">
              <span
                className={`flex h-9 w-12 items-center justify-center rounded-xl text-lg transition-colors ${
                  pathname === "/account" || pathname === "/login"
                    ? "bg-pink-100 text-pink-600"
                    : "text-zinc-400"
                }`}
                aria-hidden
              >
                ◎
              </span>
              <span
                className={`text-[10px] font-bold ${
                  pathname === "/account" || pathname === "/login"
                    ? "text-pink-600"
                    : "text-zinc-400"
                }`}
              >
                Account
              </span>
            </Link>
          </li>
        </ul>
      </nav>
    </>
  );
}
