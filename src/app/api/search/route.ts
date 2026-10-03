import { NextResponse } from "next/server";
import { searchProducts } from "@/lib/data/products";

/**
 * Search suggestions.
 *
 * Thin JSON endpoint used by the header search dialog for live suggestions.
 * The dialog itself is a plain `<form action="/search">`, so search still works
 * with JavaScript disabled — this only makes it feel instant.
 */

export const GET = async function GET(request: Request) {
  const term = new URL(request.url).searchParams.get("q")?.trim() ?? "";

  if (term.length < 2) {
    return NextResponse.json({ products: [] });
  }

  const products = await searchProducts(term, 6);

  return NextResponse.json({
    products: products.map((product) => ({
      slug: product.slug,
      name: product.name,
      brandName: product.brandName,
      categoryName: product.categoryName,
      image: product.image.url,
    })),
  });
};