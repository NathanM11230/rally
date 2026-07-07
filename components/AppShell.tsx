"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { ReactNode } from "react";

const navItems = [
  { href: "/", label: "Dashboard" },
  { href: "/calendar", label: "Calendar" },
  { href: "/pay-periods", label: "Pay Periods" },
  { href: "/profile", label: "Profile" },
];

type AppShellProps = {
  children: ReactNode;
};

export function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const isAuthPage = pathname === "/login" || pathname === "/signup";

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  if (isAuthPage) {
    return <>{children}</>;
  }

  return (
    <>
      <header className="app-header">
        <Link className="brand" href="/">
          <span className="brand-mark">R</span>
          <span className="brand-name">Rally</span>
        </Link>

        <nav className="top-nav" aria-label="Main navigation">
          {navItems.map((item) => {
            const isActive =
              item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);

            return (
              <Link
                aria-current={isActive ? "page" : undefined}
                className={`nav-link ${isActive ? "nav-link-active" : ""}`}
                href={item.href}
                key={item.href}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <Link className="button nav-cta" href="/lessons/new">
          New lesson
        </Link>
        <button className="button-secondary nav-logout" type="button" onClick={handleLogout}>
          Log out
        </button>
      </header>

      {children}
    </>
  );
}
