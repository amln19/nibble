"use client";

import { NavAuth } from "@/components/NavAuth";
import { ThemeToggle } from "@/components/ThemeToggle";
import { BookmarkCheck, Compass, LayoutGrid, Trophy, User, Users } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/", label: "Discover", Icon: Compass },
  { href: "/box", label: "Recipe Box", Icon: BookmarkCheck },
  { href: "/creations", label: "Posts", Icon: LayoutGrid },
  { href: "/points", label: "Points", Icon: Trophy },
] as const;

export function Nav() {
  const pathname = usePathname();

  if (pathname?.startsWith("/cook") || pathname?.startsWith("/prep")) return null;

  return (
    <>
      {/* ── Desktop top bar ── */}
      <header className="hidden border-b-2 border-edge bg-background md:block">
        <nav className="mx-auto flex max-w-8xl items-center justify-between gap-6 px-6 py-3.5 lg:px-8">
          <Link
            href="/"
            className="group flex items-center gap-3.5 rounded-2xl py-1.5 pl-1 pr-2.5 -ml-1 transition-[transform,filter] hover:scale-[1.02] hover:brightness-110"
            aria-label="Nibble home"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/goose-happy.png"
              alt=""
              width={44}
              height={44}
              className="h-10 w-10 object-contain drop-shadow-md transition-transform duration-200 group-hover:scale-105 lg:h-11 lg:w-11"
              draggable={false}
            />
            <span className="font-black tracking-tight text-[1.65rem] leading-none sm:text-3xl lg:text-[2rem] lg:leading-none">
              <span className="bg-linear-to-r from-foreground via-primary to-secondary bg-clip-text text-transparent">
                Nibble
              </span>
            </span>
          </Link>

          <ul className="flex items-center gap-1">
            {links.map(({ href, label, Icon }) => {
              const active = pathname === href;
              return (
                <li key={href}>
                  <Link
                    href={href}
                    className={`inline-flex items-center gap-1.5 rounded-xl border-2 px-4 py-2 text-sm font-extrabold transition-all ${
                      active
                        ? "border-primary bg-primary-light text-primary-dark shadow-[0_2px_0_var(--primary)]"
                        : "border-transparent text-muted hover:border-edge hover:text-foreground"
                    }`}
                  >
                    <Icon size={15} aria-hidden />
                    {label}
                  </Link>
                </li>
              );
            })}
          </ul>

          <div className="flex items-center gap-3">
            <Link
              href="/friends"
              className={`inline-flex items-center gap-1.5 rounded-xl border-2 px-3 py-2 text-sm font-extrabold transition-all ${
                pathname === "/friends"
                  ? "border-primary bg-primary-light text-primary-dark shadow-[0_2px_0_var(--primary)]"
                  : "border-transparent text-muted hover:border-edge hover:text-foreground"
              }`}
            >
              <Users size={15} aria-hidden />
              Friends
            </Link>
            <ThemeToggle />
            <NavAuth />
          </div>
        </nav>
      </header>

      {/* ── Mobile bottom bar ── */}
      <nav
        className="fixed right-0 bottom-0 left-0 z-50 border-t-2 border-edge bg-background pb-[env(safe-area-inset-bottom)] md:hidden"
        aria-label="Main"
      >
        <ul className="mx-auto flex max-w-2xl justify-around px-2 py-1">
          {links.map(({ href, label, Icon }) => {
            const active = pathname === href;
            return (
              <li key={href} className="min-w-0 flex-1">
                <Link
                  href={href}
                  className="flex flex-col items-center gap-0.5 py-1.5"
                >
                  <span
                    className={`flex h-9 w-14 items-center justify-center rounded-xl transition-all ${
                      active
                        ? "scale-110 bg-primary-light text-primary-dark"
                        : "text-muted hover:bg-surface"
                    }`}
                  >
                    <Icon size={20} aria-hidden />
                  </span>
                  <span
                    className={`text-[10px] font-extrabold transition-colors ${
                      active ? "text-primary-dark" : "text-muted"
                    }`}
                  >
                    {label}
                  </span>
                </Link>
              </li>
            );
          })}
          <li className="min-w-0 flex-1">
            <Link href="/account" className="flex flex-col items-center gap-0.5 py-1.5">
              <span
                className={`flex h-9 w-14 items-center justify-center rounded-xl transition-all ${
                  pathname === "/account" || pathname === "/login"
                    ? "scale-110 bg-primary-light text-primary-dark"
                    : "text-muted hover:bg-surface"
                }`}
              >
                <User size={20} aria-hidden />
              </span>
              <span
                className={`text-[10px] font-extrabold transition-colors ${
                  pathname === "/account" || pathname === "/login"
                    ? "text-primary-dark"
                    : "text-muted"
                }`}
              >
                Account
              </span>
            </Link>
          </li>
          <li className="min-w-0 flex-1">
            <ThemeToggle mobile />
          </li>
        </ul>
      </nav>
    </>
  );
}
