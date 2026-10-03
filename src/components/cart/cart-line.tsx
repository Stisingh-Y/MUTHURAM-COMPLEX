"use client";

import Image from "next/image";
import Link from "next/link";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Bookmark, Minus, Plus, Trash2 } from "lucide-react";
import {
  moveSavedItemToCartAction,
  removeCartItemAction,
  saveCartItemAction,
  updateCartItemAction,
  type CartActionState,
} from "@/app/actions/cart";
import { ROUTES } from "@/lib/routes";
import { formatMoney } from "@/lib/utils";
import { getLqipOrTile } from "@/lib/image-placeholders";
import type { CartLineView } from "@/lib/data/cart";

const IDLE_CART: CartActionState = { status: "idle" };

/**
 * One basket row.
 *
 * Every control is a real form posting to the existing cart actions, so the
 * page works without JavaScript; `useFormStatus` only adds pending feedback.
 * Quantity changes submit the stepped value directly — no local state to drift
 * out of sync with the server totals.
 */
export function CartLine({ line }: { line: CartLineView }) {
  const [, updateAction] = useActionState(updateCartItemAction, IDLE_CART);
  const [, saveAction] = useActionState(saveCartItemAction, IDLE_CART);
  const [, removeAction] = useActionState(removeCartItemAction, IDLE_CART);

  return (
    <li className="flex gap-4 border border-ink-850 bg-ink-900/50 p-4 sm:gap-5 sm:p-5">
      <Link
        href={ROUTES.product(line.slug)}
        aria-label={line.name}
        className="relative block h-28 w-24 shrink-0 overflow-hidden border border-ink-800 bg-ink-850 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-flame-500 sm:h-32 sm:w-28"
      >
        <Image
          src={line.image.url}
          alt=""
          fill
          sizes="112px"
          placeholder="blur"
          blurDataURL={getLqipOrTile(line.image.url)}
          className="object-cover"
        />
      </Link>

      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="label-caps text-ink-500">{line.brandName}</p>
            <Link
              href={ROUTES.product(line.slug)}
              className="mt-0.5 block truncate text-sm font-semibold text-bone-50 transition-colors hover:text-flame-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-flame-500 sm:text-base"
            >
              {line.name}
            </Link>
            {line.variantLabel ? (
              <p className="mt-0.5 text-2xs text-ink-400">{line.variantLabel}</p>
            ) : null}
          </div>

          <p className="shrink-0 text-right">
            <span className="block font-display text-base font-extrabold text-bone-50 tabular-nums">
              {formatMoney(line.lineTotalPaise)}
            </span>
            {line.compareAtPricePaise && line.compareAtPricePaise > line.unitPricePaise ? (
              <span className="block text-2xs text-ink-500 line-through tabular-nums">
                {formatMoney(line.compareAtPricePaise * line.quantity)}
              </span>
            ) : null}
          </p>
        </div>

        {!line.isAvailable ? (
          <p role="alert" className="text-2xs font-medium text-danger-400">
            This size is out of stock right now — remove it or save it for later.
          </p>
        ) : null}

        <div className="mt-auto flex flex-wrap items-center gap-2 pt-1">
          <form action={updateAction} className="inline-flex items-stretch overflow-hidden border border-ink-700 bg-ink-900">
            <input type="hidden" name="itemId" value={line.id} />
            <StepButton name="quantity" value={line.quantity - 1} disabled={line.quantity <= 1} label={`Reduce quantity of ${line.name}`}>
              <Minus className="h-3.5 w-3.5" aria-hidden="true" />
            </StepButton>
            <span aria-live="polite" aria-label={`Quantity: ${line.quantity}`} className="flex h-9 min-w-9 items-center justify-center px-2 text-sm font-bold text-bone-50 tabular-nums">
              {line.quantity}
            </span>
            <StepButton name="quantity" value={line.quantity + 1} disabled={line.quantity >= line.maxQuantity} label={`Increase quantity of ${line.name}`}>
              <Plus className="h-3.5 w-3.5" aria-hidden="true" />
            </StepButton>
          </form>

          <form action={saveAction}>
            <input type="hidden" name="itemId" value={line.id} />
            <RowButton label={`Save ${line.name} for later`}>
              <Bookmark className="h-3.5 w-3.5" aria-hidden="true" />
              <span className="hidden sm:inline">Save for later</span>
            </RowButton>
          </form>

          <form action={removeAction}>
            <input type="hidden" name="itemId" value={line.id} />
            <RowButton label={`Remove ${line.name} from cart`}>
              <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
              <span className="hidden sm:inline">Remove</span>
            </RowButton>
          </form>
        </div>
      </div>
    </li>
  );
}

/** A saved-for-later row: move back to the basket, or drop it. */
export function SavedLine({ line }: { line: CartLineView }) {
  const [, moveAction] = useActionState(moveSavedItemToCartAction, IDLE_CART);
  const [, removeAction] = useActionState(removeCartItemAction, IDLE_CART);

  return (
    <li className="flex items-center gap-4 border border-ink-850 bg-ink-900/30 p-4">
      <Link
        href={ROUTES.product(line.slug)}
        aria-label={line.name}
        className="relative block h-16 w-14 shrink-0 overflow-hidden border border-ink-800 bg-ink-850 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-flame-500"
      >
        <Image
          src={line.image.url}
          alt=""
          fill
          sizes="56px"
          placeholder="blur"
          blurDataURL={getLqipOrTile(line.image.url)}
          className="object-cover"
        />
      </Link>

      <div className="min-w-0 flex-1">
        <Link
          href={ROUTES.product(line.slug)}
          className="block truncate text-sm font-semibold text-bone-50 transition-colors hover:text-flame-300"
        >
          {line.name}
        </Link>
        <p className="text-2xs text-ink-400 tabular-nums">{formatMoney(line.unitPricePaise)}</p>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <form action={moveAction}>
          <input type="hidden" name="itemId" value={line.id} />
          <MoveButton label={`Move ${line.name} back to cart`} />
        </form>
        <form action={removeAction}>
          <input type="hidden" name="itemId" value={line.id} />
          <RowButton label={`Remove ${line.name}`}>
            <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
          </RowButton>
        </form>
      </div>
    </li>
  );
}

function StepButton({
  name,
  value,
  disabled,
  label,
  children,
}: {
  name: string;
  value: number;
  disabled?: boolean;
  label: string;
  children: React.ReactNode;
}) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      name={name}
      value={value}
      disabled={disabled || pending}
      aria-label={label}
      className="flex h-9 w-9 items-center justify-center text-ink-300 transition-colors hover:bg-ink-800 hover:text-bone-50 disabled:cursor-not-allowed disabled:opacity-35"
    >
      {children}
    </button>
  );
}

function RowButton({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      aria-label={label}
      disabled={pending}
      className="inline-flex h-9 items-center gap-1.5 border border-ink-700 px-2.5 text-2xs font-semibold uppercase tracking-[0.08em] text-ink-300 transition-colors hover:border-ink-500 hover:text-bone-50 disabled:opacity-45"
    >
      {children}
    </button>
  );
}

function MoveButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      aria-label={label}
      disabled={pending}
      className="inline-flex h-9 items-center bg-flame-500 px-3.5 text-2xs font-bold uppercase tracking-[0.08em] text-ink-950 transition-colors hover:bg-flame-400 disabled:opacity-45"
    >
      {pending ? "Moving…" : "Move to cart"}
    </button>
  );
}
