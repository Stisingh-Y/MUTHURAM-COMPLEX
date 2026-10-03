import { BadgeCheck, Quote } from "lucide-react";
import { SectionHeading } from "@/components/ui/section-heading";
import { Reveal } from "@/components/ui/reveal";
import { StarRating } from "@/components/ui/star-rating";
import { formatDate } from "@/lib/utils";
import type { ReviewView } from "@/lib/data/products";

export function ReviewGrid({ reviews }: { reviews: ReviewView[] }) {
  if (reviews.length === 0) return null;

  /*
   * White band.
   *
   * The page alternates dark and light to pace the scroll, and this is the
   * lightest moment before the dark newsletter closes it. Reviews on white
   * also read as testimonials on a product page rather than as another dark
   * content block — the contrast is what makes them feel like a distinct kind
   * of content.
   */
  return (
    <section aria-labelledby="reviews-title" className="bg-paper py-section text-ink-950">
      <div className="container-page">
        <SectionHeading
          id="reviews-title"
          tone="light"
          eyebrow="From the counter"
          title="What riders say after the first long ride"
          align="center"
        />

        <ul className="mt-10 grid gap-4 sm:mt-12 sm:grid-cols-2 lg:grid-cols-3 lg:gap-5">
          {reviews.map((review, index) => (
            <Reveal
              as="li"
              key={review.id}
              delay={Math.min(index * 0.06, 0.3)}
              className="flex flex-col gap-4 border border-ink-950/10 bg-white p-6 transition-[border-color,transform] duration-300 ease-(--ease-out-expo) hover:-translate-y-1 hover:border-flame-600/40 motion-reduce:hover:translate-y-0"
            >
              <div className="flex items-center justify-between gap-3">
                <StarRating value={review.rating} showValue={false} tone="light" />
                <Quote aria-hidden="true" className="h-5 w-5 shrink-0 text-flame-600/50" />
              </div>

              {review.title ? (
                <h3 className="font-display text-base leading-snug font-extrabold tracking-[-0.02em] text-ink-950">
                  {review.title}
                </h3>
              ) : null}

              <p className="flex-1 text-sm leading-relaxed text-ink-600 line-clamp-3-fixed">
                {review.body}
              </p>

              <footer className="flex items-center justify-between gap-3 border-t border-ink-950/10 pt-4">
                <div className="flex min-w-0 flex-col">
                  <span className="truncate text-2xs font-semibold text-ink-950">{review.authorName}</span>
                  <time dateTime={review.createdAt.toISOString()} className="text-2xs text-ink-500">
                    {formatDate(review.createdAt)}
                  </time>
                </div>

                {review.isVerifiedPurchase ? (
                  <span className="inline-flex shrink-0 items-center gap-1 border border-success-500/35 bg-success-500/10 px-2 py-0.5 text-2xs font-semibold uppercase tracking-[0.08em] text-success-600">
                    <BadgeCheck className="h-3 w-3" aria-hidden="true" />
                    <span className="sr-only">Verified purchase. </span>Verified
                  </span>
                ) : null}
              </footer>
            </Reveal>
          ))}
        </ul>
      </div>
    </section>
  );
}
