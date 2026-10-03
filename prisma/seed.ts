/**
 * Development seed for MUTHURAM COMPLEX.
 *
 * Idempotent: every write is an upsert keyed on a natural unique column, so
 * running `npm run db:seed` repeatedly converges rather than duplicating.
 *
 * DEMO CONTENT NOTICE
 * The brands, product names, prices, reviews and customer names below are
 * fictional sample data created to exercise the storefront. Reviews are labelled
 * as sample content in the UI (see `ReviewSection`) and must never be presented
 * as real customer reviews in production — delete this seed before go-live.
 */
import { readFileSync } from "node:fs";
import path from "node:path";
import { hashSync } from "bcryptjs";
import { createPrismaClient } from "../src/lib/db-factory";
import {
  BANNERS,
  BRANDS,
  CATEGORIES,
  COLLECTIONS,
  DEMO_REVIEWS,
  PRODUCTS,
  SITE_SETTINGS,
} from "./data/catalog";

// ── env ──────────────────────────────────────────────────────────────────────

function loadEnvFile(file: string): void {
  let raw: string;
  try {
    raw = readFileSync(path.join(process.cwd(), file), "utf8");
  } catch {
    return;
  }
  for (const line of raw.split(/\r?\n/)) {
    const match = /^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)?\s*$/.exec(line);
    if (!match?.[1] || process.env[match[1]] !== undefined) continue;
    let value = (match[2] ?? "").trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    process.env[match[1]] = value;
  }
}

loadEnvFile(".env");
loadEnvFile(".env.local");

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error("DATABASE_URL is not set. Copy .env.example to .env.local first.");
}

const prisma = createPrismaClient(databaseUrl);

// ── helpers ──────────────────────────────────────────────────────────────────

const DAY = 86_400_000;
const daysAgo = (days: number) => new Date(Date.now() - days * DAY);
const daysAhead = (days: number) => new Date(Date.now() + days * DAY);

/** Deterministic pseudo-random in [0,1) so reseeding produces stable data. */
function seededRandom(seed: string): () => number {
  let state = 2166136261;
  for (let i = 0; i < seed.length; i += 1) {
    state ^= seed.charCodeAt(i);
    state = Math.imul(state, 16777619);
  }
  return () => {
    state ^= state << 13;
    state ^= state >>> 17;
    state ^= state << 5;
    state >>>= 0;
    return state / 0x100000000;
  };
}

function hashPassword(password: string): string {
  // bcryptjs is pure JS, so this works identically in a plain Node script and
  // in the Next.js server runtime.
  return hashSync(password, 10);
}

// ── seed ─────────────────────────────────────────────────────────────────────

async function seedBrands(): Promise<Map<string, string>> {
  const ids = new Map<string, string>();
  for (const brand of BRANDS) {
    const record = await prisma.brand.upsert({
      where: { slug: brand.slug },
      update: {
        name: brand.name,
        description: brand.description,
        position: brand.position,
        logo: `/images/brands/${brand.slug}/logo-dark.svg`,
      },
      create: {
        name: brand.name,
        slug: brand.slug,
        description: brand.description,
        position: brand.position,
        logo: `/images/brands/${brand.slug}/logo-dark.svg`,
      },
    });
    ids.set(brand.slug, record.id);
  }
  return ids;
}

async function seedCategories(): Promise<Map<string, string>> {
  const ids = new Map<string, string>();
  for (const category of CATEGORIES) {
    const record = await prisma.category.upsert({
      where: { slug: category.slug },
      update: {
        name: category.name,
        shortDescription: category.shortDescription,
        description: category.description,
        position: category.position,
        isFeatured: category.isFeatured,
        image: `/images/categories/${category.slug}.webp`,
        seoTitle: `${category.name} — Muthuram Complex`,
        seoDescription: category.shortDescription,
      },
      create: {
        name: category.name,
        slug: category.slug,
        shortDescription: category.shortDescription,
        description: category.description,
        position: category.position,
        isFeatured: category.isFeatured,
        image: `/images/categories/${category.slug}.webp`,
        seoTitle: `${category.name} — Muthuram Complex`,
        seoDescription: category.shortDescription,
      },
    });
    ids.set(category.slug, record.id);
  }
  return ids;
}

async function seedProducts(brandIds: Map<string, string>, categoryIds: Map<string, string>): Promise<void> {
  for (const [index, product] of PRODUCTS.entries()) {
    const brandId = brandIds.get(product.brand);
    const categoryId = categoryIds.get(product.category);
    if (!brandId || !categoryId) {
      throw new Error(`Product ${product.slug} references a missing brand or category.`);
    }

    await prisma.product.upsert({
      where: { slug: product.slug },
      update: {
        name: product.name,
        sku: product.sku,
        brandId,
        categoryId,
        shortDescription: product.shortDescription,
        description: product.description,
        material: product.material,
        careInstructions: product.careInstructions,
        warrantyMonths: product.warrantyMonths,
        returnDays: product.returnDays,
        featuresJson: JSON.stringify(product.features),
        specsJson: JSON.stringify(product.specs),
        tagsJson: JSON.stringify(product.tags),
        basePricePaise: product.basePricePaise,
        compareAtPricePaise: product.compareAtPricePaise ?? null,
        ratingAverage: product.rating,
        ratingCount: product.ratingCount,
        soldCount: product.soldCount,
        isPublished: true,
        isFeatured: product.isFeatured ?? false,
        isNew: product.isNew ?? false,
        isBestSeller: product.isBestSeller ?? false,
        publishedAt: daysAgo(product.publishedDaysAgo),
        seoTitle: `${product.name} — ${product.shortDescription}`.slice(0, 70),
        seoDescription: product.shortDescription,
      },
      create: {
        name: product.name,
        slug: product.slug,
        sku: product.sku,
        brandId,
        categoryId,
        shortDescription: product.shortDescription,
        description: product.description,
        material: product.material,
        careInstructions: product.careInstructions,
        warrantyMonths: product.warrantyMonths,
        returnDays: product.returnDays,
        featuresJson: JSON.stringify(product.features),
        specsJson: JSON.stringify(product.specs),
        tagsJson: JSON.stringify(product.tags),
        basePricePaise: product.basePricePaise,
        compareAtPricePaise: product.compareAtPricePaise ?? null,
        ratingAverage: product.rating,
        ratingCount: product.ratingCount,
        soldCount: product.soldCount,
        isPublished: true,
        isFeatured: product.isFeatured ?? false,
        isNew: product.isNew ?? false,
        isBestSeller: product.isBestSeller ?? false,
        publishedAt: daysAgo(product.publishedDaysAgo),
        seoTitle: `${product.name} — ${product.shortDescription}`.slice(0, 70),
        seoDescription: product.shortDescription,
        createdAt: daysAgo(product.publishedDaysAgo),
      },
    });

    const saved = await prisma.product.findUniqueOrThrow({ where: { slug: product.slug } });

    // Images: main, detail, angle
    await prisma.productImage.deleteMany({ where: { productId: saved.id } });
    await prisma.productImage.createMany({
      data: [
        {
          productId: saved.id,
          url: `/images/products/${product.slug}/main.webp`,
          alt: `${product.name}, front three-quarter view`,
          position: 0,
        },
        {
          productId: saved.id,
          url: `/images/products/${product.slug}/detail.webp`,
          alt: `${product.name}, material and stitching detail close-up`,
          position: 1,
        },
        {
          productId: saved.id,
          url: `/images/products/${product.slug}/angle.webp`,
          alt: `${product.name}, secondary technical angle`,
          position: 2,
        },
      ],
    });

    // Variants: one per (size, primary colour). Sizes that are out of stock in
    // the catalog get quantity 0 so the UI can demonstrate that state.
    await prisma.productVariant.deleteMany({ where: { productId: saved.id } });
    const random = seededRandom(product.sku);

    for (const [sizeIndex, size] of product.sizes.entries()) {
      const colour = product.colors[sizeIndex % product.colors.length]!;
      // Larger sizes carry a small premium on a handful of products.
      const sizePremium = sizeIndex >= product.sizes.length - 2 ? 5000 : 0;

      await prisma.productVariant.create({
        data: {
          productId: saved.id,
          sku: `${product.sku}-${size.toUpperCase().replace(/[^A-Z0-9]/g, "")}`,
          size,
          color: colour.name,
          colorHex: colour.hex,
          pricePaise: product.basePricePaise + sizePremium,
          compareAtPricePaise: product.compareAtPricePaise
            ? product.compareAtPricePaise + sizePremium
            : null,
          position: sizeIndex,
          isActive: true,
        },
      });
    }

    const variants = await prisma.productVariant.findMany({ where: { productId: saved.id } });
    for (const variant of variants) {
      const sizeIndex = product.sizes.indexOf(variant.size);
      const rawStock = product.stock[sizeIndex] ?? 0;
      const quantity = Math.max(0, rawStock + Math.round((random() - 0.5) * 4));
      await prisma.inventoryItem.upsert({
        where: { variantId: variant.id },
        update: { productId: saved.id, quantity, reorderPoint: 5 },
        create: {
          productId: saved.id,
          variantId: variant.id,
          quantity,
          reserved: 0,
          reorderPoint: 5,
        },
      });
    }

    // Sample reviews (marked as sample content in the UI).
    await prisma.review.deleteMany({ where: { productId: saved.id } });
    const reviewCount = Math.min(product.reviewSeedCount, DEMO_REVIEWS.length);
    for (let reviewIndex = 0; reviewIndex < reviewCount; reviewIndex += 1) {
      const review = DEMO_REVIEWS[(index + reviewIndex) % DEMO_REVIEWS.length]!;
      const drift = Math.round(random() * 3) - 1;
      await prisma.review.create({
        data: {
          productId: saved.id,
          authorName: review.author,
          rating: Math.min(5, Math.max(3, review.rating + drift)),
          title: review.title,
          body: review.body,
          isVerifiedPurchase: review.verified,
          isApproved: true,
          createdAt: daysAgo(review.daysAgo + reviewIndex * 5),
        },
      });
    }
  }
}

async function seedCollections(categoryIds: Map<string, string>): Promise<void> {
  for (const [index, collection] of COLLECTIONS.entries()) {
    const record = await prisma.collection.upsert({
      where: { slug: collection.slug },
      update: {
        name: collection.name,
        tagline: collection.tagline,
        description: collection.description,
        image: `/media/demo/collections/${collection.slug}.jpg`,
        position: index + 1,
      },
      create: {
        name: collection.name,
        slug: collection.slug,
        tagline: collection.tagline,
        description: collection.description,
        image: `/media/demo/collections/${collection.slug}.jpg`,
        position: index + 1,
      },
    });

    // Membership is derived from the categories each collection spans, keeping
    // the curated grouping and the product grid consistent with each other.
    await prisma.collectionProduct.deleteMany({ where: { collectionId: record.id } });
    const categoryIdsInScope = collection.categories
      .map((slug) => categoryIds.get(slug))
      .filter((id): id is string => Boolean(id));

    const products = await prisma.product.findMany({
      where: { categoryId: { in: categoryIdsInScope }, isPublished: true },
      orderBy: [{ isFeatured: "desc" }, { soldCount: "desc" }],
      take: 8,
      select: { id: true },
    });

    await prisma.collectionProduct.createMany({
      data: products.map((product, position) => ({
        collectionId: record.id,
        productId: product.id,
        position,
      })),
    });
  }
}

async function seedBanners(): Promise<void> {
  for (const [index, banner] of BANNERS.entries()) {
    await prisma.banner.upsert({
      where: { id: `banner-${banner.placement}-${banner.position}` },
      update: {
        eyebrow: banner.eyebrow,
        title: banner.title,
        subtitle: banner.subtitle,
        imageUrl: banner.imageUrl,
        mobileImageUrl: banner.mobileImageUrl,
        ctaLabel: banner.ctaLabel,
        ctaHref: banner.ctaHref,
        secondaryCtaLabel: banner.secondaryCtaLabel,
        secondaryCtaHref: banner.secondaryCtaHref,
        theme: banner.theme,
        position: banner.position,
        isActive: true,
      },
      create: {
        id: `banner-${banner.placement}-${banner.position}`,
        placement: banner.placement,
        eyebrow: banner.eyebrow,
        title: banner.title,
        subtitle: banner.subtitle,
        imageUrl: banner.imageUrl,
        mobileImageUrl: banner.mobileImageUrl,
        ctaLabel: banner.ctaLabel,
        ctaHref: banner.ctaHref,
        secondaryCtaLabel: banner.secondaryCtaLabel,
        secondaryCtaHref: banner.secondaryCtaHref,
        theme: banner.theme,
        position: index + 1,
        isActive: true,
      },
    });
  }
}

async function seedSettings(): Promise<void> {
  for (const [key, value] of Object.entries(SITE_SETTINGS)) {
    await prisma.siteSetting.upsert({
      where: { key },
      update: { value },
      create: { key, value },
    });
  }
}

async function seedCoupons(): Promise<void> {
  const coupons = [
    {
      code: "RIDE10",
      description: "10% off any order above ₹2,000. New riders welcome.",
      discountType: "PERCENT",
      value: 10,
      minOrderPaise: 200000,
      maxDiscountPaise: 150000,
      startsAt: daysAgo(60),
      expiresAt: daysAhead(120),
      usageLimit: 500,
      perUserLimit: 2,
    },
    {
      code: "MONSOON15",
      description: "Flat 15% off waterproof gear during the monsoon season.",
      discountType: "PERCENT",
      value: 15,
      minOrderPaise: 400000,
      maxDiscountPaise: 250000,
      startsAt: daysAgo(20),
      expiresAt: daysAhead(45),
      usageLimit: 300,
      perUserLimit: 1,
    },
    {
      code: "FIRST500",
      description: "₹500 off your first order over ₹1,500.",
      discountType: "FIXED",
      value: 50000,
      minOrderPaise: 150000,
      maxDiscountPaise: null,
      startsAt: daysAgo(365),
      expiresAt: daysAhead(200),
      usageLimit: 1000,
      perUserLimit: 1,
    },
    {
      code: "GEAR5000",
      description: "₹5,000 off when you spend ₹40,000 or more.",
      discountType: "FIXED",
      value: 500000,
      minOrderPaise: 4000000,
      maxDiscountPaise: null,
      startsAt: daysAgo(90),
      expiresAt: daysAhead(90),
      usageLimit: 50,
      perUserLimit: 1,
    },
    {
      code: "EXPIRED20",
      description: "Lapsed campaign — retained for reporting only.",
      discountType: "PERCENT",
      value: 20,
      minOrderPaise: 100000,
      maxDiscountPaise: null,
      startsAt: daysAgo(400),
      expiresAt: daysAgo(30),
      usageLimit: 100,
      perUserLimit: 1,
    },
  ];

  for (const coupon of coupons) {
    await prisma.coupon.upsert({
      where: { code: coupon.code },
      update: coupon,
      create: coupon,
    });
  }
}

async function seedUsers(): Promise<{ adminId: string; customerId: string }> {
  const password = hashPassword("muthuram123");

  const admin = await prisma.user.upsert({
    where: { email: "admin@muthuramcomplex.com" },
    update: { name: "Store Administrator", role: "ADMIN", isBlocked: false },
    create: {
      email: "admin@muthuramcomplex.com",
      passwordHash: password,
      name: "Store Administrator",
      role: "ADMIN",
      emailVerifiedAt: daysAgo(400),
      lastLoginAt: daysAgo(1),
    },
  });

  const customer = await prisma.user.upsert({
    where: { email: "rider@muthuramcomplex.com" },
    update: { name: "Arjun Menon", role: "CUSTOMER", isBlocked: false },
    create: {
      email: "rider@muthuramcomplex.com",
      passwordHash: password,
      name: "Arjun Menon",
      phone: "+91 98400 11223",
      role: "CUSTOMER",
      emailVerifiedAt: daysAgo(200),
      lastLoginAt: daysAgo(3),
    },
  });

  const staff = await prisma.user.upsert({
    where: { email: "workshop@muthuramcomplex.com" },
    update: { name: "Workshop Staff", role: "STAFF" },
    create: {
      email: "workshop@muthuramcomplex.com",
      passwordHash: password,
      name: "Workshop Staff",
      phone: "+91 98400 44556",
      role: "STAFF",
      emailVerifiedAt: daysAgo(180),
    },
  });

  const existingAddress = await prisma.address.count({ where: { userId: customer.id } });
  if (existingAddress === 0) {
    await prisma.address.createMany({
      data: [
        {
          userId: customer.id,
          label: "Home",
          fullName: "Arjun Menon",
          phone: "+91 98400 11223",
          line1: "12 Bashyam Road",
          line2: "Near Saibaba Temple",
          landmark: "Opposite HDFC ATM",
          city: "Coimbatore",
          state: "Tamil Nadu",
          pincode: "641002",
          isDefault: true,
        },
        {
          userId: customer.id,
          label: "Office",
          fullName: "Arjun Menon",
          phone: "+91 98400 11223",
          line1: "Tidal Park, 3rd Floor",
          line2: "Kuzhithurai Main Road",
          landmark: "Reception",
          city: "Coimbatore",
          state: "Tamil Nadu",
          pincode: "641001",
          isDefault: false,
        },
      ],
    });
  }

  await prisma.address.deleteMany({ where: { userId: staff.id } });
  await prisma.address.create({
    data: {
      userId: staff.id,
      label: "Warehouse",
      fullName: "Muthuram Warehouse",
      phone: "+91 98400 44556",
      line1: "14 Industrial Estate",
      line2: "Peelamedu",
      city: "Coimbatore",
      state: "Tamil Nadu",
      pincode: "641030",
      isDefault: true,
    },
  });

  return { adminId: admin.id, customerId: customer.id };
}

interface DemoOrderSpec {
  orderNumber: string;
  userId: string | null;
  email: string;
  name: string;
  status: string;
  paymentStatus: string;
  daysAgo: number;
  lines: { slug: string; size: string; quantity: number }[];
  couponCode?: string;
  shippingMethod: string;
  shippingAddress: Record<string, string>;
}

const DEMO_ORDERS: DemoOrderSpec[] = [
  {
    orderNumber: "MC-260412-4471",
    userId: "CUSTOMER",
    email: "rider@muthuramcomplex.com",
    name: "Arjun Menon",
    status: "DELIVERED",
    paymentStatus: "PAID",
    daysAgo: 21,
    lines: [
      { slug: "vortex-r9-modular-helmet", size: "M", quantity: 1 },
      { slug: "apexline-drygrip-summer-gloves", size: "L", quantity: 1 },
    ],
    shippingMethod: "STANDARD",
    shippingAddress: {
      fullName: "Arjun Menon",
      phone: "+91 98400 11223",
      line1: "12 Bashyam Road",
      line2: "Near Saibaba Temple",
      city: "Coimbatore",
      state: "Tamil Nadu",
      pincode: "641002",
      country: "India",
    },
  },
  {
    orderNumber: "MC-260806-9932",
    userId: "CUSTOMER",
    email: "rider@muthuramcomplex.com",
    name: "Arjun Menon",
    status: "SHIPPED",
    paymentStatus: "PAID",
    daysAgo: 5,
    lines: [{ slug: "strata-stormguard-waterproof-jacket", size: "L", quantity: 1 }],
    couponCode: "RIDE10",
    shippingMethod: "EXPRESS",
    shippingAddress: {
      fullName: "Arjun Menon",
      phone: "+91 98400 11223",
      line1: "Tidal Park, 3rd Floor",
      line2: "Kuzhithurai Main Road",
      city: "Coimbatore",
      state: "Tamil Nadu",
      pincode: "641001",
      country: "India",
    },
  },
  {
    orderNumber: "MC-260825-2210",
    userId: "CUSTOMER",
    email: "rider@muthuramcomplex.com",
    name: "Arjun Menon",
    status: "PENDING",
    paymentStatus: "PENDING",
    daysAgo: 1,
    lines: [
      { slug: "trailforge-voyager-tall-boot", size: "10", quantity: 1 },
      { slug: "ironhaus-vantage-back-protector", size: "L/XL", quantity: 1 },
    ],
    shippingMethod: "STANDARD",
    shippingAddress: {
      fullName: "Arjun Menon",
      phone: "+91 98400 11223",
      line1: "12 Bashyam Road",
      line2: "Near Saibaba Temple",
      city: "Coimbatore",
      state: "Tamil Nadu",
      pincode: "641002",
      country: "India",
    },
  },
  {
    orderNumber: "MC-260828-7745",
    userId: null,
    email: "priyanka.s@example.com",
    name: "Priyanka S",
    status: "OUT_FOR_DELIVERY",
    paymentStatus: "PAID",
    daysAgo: 3,
    lines: [
      { slug: "strata-vantage-airflow-mesh-jacket", size: "M", quantity: 1 },
      { slug: "strata-ridge-textile-riding-pants", size: "32", quantity: 1 },
    ],
    shippingMethod: "STANDARD",
    shippingAddress: {
      fullName: "Priyanka S",
      phone: "+91 90000 12345",
      line1: "8 Anna Salai",
      line2: "Near Metro Station",
      city: "Chennai",
      state: "Tamil Nadu",
      pincode: "600002",
      country: "India",
    },
  },
  {
    orderNumber: "MC-260829-1102",
    userId: null,
    email: "rohit.k@example.com",
    name: "Rohit K",
    status: "CONFIRMED",
    paymentStatus: "PAID",
    daysAgo: 2,
    lines: [{ slug: "meridian-atelier-no-1-helmet", size: "M", quantity: 1 }],
    shippingMethod: "EXPRESS",
    shippingAddress: {
      fullName: "Rohit K",
      phone: "+91 90000 23456",
      line1: "22 Residency Road",
      city: "Bengaluru",
      state: "Karnataka",
      pincode: "560025",
      country: "India",
    },
  },
  {
    orderNumber: "MC-260830-3390",
    userId: null,
    email: "karthik.v@example.com",
    name: "Karthik V",
    status: "CANCELLED",
    paymentStatus: "REFUNDED",
    daysAgo: 4,
    lines: [{ slug: "strata-torch-heated-jacket", size: "L", quantity: 1 }],
    shippingMethod: "STANDARD",
    shippingAddress: {
      fullName: "Karthik V",
      phone: "+91 90000 34567",
      line1: "5 Residency Road",
      city: "Hyderabad",
      state: "Telangana",
      pincode: "500025",
      country: "India",
    },
  },
  {
    orderNumber: "MC-260831-5518",
    userId: null,
    email: "sneha.r@example.com",
    name: "Sneha R",
    status: "PACKED",
    paymentStatus: "PAID",
    daysAgo: 1,
    lines: [
      { slug: "trailforge-voyager-panniers", size: "40 L", quantity: 1 },
      { slug: "driftline-bellows-tank-bag", size: "6–12 L", quantity: 1 },
    ],
    couponCode: "FIRST500",
    shippingMethod: "STANDARD",
    shippingAddress: {
      fullName: "Sneha R",
      phone: "+91 90000 45678",
      line1: "9 Kalyani Nagar",
      city: "Pune",
      state: "Maharashtra",
      pincode: "411014",
      country: "India",
    },
  },
];

async function seedOrders(userIds: { adminId: string; customerId: string }): Promise<void> {
  for (const spec of DEMO_ORDERS) {
    const userId = spec.userId === "CUSTOMER" ? userIds.customerId : null;

    const lines: { productId: string; variantId: string | null; name: string; slug: string; sku: string; image: string; variant: string | null; unitPricePaise: number; quantity: number }[] = [];

    for (const line of spec.lines) {
      const product = await prisma.product.findUniqueOrThrow({
        where: { slug: line.slug },
        include: { images: { orderBy: { position: "asc" }, take: 1 } },
      });
      const variant = await prisma.productVariant.findFirst({
        where: { productId: product.id, size: line.size },
      });
      lines.push({
        productId: product.id,
        variantId: variant?.id ?? null,
        name: product.name,
        slug: product.slug,
        sku: variant?.sku ?? product.sku,
        image: product.images[0]?.url ?? "",
        variant: variant ? `${variant.size} · ${variant.color}` : null,
        unitPricePaise: variant?.pricePaise ?? product.basePricePaise,
        quantity: line.quantity,
      });
    }

    const subtotalPaise = lines.reduce(
      (sum, line) => sum + line.unitPricePaise * line.quantity,
      0,
    );

    let discountPaise = 0;
    if (spec.couponCode) {
      const coupon = await prisma.coupon.findUnique({ where: { code: spec.couponCode } });
      if (coupon) {
        discountPaise =
          coupon.discountType === "PERCENT"
            ? Math.min(
                Math.round((subtotalPaise * coupon.value) / 100),
                coupon.maxDiscountPaise ?? Number.MAX_SAFE_INTEGER,
              )
            : Math.min(coupon.value, subtotalPaise);
      }
    }

    const shippingPaise =
      spec.shippingMethod === "EXPRESS" ? 24900 : subtotalPaise - discountPaise >= 2999000 ? 0 : 9900;
    const totalPaise = subtotalPaise - discountPaise + shippingPaise;
    const placedAt = daysAgo(spec.daysAgo);

    const existing = await prisma.order.findUnique({ where: { orderNumber: spec.orderNumber } });
    if (existing) continue;

    const order = await prisma.order.create({
      data: {
        orderNumber: spec.orderNumber,
        userId,
        email: spec.email,
        status: spec.status,
        paymentStatus: spec.paymentStatus,
        subtotalPaise,
        discountPaise,
        shippingPaise,
        taxPaise: 0,
        totalPaise,
        couponCode: spec.couponCode ?? null,
        shippingMethod: spec.shippingMethod,
        shippingAddressJson: JSON.stringify(spec.shippingAddress),
        estimatedDelivery: daysAhead(6 - spec.daysAgo),
        trackingNumber: ["SHIPPED", "OUT_FOR_DELIVERY", "DELIVERED"].includes(spec.status)
          ? `MCX${Math.floor(100000000 + Math.random() * 899999999)}`
          : null,
        placedAt,
        deliveredAt: spec.status === "DELIVERED" ? daysAgo(spec.daysAgo - 4) : null,
        createdAt: placedAt,
        items: {
          create: lines.map((line) => ({
            productId: line.productId,
            variantId: line.variantId,
            nameSnapshot: line.name,
            slugSnapshot: line.slug,
            skuSnapshot: line.sku,
            imageSnapshot: line.image,
            variantSnapshot: line.variant,
            unitPricePaise: line.unitPricePaise,
            quantity: line.quantity,
            totalPaise: line.unitPricePaise * line.quantity,
          })),
        },
      },
    });

    const timeline: Record<string, { status: string; note: string; at: Date }[]> = {
      DELIVERED: [
        { status: "CONFIRMED", note: "Payment received.", at: placedAt },
        { status: "PROCESSING", note: "Picked and quality checked.", at: daysAgo(spec.daysAgo - 1) },
        { status: "PACKED", note: "Packed at Coimbatore.", at: daysAgo(spec.daysAgo - 2) },
        { status: "SHIPPED", note: "Handed to courier.", at: daysAgo(spec.daysAgo - 3) },
        { status: "OUT_FOR_DELIVERY", note: "Out for delivery.", at: daysAgo(spec.daysAgo - 4) },
        { status: "DELIVERED", note: "Delivered. Signed for by customer.", at: daysAgo(spec.daysAgo - 4) },
      ],
      SHIPPED: [
        { status: "CONFIRMED", note: "Payment received.", at: placedAt },
        { status: "PROCESSING", note: "Picked and quality checked.", at: daysAgo(spec.daysAgo - 1) },
        { status: "PACKED", note: "Packed at Coimbatore.", at: daysAgo(spec.daysAgo - 2) },
        { status: "SHIPPED", note: "Handed to courier.", at: daysAgo(spec.daysAgo - 1) },
      ],
      OUT_FOR_DELIVERY: [
        { status: "CONFIRMED", note: "Payment received.", at: placedAt },
        { status: "PROCESSING", note: "Picked and quality checked.", at: daysAgo(spec.daysAgo - 1) },
        { status: "PACKED", note: "Packed at Coimbatore.", at: daysAgo(spec.daysAgo - 2) },
        { status: "SHIPPED", note: "Handed to courier.", at: daysAgo(spec.daysAgo - 3) },
        { status: "OUT_FOR_DELIVERY", note: "Out for delivery today.", at: placedAt },
      ],
      PACKED: [
        { status: "CONFIRMED", note: "Payment received.", at: placedAt },
        { status: "PROCESSING", note: "Picked and quality checked.", at: placedAt },
        { status: "PACKED", note: "Packed and awaiting pickup.", at: placedAt },
      ],
      CONFIRMED: [{ status: "CONFIRMED", note: "Payment received.", at: placedAt }],
      PENDING: [
        {
          status: "PENDING",
          note: "Order placed, waiting for payment confirmation.",
          at: placedAt,
        },
      ],
      CANCELLED: [
        { status: "CONFIRMED", note: "Payment received.", at: placedAt },
        {
          status: "CANCELLED",
          note: "Cancelled at customer request; refund initiated.",
          at: daysAgo(spec.daysAgo - 1),
        },
      ],
    };

    await prisma.orderEvent.createMany({
      data: (timeline[spec.status] ?? []).map((event) => ({
        orderId: order.id,
        status: event.status,
        note: event.note,
        createdAt: event.at,
      })),
    });

    if (spec.paymentStatus === "PAID" || spec.paymentStatus === "REFUNDED") {
      await prisma.payment.create({
        data: {
          orderId: order.id,
          provider: "RAZORPAY",
          providerOrderId: `order_${order.id.slice(0, 14)}`,
          providerPaymentId:
            spec.paymentStatus === "PAID"
              ? `pay_${Math.random().toString(36).slice(2, 14)}`
              : null,
          amountPaise: totalPaise,
          currency: "INR",
          status: spec.paymentStatus,
          method: spec.shippingMethod === "EXPRESS" ? "UPI" : "CARD",
        },
      });
    } else {
      await prisma.payment.create({
        data: {
          orderId: order.id,
          provider: "RAZORPAY",
          providerOrderId: `order_${order.id.slice(0, 14)}`,
          amountPaise: totalPaise,
          currency: "INR",
          status: "CREATED",
        },
      });
    }
  }
}

async function main(): Promise<void> {
  console.log("Seeding MUTHURAM COMPLEX…");

  const brandIds = await seedBrands();
  console.log(`  brands      : ${brandIds.size}`);

  const categoryIds = await seedCategories();
  console.log(`  categories  : ${categoryIds.size}`);

  await seedProducts(brandIds, categoryIds);
  console.log(`  products    : ${PRODUCTS.length}`);

  await seedCollections(categoryIds);
  console.log(`  collections : ${COLLECTIONS.length}`);

  await seedBanners();
  console.log(`  banners     : ${BANNERS.length}`);

  await seedCoupons();
  console.log("  coupons     : 5");

  await seedSettings();
  console.log(`  settings    : ${Object.keys(SITE_SETTINGS).length}`);

  const userIds = await seedUsers();
  console.log("  users       : 3");

  await seedOrders(userIds);
  console.log(`  orders      : ${DEMO_ORDERS.length}`);

  const productCount = await prisma.product.count();
  const variantCount = await prisma.productVariant.count();
  const imageCount = await prisma.productImage.count();
  const reviewCount = await prisma.review.count();

  console.log("\nSeed complete.");
  console.log(`  products in database : ${productCount}`);
  console.log(`  variants in database : ${variantCount}`);
  console.log(`  product images       : ${imageCount}`);
  console.log(`  sample reviews       : ${reviewCount}`);
  console.log("\nDemo logins (development only):");
  console.log("  admin    admin@muthuramcomplex.com   / muthuram123");
  console.log("  customer rider@muthuramcomplex.com   / muthuram123");
  console.log("  staff    workshop@muthuramcomplex.com / muthuram123");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error: unknown) => {
    console.error("\nSeed failed:", error);
    await prisma.$disconnect();
    process.exit(1);
  });
