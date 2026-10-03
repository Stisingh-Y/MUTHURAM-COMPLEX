import { Star } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ReviewView } from "@/lib/data/products";

/**
 * Review list.
 *
 * Verified purchases are marked explicitly — an unverified five-star wall is the
 * easiest thing on the internet to fake, and saying so is worth more than the
 * stars themselves.
 */
export function ProductReviews({
  reviews,
  ratingBreakdown,
  ratingAverage,
  reviewCount,
}: {
  reviews: ReviewView[];
  ratingBreakdown: { rating: number; count: number }[];
  ratingAverage: number;
  reviewCount: number;
}) {
  const total = reviewCount > 0 ? reviewCount : ratingBreakdown.reduce((sum, row) => sum + row.count, 0);

  return (
    <section aria-labelledby="reviews-heading" className="flex flex-col gap-8 lg:flex-row lg:gap-14">
      <div className="lg:w-64 lg:shrink-0">
        <h2 id="reviews-heading" className="font-display text-xl font-extrabold tracking-[-0.01em] text-bone-50">
          Rider reviews
        </h2>

        <div className="mt-4 flex items-baseline gap-2">
          <span className="font-display text-5xl leading-none font-extrabold tracking-[-0.03em] text-bone-50 tabular-nums">
            {ratingAverage > 0 ? ratingAverage.toFixed(1) : "—"}
          </span>
          <span className="text-sm text-ink-400">
            out of 5
            <span className="block text-2xs text-ink-500">
              {total === 0 ? "No reviews yet" : `${total.toLocaleString("en-IN")} review${total === 1 ? "" : "s"}`}
            </span>
          </span>
        </div>

        {total > 0 ? (
          <ul className="mt-6 flex flex-col gap-2">
            {[5, 4, 3, 2, 1].map((star) => {
              const count = ratingBreakdown.find((row) => row.rating === star)?.count ?? 0;
              const percent = total === 0 ? 0 : Math.round((count / total) * 100);

              return (
                <li key={star} className="flex items-center gap-2.5">
                  <span className="w-6 shrink-0 text-2xs text-ink-400 tabular-nums">{star}★</span>
                  <span
                    aria-hidden="true"
                    className="h-1.5 flex-1 overflow-hidden rounded-full bg-ink-800"
                  >
                    <span
                      className="block h-full rounded-full bg-flame-500"
                      style={{ width: `${percent}%` }}
                    />
                  </span>
                  <span className="w-8 shrink-0 text-right text-2xs text-ink-500 tabular-nums">
                    {count}
                  </span>
                  <span className="sr-only">
                    {star} star: {count} review{count === 1 ? "" : "s"}
                  </span>
                </li>
              );
            })}
          </ul>
        ) : null}
      </div>

      <div className="min-w-0 flex-1">
        {reviews.length === 0 ? (
          <div className="border border-dashed border-ink-750 bg-ink-900/50 px-6 py-10 text-center">
            <Star aria-hidden="true" className="mx-auto h-5 w-5 text-ink-700" />
            <p className="mt-3 font-display text-base font-bold text-bone-50">
              Nobody has reviewed this yet
            </p>
            <p className="mx-auto mt-1.5 max-w-sm text-sm leading-relaxed text-ink-400">
              If you have ridden in it, we would like to hear how it held up. Reviews are only shown
              once a verified purchase is confirmed.
            </p>
          </div>
        ) : (
          <ul className="flex flex-col gap-4">
            {reviews.map((review) => (
              <ReviewRow key={review.id} review={review} />
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

function ReviewRow({ review }: { review: ReviewView }) {
  return (
            <li className="border border-ink-850 bg-ink-900/60 p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-2">
            <span
              aria-label={`${review.rating} out of 5 stars`}
              className="flex items-center gap-0.5"
            >
              {Array.from({ length: 5 }, (_, index) => (
                <Star
                  key={index}
                  aria-hidden="true"
                  className={cn(
                    "h-3.5 w-3.5",
                    index < review.rating ? "fill-flame-500 text-flame-500" : "text-ink-700",
                  )}
                />
              ))}
            </span>
            {review.isVerifiedPurchase ? (
              <span className="rounded-xs border border-success-500/30 bg-success-500/8 px-1.5 py-0.5 text-2xs font-semibold tracking-[0.06em] text-success-400 uppercase">
                Verified
              </span>
            ) : null}
          </div>

          {review.title ? (
            <h3 className="font-display text-base leading-snug font-bold text-bone-50">
              {review.title}
            </h3>
          ) : null}
        </div>

        <time
          dateTime={review.createdAt.toISOString()}
          className="shrink-0 text-2xs text-ink-500"
        >
          {new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", year: "numeric" }).format(
            review.createdAt,
          )}
        </time>
      </div>

      <p className="mt-3 text-sm leading-relaxed text-ink-300">{review.body}</p>

      <p className="mt-3 text-2xs font-semibold text-bone-100">{review.authorName}</p>
    </li>
  );
}