import { PackageCheck, RefreshCcw, ShieldCheck, Truck, Wrench } from "lucide-react";
import { formatMoney } from "@/lib/utils";

/**
 * Trust strip.
 *
 * The first thing below the hero, before any product. Its job is to answer the
 * two questions a rider has before they will look at a price: is this real, and
 * will it arrive. Five short facts, hairline-separated, no cards and no rounded
 * boxes — a single band of evidence reads as confidence, five tiles read as a
 * template.
 *
 * Dark on purpose: it sits directly under the hero and continues its surface,
 * so the page opens with one continuous dark mass and the first colour change
 * is the category grid. Values come from site settings so a policy change does
 * not need a deploy.
 */
export function TrustStrip({
  freeShippingPaise,
  overlay = false,
}: {
  freeShippingPaise: number;
  /** Glass overlay bar pinned to the hero bottom (video plays behind it). */
  overlay?: boolean;
}) {
  const items = [
    {
      icon: ShieldCheck,
      title: "Batch verified",
      body: "CE armour checked before dispatch",
    },
    {
      icon: Truck,
      title: "Free over " + formatMoney(freeShippingPaise, { compact: true }),
      body: "Flat rate below that, India wide",
    },
    {
      icon: PackageCheck,
      title: "4–7 day delivery",
      body: "Express in 2–3 days",
    },
    {
      icon: RefreshCcw,
      title: "15-day returns",
      body: "Unused gear, tags still on",
    },
    {
      icon: Wrench,
      title: "2-year warranty",
      body: "Honoured at the shop counter",
    },
  ];

  return (
    <section
      aria-label="Why riders buy from us"
      className={
        overlay
          ? "hero-trust relative w-full motion-safe:animate-[hero-trust-in_800ms_var(--ease-out-expo)_both]"
          : "relative mt-20 bg-ink-950"
      }
      style={overlay ? { animationDelay: "720ms" } : undefined}
    >
      <div className={overlay ? "w-full" : "container-page"}>
        <ul className="no-scrollbar hero-trust-list -mx-5 flex snap-x snap-x-mandatory gap-0 overflow-x-auto px-5 lg:mx-0 lg:grid lg:grid-cols-5 lg:gap-0 lg:overflow-visible lg:px-0">
          {items.map((item) => (
            <li
              key={item.title}
              className="flex w-[62vw] shrink-0 snap-start flex-col gap-2 border-b border-t border-white/10 py-6 pr-6 pl-0 sm:w-[38vw] lg:w-auto lg:border-t-0 lg:border-b-0 lg:border-l lg:py-8 lg:pr-7 lg:first:border-l-0 lg:first:pl-0"
            >
              <span className="flex items-center gap-2.5">
                <item.icon aria-hidden="true" className="h-4 w-4 shrink-0 text-flame-500" />
                <span className="text-2xs font-bold tracking-[0.1em] text-bone-50 uppercase">
                  {item.title}
                </span>
              </span>
              <span className="text-2xs leading-relaxed text-ink-400">{item.body}</span>
            </li>
          ))}
        </ul>
      </div>
      {overlay ? (
        <style>{`
          .hero-trust{
            background:rgba(10,11,13,.55);
            backdrop-filter:blur(14px) saturate(140%);
            -webkit-backdrop-filter:blur(14px) saturate(140%);
            border-top:1px solid rgba(255,255,255,.08);
          }
          @supports not ((backdrop-filter:blur(1px)) or (-webkit-backdrop-filter:blur(1px))){
            .hero-trust{ background:rgba(10,11,13,.92); }
          }
          @keyframes hero-trust-in{
            from{ opacity:0; transform:translate3d(0,24px,0); }
            to{ opacity:1; transform:translate3d(0,0,0); }
          }
          @media (prefers-reduced-motion:reduce){
            .hero-trust{ animation:none; }
          }
        `}</style>
      ) : null}
    </section>
  );
}
