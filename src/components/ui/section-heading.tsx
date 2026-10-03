"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Section heading — the single header shape used by every band.
 *
 * Premium light-section treatment: 13–14px / .24em / 700 orange eyebrow with
 * a 48px × 2px rule that draws in, a `clamp(32px,4.6vw,64px)` / 800–900 /
 * -0.025em heading (ink `#0F1012`, max 18ch), AA-safe `#4A4D55` description
 * (max 56ch), optional ghost section number ("03"), and a hairline divider
 * with a 64px orange segment.
 *
 * Highlight words inside `title` with `<span className="sh-hl">…</span>` —
 * orange with a 3px underline that draws left→right on reveal.
 *
 * Reveal (plays once, 15% threshold): rule scaleX → eyebrow fade → title
 * mask rise (.9s expo-out) → underline draw → description rise → action
 * fade. Transform/opacity only; reduced-motion shows everything instantly.
 *
 * Tunables: --sh-size (heading clamp), --sh-hl (highlight color),
 * --sh-num-opacity (ghost number opacity).
 */
export function SectionHeading({
  eyebrow,
  title,
  description,
  action,
  align = "left",
  tone = "dark",
  id,
  as: Tag = "h2",
  className,
  titleAs = "display",
  index,
  divider = false,
}: {
  eyebrow?: string | null;
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  align?: "left" | "center";
  /** Which surface this heading sits on. Drives text colour, not layout. */
  tone?: "dark" | "light";
  id?: string;
  as?: "h1" | "h2" | "h3";
  className?: string;
  /** `display` for band-level headlines, `md` for sub-section headings. */
  titleAs?: "display" | "md";
  /** Ghost section number, e.g. "03". Rendered faint behind the header. */
  index?: string;
  /** Hairline divider with an orange segment below the header. */
  divider?: boolean;
}) {
  const dark = tone === "dark";
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      root.dataset.shown = "true";
      return;
    }
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          root.dataset.shown = "true";
          io.disconnect();
        }
      },
      { threshold: 0.15, rootMargin: "0px 0px -10% 0px" },
    );
    io.observe(root);
    return () => io.disconnect();
  }, []);

  return (
    <div ref={rootRef} className={cn("sh", !dark && "sh-light", align === "center" && "sh-center", className)}>
      {index ? (
        <span aria-hidden="true" className="sh-num">
          {index}
        </span>
      ) : null}
      <div
        className={cn(
          "sh-row",
          align === "center" && "sh-row-center",
          action && "sh-has-action",
        )}
      >
        <div className="sh-main">
          {eyebrow ? (
            <p className="sh-eyebrow">
              <span aria-hidden="true" className="sh-rule" />
              <span className="sh-eyebrow-text">{eyebrow}</span>
            </p>
          ) : null}

          <span className="sh-mask">
            <Tag id={id} className={cn("sh-title", titleAs === "md" && "sh-title-md")}>
              {title}
            </Tag>
          </span>

          {description ? (
            <p className="sh-desc">{description}</p>
          ) : null}
        </div>

        {action ? <div className="sh-action">{action}</div> : null}
      </div>

      {divider ? (
        <div aria-hidden="true" className="sh-divider">
          <span className="sh-divider-accent" />
        </div>
      ) : null}

      <style>{`
        .sh{
          --sh-size:clamp(32px, 4.6vw, 64px);
          --sh-hl:#FF5A1F;
          --sh-num-opacity:.04;
          position:relative;
        }
        .sh-row{ display:flex; flex-direction:column; gap:1.25rem; }
        @media (min-width:768px){
          .sh-has-action{ flex-direction:row; align-items:end; justify-content:space-between; gap:2.5rem; }
        }
        .sh-center .sh-row{ align-items:center; text-align:center; }
        .sh-main{ display:flex; flex-direction:column; align-items:flex-start; max-width:100%; }
        .sh-center .sh-main{ align-items:center; }
        /* Eyebrow */
        .sh-eyebrow{
          display:inline-flex; align-items:center; gap:.9rem;
          font-size:13px; letter-spacing:.24em; text-transform:uppercase; font-weight:700;
          color:var(--sh-hl);
        }
        @media (min-width:1024px){ .sh-eyebrow{ font-size:14px; } }
        .sh-rule{
          display:block; width:48px; height:2px; background:var(--sh-hl);
          transform:scaleX(0); transform-origin:left center;
        }
        .sh[data-shown="true"] .sh-rule{ transform:scaleX(1); transition:transform .8s cubic-bezier(.22,1,.36,1) .05s; }
        .sh-eyebrow-text{ opacity:0; }
        .sh[data-shown="true"] .sh-eyebrow-text{ opacity:1; transition:opacity .6s ease .2s; }
        /* Title with mask reveal (light bands: near-black; dark bands: bone) */
        .sh-mask{ display:block; overflow:hidden; padding-bottom:.08em; margin-bottom:-.08em; }
        .sh-title{
          display:block;
          font-family:var(--font-display);
          font-size:var(--sh-size); line-height:1.04; letter-spacing:-.025em; font-weight:900;
          color:var(--color-bone-50, #f5f5f2); max-width:18ch; text-wrap:balance;
        }
        .sh-light .sh-title{ color:#0F1012; }
        .sh-title-md{ --sh-size:clamp(1.75rem, 2.6vw, 2.375rem); }
        .sh-mask .sh-title{ transform:translateY(100%); }
        .sh[data-shown="true"] .sh-mask .sh-title{
          transform:translateY(0);
          transition:transform .9s cubic-bezier(.22,1,.36,1) .3s;
        }
        /* Highlighted words */
        .sh-hl{
          position:relative; color:var(--sh-hl); white-space:nowrap;
          background-image:linear-gradient(var(--sh-hl), var(--sh-hl));
          background-size:0% 3px; background-repeat:no-repeat; background-position:left calc(100% - .02em);
        }
        .sh[data-shown="true"] .sh-hl{
          background-size:100% 3px;
          transition:background-size .8s cubic-bezier(.22,1,.36,1) 1s;
        }
        /* Description (light bands: #4A4D55 AA-safe; dark bands: ink-300) */
        .sh-desc{
          margin-top:1.1rem; max-width:56ch;
          font-size:clamp(16px, 1.25vw, 19px); line-height:1.65; font-weight:400;
          color:var(--color-ink-300, #c9ced3);
          opacity:0; transform:translate3d(0,24px,0);
        }
        .sh-light .sh-desc{ color:#4A4D55; }
        .sh[data-shown="true"] .sh-desc{
          opacity:1; transform:none;
          transition:opacity .7s ease 1.15s, transform .7s cubic-bezier(.22,1,.36,1) 1.15s;
        }
        .sh-desc strong{ font-weight:600; color:inherit; }
        .sh-light .sh-desc strong{ color:#0F1012; }
        /* Action: baseline-aligned right, fades in last */
        .sh-action{ display:flex; align-items:center; min-height:44px; opacity:0; }
        .sh[data-shown="true"] .sh-action{ opacity:1; transition:opacity .6s ease 1.3s; }
        .sh-action a{ min-height:44px; display:inline-flex; align-items:center; }
        /* Ghost section number */
        .sh-num{
          position:absolute; top:-.35em; right:0; z-index:0;
          font-family:var(--font-display);
          font-size:clamp(80px, 12vw, 180px); font-weight:900; line-height:1;
          color:rgba(15,16,18,var(--sh-num-opacity));
          pointer-events:none; user-select:none;
        }
        @media (max-width:767px){ .sh-num{ display:none; } }
        .sh:not(.sh-light) .sh-num{ color:rgba(255,255,255,var(--sh-num-opacity)); }
        /* Divider */
        .sh-divider{
          position:relative; margin-top:clamp(32px, 4vw, 56px); height:1px;
          background:rgba(15,16,18,.08);
        }
        .sh:not(.sh-light) .sh-divider{ background:rgba(255,255,255,.08); }
        .sh-divider-accent{
          position:absolute; left:0; top:-1px; width:64px; height:3px; background:var(--sh-hl);
        }
        /* Dark-surface treatment (original palette, upgraded scale only) */
        .sh-eyebrow{ color:var(--color-flame-400, #ff7a44); }
        .sh-light .sh-eyebrow{ color:var(--sh-hl); }
        /* Reduced motion: everything visible, no animation */
        @media (prefers-reduced-motion:reduce){
          .sh-rule{ transform:none; }
          .sh-eyebrow-text, .sh-action{ opacity:1; }
          .sh-mask .sh-title{ transform:none; }
          .sh-desc{ opacity:1; transform:none; }
          .sh-hl{ background-size:100% 3px; }
          .sh[data-shown="true"] .sh-rule, .sh[data-shown="true"] .sh-eyebrow-text,
          .sh[data-shown="true"] .sh-mask .sh-title, .sh[data-shown="true"] .sh-desc,
          .sh[data-shown="true"] .sh-action, .sh[data-shown="true"] .sh-hl{ transition:none; }
        }
      `}</style>
    </div>
  );
}
