import { BadgeCheck, IndianRupee, PackageCheck, RefreshCcw, Wrench } from "lucide-react";
import { SectionHeading } from "@/components/ui/section-heading";
import { Reveal } from "@/components/ui/reveal";
import { NewsletterForm } from "@/components/layout/newsletter-form";
import { formatMoney } from "@/lib/utils";

export function ValueProps({ freeShippingPaise }: { freeShippingPaise: number }) {
  const items = [
    {
      icon: BadgeCheck,
      title: "We check the batch number",
      body: "Every armour insert is pulled, read and logged before it leaves Race Course Road. If the certification does not match the model, it does not get packed.",
    },
    {
      icon: PackageCheck,
      title: "Free shipping, no minimum drama",
      body: `Orders over ${formatMoney(freeShippingPaise)} ship free anywhere in India. Below that it is a flat rate — the same for a helmet and a full kit.`,
    },
    {
      icon: RefreshCcw,
      title: "Fifteen days to change your mind",
      body: "Unused gear with tags still on can come back inside 15 days. Helmet liners are the one exception, for obvious hygiene reasons.",
    },
    {
      icon: Wrench,
      title: "Two-year warranty, honoured in person",
      body: "Manufacturing faults are handled at the shop counter as well as over the phone. Bring the invoice or the order number and we will sort it.",
    },
  ];

  return (
    <section aria-labelledby="why-title" className="bg-warm py-section text-ink-950">
      <div className="container-page">
        <SectionHeading
          id="why-title"
          tone="light"
          eyebrow="Why buy here"
          title="Counter service, online convenience"
          description="The shop on Race Course Road is the same shop. Nothing here is a drop-ship listing."
        />

        {/* Hairline-divided columns rather than boxed cards. A 1px grid of gaps
            over a background colour would draw four separate cards; four
            columns sharing hairlines reads as one argument split into parts. */}
        <ul className="mt-10 grid gap-y-8 border-t border-ink-950/12 pt-8 sm:grid-cols-2 sm:gap-x-8 lg:grid-cols-4">
          {items.map((item, index) => (
            <Reveal as="li" key={item.title} delay={Math.min(index * 0.05, 0.2)}>
              <div className="flex h-full flex-col gap-3">
                <span
                  aria-hidden="true"
                  className="inline-flex h-10 w-10 items-center justify-center text-flame-600"
                >
                  <item.icon className="h-6 w-6" strokeWidth={1.5} />
                </span>

                <h3 className="font-display text-lg leading-tight font-extrabold tracking-[-0.02em] text-ink-950">
                  {item.title}
                </h3>

                <p className="text-sm leading-relaxed text-ink-600">{item.body}</p>
              </div>
            </Reveal>
          ))}
        </ul>
      </div>
    </section>
  );
}

/**
 * Newsletter band.
 *
 * Dark, not orange.
 *
 * This was a full safety-orange block, which made the accent a background rather
 * than an accent, and put two large saturated surfaces — this band and every
 * add-to-cart button on the page — in competition with each other. It is now
 * graphite with a single orange hairline, and the form's submit button is the
 * only orange element inside it. That makes the one thing the rider is meant to
 * do here the only thing on screen that looks like a call to action.
 */
export function NewsletterBand({ freeShippingPaise }: { freeShippingPaise: number }) {
  return (
    <section aria-labelledby="newsletter-title" className="relative isolate overflow-hidden bg-ink-950">
      <div className="bg-grid absolute inset-0 opacity-25" aria-hidden="true" />
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-gradient-to-r from-ink-950 via-ink-950/85 to-ink-950/40"
      />
      <div aria-hidden="true" className="absolute inset-x-0 top-0 h-px bg-flame-500/45" />

      <div className="container-page relative py-section-lg">
        <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
          <div className="flex flex-col gap-4">
            <p className="label-caps inline-flex items-center gap-2.5 text-flame-400">
              <IndianRupee aria-hidden="true" className="h-3.5 w-3.5" />
              ₹{Math.round(freeShippingPaise / 100).toLocaleString("en-IN")} free shipping
            </p>

            <h2
              id="newsletter-title"
              className="max-w-lg text-display-md font-extrabold text-bone-50"
            >
              New gear lands here first
            </h2>

            <p className="max-w-lg text-sm leading-relaxed text-ink-300 sm:text-base">
              One email a month: what just arrived, what is about to sell out, and the monsoon gear we
              would actually recommend. No daily blasts.
            </p>
          </div>

          <div className="lg:pl-8">
            <NewsletterForm source="homepage" id="homepage-newsletter" tone="dark" />
          </div>
        </div>
      </div>
    </section>
  );
}
