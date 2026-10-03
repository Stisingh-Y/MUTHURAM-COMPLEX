"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import { Loader2, Search, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { ROUTES } from "@/lib/routes";
import { SafeImage } from "@/components/ui/safe-image";
import { getLqipOrTile } from "@/lib/image-placeholders";

type Suggestion = {
  slug: string;
  name: string;
  brandName: string;
  categoryName: string;
  image: string;
};

const POPULAR = ["Helmets", "Rain gear", "Armour", "Touring", "Gloves", "Boots"];

/**
 * Search dialog.
 *
 * Progressive enhancement: the form submits to `/search` with plain `GET`, so
 * search works with no JavaScript. This component only adds a dialog shell,
 * debounced suggestions and `/` / `⌘K` shortcuts.
 */
export function SearchDialog({ compact = false }: { compact?: boolean }) {
  const [open, setOpen] = useState(false);
  const [term, setTerm] = useState("");
  const [results, setResults] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const dialogTitleId = useId();
  const router = useRouter();
  const pathname = usePathname();

  // Close on navigation. Adjusted during render rather than in an effect: this is
  // a state reset driven by a value that already changed, so there is nothing to
  // synchronise with an external system.
  const [lastPathname, setLastPathname] = useState(pathname);
  if (pathname !== lastPathname) {
    setLastPathname(pathname);
    setOpen(false);
  }

  /* Global shortcut: "/" or ⌘K / Ctrl-K focuses search. */
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const isTyping =
        target?.tagName === "INPUT" ||
        target?.tagName === "TEXTAREA" ||
        target?.isContentEditable === true;

      if (event.key === "/" && !isTyping) {
        event.preventDefault();
        setOpen(true);
      }

      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen(true);
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  /* Focus the field on open and lock background scroll while it is up. */
  useEffect(() => {
    if (!open) return;

    inputRef.current?.focus();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  /* Drop stale suggestions the moment the query stops being searchable. Adjusted
     during render — the results are already stale, so there is nothing to fetch
     and no effect to run. */
  const trimmed = term.trim();
  const [lastTerm, setLastTerm] = useState(trimmed);
  if (trimmed !== lastTerm) {
    setLastTerm(trimmed);
    if (trimmed.length < 2) {
      setResults([]);
      setLoading(false);
    }
  }

  /* Debounced suggestions. Every setState here happens inside the timer
     callback, i.e. after the effect body has finished — the effect itself only
     schedules work. */
  useEffect(() => {
    if (trimmed.length < 2) return;

    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/search?q=${encodeURIComponent(trimmed)}`, {
          signal: controller.signal,
        });
        const data: { products: Suggestion[] } = await response.json();
        setResults(data.products ?? []);
      } catch {
        /* Aborted or offline — the plain form submit still works. */
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => {
      controller.abort();
      clearTimeout(timer);
    };
  }, [trimmed]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        className={cn(
          "group inline-flex items-center gap-2 rounded-sm border border-ink-800 text-ink-300",
          "transition-colors duration-200 hover:border-ink-600 hover:bg-ink-850 hover:text-bone-50",
          "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-flame-500",
          compact ? "h-10 w-10 justify-center" : "h-10 w-full justify-start px-3.5 lg:w-64",
        )}
      >
        <Search className="h-4 w-4 shrink-0" aria-hidden="true" />
        {!compact ? (
          <>
            <span className="flex-1 text-left text-xs">Search gear</span>
            <kbd className="hidden rounded-sm border border-ink-700 bg-ink-900 px-1.5 py-0.5 font-mono text-[0.625rem] text-ink-500 xl:block">
              /
            </kbd>
          </>
        ) : (
          <span className="sr-only">Search products</span>
        )}
      </button>

      {open ? (
        <div className="fixed inset-0 z-[100] flex items-start justify-center">
          <button
            type="button"
            aria-label="Close search"
            onClick={() => setOpen(false)}
            className="absolute inset-0 animate-[fade-in_160ms_ease-out] cursor-default bg-ink-950/85 backdrop-blur-sm"
          />

          <div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={dialogTitleId}
            className="relative w-full animate-[dialog-in_240ms_var(--ease-out-expo)] overflow-hidden border-b border-ink-750 bg-[#111214] shadow-float"
          >
            <div className="mx-auto w-full max-w-[1280px] px-5 sm:px-8">
            <h2 id={dialogTitleId} className="sr-only">
              Search products
            </h2>

            <form action={ROUTES.search} className="flex items-center gap-3 border-b border-ink-800 px-4">
              <Search className="h-4 w-4 shrink-0 text-ink-500" aria-hidden="true" />
              <label htmlFor="site-search" className="sr-only">
                Search for helmets, jackets, boots and accessories
              </label>
              <input
                id="site-search"
                ref={inputRef}
                name="q"
                type="search"
                autoComplete="off"
                value={term}
                onChange={(event) => setTerm(event.target.value)}
                placeholder="Search helmets, jackets, armour…"
                className="h-14 flex-1 bg-transparent text-sm text-bone-50 placeholder:text-ink-500 focus:outline-none"
              />
              {loading ? (
                <Loader2 className="h-4 w-4 shrink-0 animate-spin text-ink-500" aria-hidden="true" />
              ) : null}
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close search"
                className="shrink-0 rounded-xs p-1 text-ink-500 transition-colors hover:text-bone-50"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </form>

            <div className="max-h-[52svh] overflow-y-auto">
              {term.trim().length < 2 ? (
                <div className="px-4 py-5">
                  <p className="label-caps mb-3 text-ink-500">Popular searches</p>
                  <ul className="flex flex-wrap gap-2">
                    {POPULAR.map((word) => (
                      <li key={word}>
                        <button
                          type="button"
                          onClick={() => setTerm(word)}
                          className="border border-ink-700 px-3 py-1.5 text-2xs font-semibold uppercase tracking-[0.08em] text-ink-300 transition-colors hover:border-flame-500 hover:text-flame-300"
                        >
                          {word}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : results.length > 0 ? (
                <>
                  <p className="label-caps px-4 pt-4 text-ink-500" role="status" aria-live="polite">
                    {results.length} {results.length === 1 ? "match" : "matches"}
                  </p>
                  <ul className="p-2">
                    {results.map((result) => (
                      <li key={result.slug}>
                        <Link
                          href={ROUTES.product(result.slug)}
                          className="flex items-center gap-3.5 rounded-sm p-2 transition-colors duration-200 hover:bg-ink-850"
                        >
                          <span className="relative h-14 w-12 shrink-0 overflow-hidden rounded-xs bg-ink-850">
                            <SafeImage
                              src={result.image}
                              alt=""
                              fill
                              sizes="48px"
                              loading="lazy"
                              placeholder="blur"
                              blurDataURL={getLqipOrTile(result.image)}
                              className="object-cover"
                            />
                          </span>
                          <span className="flex min-w-0 flex-col">
                            <span className="label-caps text-ink-500">{result.brandName}</span>
                            <span className="truncate text-sm font-semibold text-bone-50">{result.name}</span>
                            <span className="text-2xs text-ink-500">{result.categoryName}</span>
                          </span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                  <div className="border-t border-ink-800 p-3">
                    <button
                      type="button"
                      onClick={() => router.push(`${ROUTES.search}?q=${encodeURIComponent(term.trim())}`)}
                      className="flex w-full items-center justify-center gap-2 rounded-sm py-2 text-2xs font-semibold uppercase tracking-[0.12em] text-flame-400 transition-colors hover:bg-ink-850 hover:text-flame-300"
                    >
                      See all results for “{term.trim()}”
                    </button>
                  </div>
                </>
              ) : !loading ? (
                <div className="px-4 py-8 text-center">
                  <p className="text-sm text-ink-300">
                    No gear matches “<span className="text-bone-50">{term.trim()}</span>”.
                  </p>
                  <p className="mt-1 text-2xs text-ink-500">
                    Try a brand, a category, or a certification like “CE”.
                  </p>
                </div>
              ) : null}
            </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}