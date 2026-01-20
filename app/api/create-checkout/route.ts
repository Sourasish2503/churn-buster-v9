import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { whopsdk, verifyAdminAccess } from "@/lib/whop";

// Credit pack configuration
// These should be configured in your Whop dashboard as products
const CREDIT_PACKS: Record<string, { credits: number; priceUsd: number; productId: string }> = {
  "10": { credits: 10, priceUsd: 50, productId: process.env.WHOP_PRODUCT_10_CREDITS || "" },
  "50": { credits: 50, priceUsd: 200, productId: process.env.WHOP_PRODUCT_50_CREDITS || "" },
  "200": { credits: 200, priceUsd: 700, productId: process.env.WHOP_PRODUCT_200_CREDITS || "" },
};

export async function POST(req: Request) {
  try {
    // 1. Verify User
    const { userId } = await whopsdk.verifyUserToken(await headers());
    
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { packSize, companyId } = await req.json();

    if (!packSize || !companyId) {
      return NextResponse.json({ error: "packSize and companyId required" }, { status: 400 });
    }

    // 2. Verify user is admin of the company purchasing credits
    const isAdmin = await verifyAdminAccess(companyId, userId);
    if (!isAdmin) {
      return NextResponse.json({ error: "Admin access required to purchase credits" }, { status: 403 });
    }

    // 3. Validate pack size
    const pack = CREDIT_PACKS[packSize];
    if (!pack) {
      return NextResponse.json({ error: "Invalid pack size" }, { status: 400 });
    }

    // 4. Generate checkout URL
    // For Whop App Store apps, use the product checkout links
    // The company_id is passed as metadata so webhook knows which company to credit
    const checkoutUrl = pack.productId 
      ? `https://whop.com/checkout/${pack.productId}?metadata[company_id]=${companyId}&metadata[pack_size]=${packSize}`
      : null;

    if (!checkoutUrl || !pack.productId) {
      // Fallback: Return pricing info if product IDs not configured
      return NextResponse.json({ 
        error: "Checkout not configured. Contact support.",
        pack: {
          credits: pack.credits,
          priceUsd: pack.priceUsd,
        }
      }, { status: 503 });
    }

    return NextResponse.json({ 
      url: checkoutUrl,
      pack: {
        credits: pack.credits,
        priceUsd: pack.priceUsd,
      }
    });

  } catch (err) {
    console.error("Create checkout error:", err);
    return NextResponse.json({ error: "Failed to create checkout" }, { status: 500 });
  }
}