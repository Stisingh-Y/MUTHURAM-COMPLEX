"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ChevronDown, LayoutDashboard, LogOut, UserRound } from "lucide-react";
import { cn } from "@/lib/utils";
import { ROUTES } from "@/lib/routes";
import { logoutAction } from "@/app/auth/actions";

export type AccountMenuUser = {
  name: string;
  email: string;
  isStaff: boolean;
  links: { href: string; label: string }[];
};

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

/**
 * Account dropdown.
 *
 * Shows the rider's initials rather than another orange surface — the accent is
 * reserved for buying actions. Closes on Escape, on outside pointerdown and
 * after navigation, and returns focus to the trigger on Escape.
 */
export function AccountMenu({ user }: { user: AccountMenuUser }) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const pathname = usePathname();

  // Close on navigation. Adjusted during render rather than in an effect: this is
  // a state reset driven by a value that already changed, so there is nothing to
  // synchronise with an external system.
  const [lastPathname, setLastPathname] = useState(pathname);
  if (pathname !== lastPathname) {
    setLastPathname(pathname);
    setOpen(false);
  }

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setOpen(false);
      triggerRef.current?.focus();
    };

    const onPointerDown = (event: PointerEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    };

    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("pointerdown", onPointerDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("pointerdown", onPointerDown);
    };
  }, [open]);

  return (
    <div ref={containerRef} className="relative hidden lg:block">
      <button
        ref={triggerRef}
        type="button"
        aria-expanded={open}
        aria-haspopup="true"
        aria-controls="account-menu"
        onClick={() => setOpen((value) => !value)}
        className={cn(
          "inline-flex h-10 items-center gap-2 rounded-sm border border-ink-800 pl-1.5 pr-2.5",
          "transition-colors duration-200 hover:border-ink-600 hover:bg-ink-850",
          "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-flame-500",
          open && "border-ink-600 bg-ink-850",
        )}
      >
        <span
          aria-hidden="true"
          className="flex h-7 w-7 items-center justify-center rounded-xs bg-ink-700 font-display text-2xs font-bold text-bone-100"
        >
          {initials(user.name)}
        </span>
        <span className="sr-only">Account menu for {user.name}</span>
        <ChevronDown
          aria-hidden="true"
          className={cn(
            "h-3.5 w-3.5 text-ink-500 transition-transform duration-300 ease-(--ease-out-expo)",
            open && "rotate-180",
          )}
        />
      </button>

      <div
        id="account-menu"
        hidden={!open}
        className="absolute right-0 top-full z-40 w-64 pt-3"
      >
        <div className="animate-[dropdown-in_180ms_var(--ease-out-expo)] overflow-hidden rounded-lg border border-ink-750 bg-ink-900 shadow-float">
          <div className="border-b border-ink-800 px-4 py-3">
            <p className="truncate text-sm font-semibold text-bone-50">{user.name}</p>
            <p className="truncate text-2xs text-ink-500">{user.email}</p>
          </div>

          <ul className="p-1.5">
            {user.links.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="flex items-center gap-2.5 rounded-sm px-2.5 py-2 text-sm text-ink-200 transition-colors duration-200 hover:bg-ink-850 hover:text-bone-50"
                >
                  <UserRound className="h-3.5 w-3.5 text-ink-500" aria-hidden="true" />
                  {link.label}
                </Link>
              </li>
            ))}

            {user.isStaff ? (
              <li>
                <Link
                  href={ROUTES.admin.dashboard}
                  className="flex items-center gap-2.5 rounded-sm px-2.5 py-2 text-sm text-ink-200 transition-colors duration-200 hover:bg-ink-850 hover:text-bone-50"
                >
                  <LayoutDashboard className="h-3.5 w-3.5 text-ink-500" aria-hidden="true" />
                  Dashboard
                </Link>
              </li>
            ) : null}
          </ul>

          <form action={logoutAction} className="border-t border-ink-800 p-1.5">
            <button
              type="submit"
              className="flex w-full items-center gap-2.5 rounded-sm px-2.5 py-2 text-sm text-ink-300 transition-colors duration-200 hover:bg-ink-850 hover:text-bone-50"
            >
              <LogOut className="h-3.5 w-3.5 text-ink-500" aria-hidden="true" />
              Sign out
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}