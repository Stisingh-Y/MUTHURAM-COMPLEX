import "server-only";

import { cache } from "react";
import { prisma } from "@/lib/db";

/**
 * Site settings.
 *
 * A flat key/value table (address, hours, shipping thresholds, policies, the
 * origin story) that non-engineers can change. Reading it through a keyed helper
 * keeps the "missing key" case in one place instead of spread across the footer,
 * the shipping copy and the about page.
 */

export type StoreSettings = {
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
  hoursWeekday: string;
  hoursSunday: string;
  holidays: string;
  freeShippingThresholdPaise: number;
  standardShippingPaise: number;
  standardShippingEta: string;
  expressShippingPaise: number;
  expressShippingEta: string;
  returnsPolicy: string;
  warrantyPolicy: string;
  supportEmail: string;
  supportPhone: string;
  supportHours: string;
  foundedYear: string;
  storyHeadline: string;
  storyBody: string;
};

/** Sensible fallbacks so a fresh, unseeded database still renders a real footer. */
const DEFAULTS: StoreSettings = {
  addressLine1: "42 Race Course Road",
  addressLine2: "Near Circuit House",
  city: "Coimbatore",
  state: "Tamil Nadu",
  pincode: "641001",
  country: "India",
  hoursWeekday: "Monday to Saturday, 10:00 - 20:00",
  hoursSunday: "Sunday, 11:00 - 18:00",
  holidays: "Closed on Pongal and Diwali afternoons",
  freeShippingThresholdPaise: 299900,
  standardShippingPaise: 9900,
  standardShippingEta: "4–7 business days",
  expressShippingPaise: 24900,
  expressShippingEta: "2–3 business days",
  returnsPolicy:
    "15-day returns on unused gear with tags intact. Helmets and inner linings cannot be returned for hygiene reasons unless faulty.",
  warrantyPolicy:
    "2-year manufacturing warranty on most gear, 3 years on the Meridian atelier line. Bring the invoice or order number.",
  supportEmail: "ride@muthuramcomplex.com",
  supportPhone: "+91 90000 00000",
  supportHours: "Monday to Saturday, 10:00 - 20:00 IST",
  foundedYear: "2016",
  storyHeadline: "We started with one helmet and a folding table.",
  storyBody:
    "Muthuram Complex began in 2016 because riders kept buying online and getting counterfeit armour with a certification sticker on the box. We opened a shop on Race Course Road with a simple promise: nothing leaves this counter unless we have checked the batch number ourselves.",
};

function toInt(value: string | undefined, fallback: number): number {
  if (!value) return fallback;
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

/**
 * Deduplicated per request via `cache`, so the header, footer and a page body
 * that all want the store address issue one query, not three.
 */
export const getStoreSettings = cache(async (): Promise<StoreSettings> => {
  const rows = await prisma.siteSetting.findMany();
  const map = new Map(rows.map((row) => [row.key, row.value]));

  return {
    addressLine1: map.get("store.address.line1") ?? DEFAULTS.addressLine1,
    addressLine2: map.get("store.address.line2") ?? DEFAULTS.addressLine2,
    city: map.get("store.address.city") ?? DEFAULTS.city,
    state: map.get("store.address.state") ?? DEFAULTS.state,
    pincode: map.get("store.address.pincode") ?? DEFAULTS.pincode,
    country: map.get("store.address.country") ?? DEFAULTS.country,
    hoursWeekday: map.get("store.hours.weekday") ?? DEFAULTS.hoursWeekday,
    hoursSunday: map.get("store.hours.sunday") ?? DEFAULTS.hoursSunday,
    holidays: map.get("store.holidays") ?? DEFAULTS.holidays,
    freeShippingThresholdPaise: toInt(
      map.get("shipping.freeThresholdPaise"),
      DEFAULTS.freeShippingThresholdPaise,
    ),
    standardShippingPaise: toInt(
      map.get("shipping.standardPaise"),
      DEFAULTS.standardShippingPaise,
    ),
    standardShippingEta: map.get("shipping.standardEta") ?? DEFAULTS.standardShippingEta,
    expressShippingPaise: toInt(map.get("shipping.expressPaise"), DEFAULTS.expressShippingPaise),
    expressShippingEta: map.get("shipping.expressEta") ?? DEFAULTS.expressShippingEta,
    returnsPolicy: map.get("policy.returns") ?? DEFAULTS.returnsPolicy,
    warrantyPolicy: map.get("policy.warranty") ?? DEFAULTS.warrantyPolicy,
    supportEmail: map.get("support.email") ?? DEFAULTS.supportEmail,
    supportPhone: map.get("support.phone") ?? DEFAULTS.supportPhone,
    supportHours: map.get("support.hours") ?? DEFAULTS.supportHours,
    foundedYear: map.get("story.founded") ?? DEFAULTS.foundedYear,
    storyHeadline: map.get("story.headline") ?? DEFAULTS.storyHeadline,
    storyBody: map.get("story.body") ?? DEFAULTS.storyBody,
  };
});

/** `{ line1, line2, city, state, pincode }` on one line, for `address` elements. */
export function formatAddressLine(settings: StoreSettings): string {
  return `${settings.addressLine1}, ${settings.city} ${settings.pincode}`;
}