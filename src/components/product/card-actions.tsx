"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { Check, Heart, ShoppingBag } from "lucide-react";
import { cn } from "@/lib/utils";
import { addToCartAction } from "@/app/actions/cart";
import { toggleWishlistAction, type WishlistActionState } from "@/app/actions/wishlist";
import type { CartActionState } from "@/app/actions/cart";

/**
 * Card actions.
 *
 * The wishlist heart and the add-to-cart button, as one small client island
 * inside an otherwise server-rendered product card. Isolating them here means a
 * grid of 24 cards ships one component definition rather than turning every
 * card into its own client boundary — the image, type and price stay on the
 * server and never reach the browser as JS.
 *
 * Optimistic feedback is the point. A rider who taps "add to cart" should see
 * the button confirm in the same frame they tapped it; the header count and the
 * cart totals catch up when the server action resolves. Waiting for the round
 * trip is what makes a store feel slow.
 *
 * Both are real `<form>` elements with hidden inputs, so they submit without
 * JavaScript too — a no-JS rider still adds to the cart, just without the
 * instant confirmation.
 */

/**
 * Idle states.
 *
 * Typed explicitly rather than inlined, so the initial value is checked against
 * each action's declared state type. An accidental rename of a status field is
 * then a compile error instead of a silently wrong button.
 */
const IDLE_WISHLIST: WishlistActionState = { status: "idle" };
const IDLE_CART: CartActionState = { status: "idle" };

export function CardActions({
  productId,
  productName,
  isInStock,
  initialSaved = false,
  tone = "dark",
}: {
  productId: string;
  productName: string;
  isInStock: boolean;
  /** Server-known saved state, so the heart starts correct before hydration. */
  initialSaved?: boolean;
  /** Surface the card sits on. Defaults to dark, which is the catalogue's own
   *  background — the one place a wrong guess would be least visible. */
  tone?: "dark" | "light";
}) {
  const dark = tone === "dark";
  const [wishlistState, wishlistFormAction] = useActionState(toggleWishlistAction, IDLE_WISHLIST);

  // Optimistic mirror of the wishlist state, seeded from the server value so
  // there is no flash of an unfilled heart.
  // Server truth, and the optimistic value riding on top of it while a tap is
  // in flight. `null` means "no opinion, use the server value".
  const [optimistic, setOptimistic] = useState<boolean | null>(null);

  /*
   * Drop the optimistic value when a response arrives, *during render* rather
   * than in an effect. This is the "adjust state when a value changes" pattern
   * from the React docs: there is no external system to subscribe to, so React
   * discards the in-progress render and re-runs it immediately — cheaper than a
   * cascading effect, and it never paints the stale value.
   *
   * Comparing the whole state object guarantees this runs once per response
   * rather than on every render.
   */
  const [lastWishlistState, setLastWishlistState] = useState(wishlistState);
  if (wishlistState !== lastWishlistState) {
    setLastWishlistState(wishlistState);
    setOptimistic(null);
  }

  const serverSaved = wishlistState.status === "success" ? (wishlistState.added ?? false) : null;
  const saved = optimistic ?? serverSaved ?? initialSaved;

  if (!isInStock) return null;

  return (
    <div className="mt-4 flex items-stretch gap-2">
      <form action={wishlistFormAction} className="contents">
        <input type="hidden" name="productId" value={productId} />
        <WishlistButton
          saved={saved}
          dark={dark}
          productName={productName}
          onToggle={(next) => setOptimistic(next)}
        />
      </form>

      <AddToCartControl
        productId={productId}
        productName={productName}
        className="flex-1"
      />
    </div>
  );
}

function WishlistButton({
  saved,
  dark,
  productName,
  onToggle,
}: {
  saved: boolean;
  dark: boolean;
  productName: string;
  /** Receives the value the heart is about to show, so the parent can set it
   *  optimistically before the server responds. */
  onToggle: (next: boolean) => void;
}) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      onClick={() => onToggle(!saved)}
      aria-pressed={saved}
      aria-label={saved ? `Remove ${productName} from wishlist` : `Save ${productName} to wishlist`}
      className={cn(
        "group/wish relative inline-flex h-11 w-11 shrink-0 items-center justify-center border",
        "transition-colors duration-200",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-flame-500",
        saved
          ? "border-flame-500 bg-flame-500/12 text-flame-400"
          : dark
            ? "border-white/12 text-ink-300 hover:border-flame-500/60 hover:text-flame-400"
            : "border-ink-950/15 text-ink-500 hover:border-flame-600 hover:text-flame-600",
      )}
    >
      <Heart
        aria-hidden="true"
        className={cn(
          "h-4 w-4 transition-transform duration-300 ease-(--ease-out-expo)",
          "group-active/wish:scale-90",
          saved && "scale-110 fill-current",
        )}
      />

      <span className="sr-only" role="status">
        {pending ? "Updating wishlist" : saved ? "Saved to wishlist" : ""}
      </span>
    </button>
  );
}

/**
 * Add to cart.
 *
 * `useFormStatus` only reports status for the component that renders the submit
 * button, so this component owns both the form and the button. Two states are
 * tracked deliberately:
 *
 *   requested — set on submit, so the button responds in the same frame.
 *   confirmed — set once the action has resolved, so "Added" appears on
 *               success rather than on optimism, and never lies about a failure.
 */
/**
 * Add to cart.
 *
 * `addToCartAction` is a `useActionState` action (prev state + form data), so it
 * has to be bound through the hook rather than passed straight to `<form
 * action>`. Binding it here also means the returned state is the confirmation
 * signal — the button says "Added" because the server said `success`, not
 * because a timer fired.
 */
function AddToCartControl({
  productId,
  productName,
  className,
}: {
  productId: string;
  productName: string;
  className?: string;
}) {
  const [state, formAction] = useActionState(addToCartAction, IDLE_CART);
  const confirmed = state.status === "success";

  return (
    <form action={formAction} className={className}>
      <input type="hidden" name="productId" value={productId} />
      <input type="hidden" name="quantity" value="1" />

      <AddToCartButton
        confirmed={confirmed}
        failed={state.status === "error"}
        productName={productName}
      />
    </form>
  );
}

/**
 * Submit button.
 *
 * Three visual states: default, confirmed (server returned success), and
 * error (server rejected it). The error state is deliberately restrained — a
 * product card is not the place for a paragraph of explanation, so the message
 * goes to the screen-reader status region and the button itself only shifts to
 * an outline. `useFormStatus` supplies the in-flight state.
 */
function AddToCartButton({
  confirmed,
  failed,
  productName,
}: {
  confirmed: boolean;
  failed: boolean;
  productName: string;
}) {
  const { pending } = useFormStatus();

  return (
    <>
      <button
        type="submit"
        aria-label={`Add ${productName} to cart`}
        className={cn(
          "relative inline-flex h-11 w-full items-center justify-center gap-2 overflow-hidden",
          "text-2xs font-bold tracking-[0.12em] uppercase",
          "transition-colors duration-300 ease-(--ease-out-expo)",
          "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-flame-500",
          confirmed
            ? "bg-success-500 text-ink-950"
            : failed
              ? "bg-transparent text-flame-400 outline outline-1 outline-flame-500/60 hover:bg-flame-500/10"
              : "bg-flame-500 text-ink-950 hover:bg-flame-400",
          pending && !confirmed && "opacity-70",
        )}
      >
        {confirmed ? (
          <>
            <Check aria-hidden="true" className="h-3.5 w-3.5" />
            Added
          </>
        ) : (
          <>
            <ShoppingBag
              aria-hidden="true"
              className={cn(
                "h-3.5 w-3.5 transition-opacity duration-200",
                pending && "opacity-60",
              )}
            />
            Add to cart
          </>
        )}

        {/* Sheen that sweeps once on confirm. Transform-only, so it stays on the
            compositor and costs nothing once it has played. */}
        {confirmed ? (
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-y-0 -left-full w-1/2 bg-white/25 motion-safe:animate-[sheen_600ms_var(--ease-out-expo)]"
          />
        ) : null}
      </button>

      <span className="sr-only" role="status">
        {confirmed ? `${productName} added to cart` : failed ? `${productName} could not be added` : ""}
      </span>
    </>
  );
}