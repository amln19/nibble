"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/", label: "Discover", icon: "◇" },
  { href: "/box", label: "Recipe box", icon: "♥" },
] as const;

export function Nav() {
  const pathname = usePathname();

  return (
    <>
      <header className="hidden border-b border-rose-100/80 bg-white/90 backdrop-blur-md md:block">
        <nav className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-4 lg:px-8">
          <Link
            href="/"
            className="font-serif text-lg font-semibold tracking-tight text-zinc-900"
          >
            Nibble
          </Link>
          <ul className="flex gap-8 text-sm font-medium">
            {links.map(({ href, label }) => {
              const active = pathname === href;
              return (
                <li key={href}>
                  <Link
                    href={href}
                    className={
                      active
                        ? "text-rose-600"
                        : "text-zinc-600 transition-colors hover:text-rose-800"
                    }
                  >
                    {label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </header>

      <nav
        className="fixed right-0 bottom-0 left-0 z-50 border-t border-rose-100/90 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md md:hidden"
        aria-label="Main"
      >
        <ul className="mx-auto flex max-w-md justify-around px-2 py-2">
          {links.map(({ href, label, icon }) => {
            const active = pathname === href;
            return (
              <li key={href} className="flex-1">
                <Link
                  href={href}
                  className={`flex flex-col items-center gap-0.5 rounded-xl py-2 text-xs font-medium ${
                    active
                      ? "text-rose-600"
                      : "text-zinc-500 transition-colors hover:text-rose-700"
                  }`}
                >
                  <span className="text-lg" aria-hidden>
                    {icon}
                  </span>
                  {label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </>
  );
}
