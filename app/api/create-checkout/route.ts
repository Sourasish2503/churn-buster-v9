import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { whopsdk, verifyAdminAccess } from "@/lib/whop";

// ✅ HARDCODED CREDIT PACKS - Replace these with your actual Whop product IDs
const CREDIT_PACKS: Record<string, { credits: number; priceUsd: number; productId: string }> = {
  "10": { 
    credits: 10, 
    priceUsd: 50, 
    productId: "plan_TiRTD1hLt3Qms" // Replace with your actual 10-credit product ID
  },
  "50": { 
    credits: 50, 
    priceUsd: 200, 
    productId: "plan_zcRyWFMoC7qq4" // Replace with your actual 50-credit product ID
  },
  "200": { 
    credits: 200, 
    priceUsd: 700, 
    productId: "plan_ZkocUylT3Psgd" // Replace with your actual 200-credit product ID
  },
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

    // 4. Generate checkout URL with metadata
    const checkoutUrl = `https://whop.com/checkout/${pack.productId}?metadata[company_id]=${companyId}&metadata[pack_size]=${packSize}`;

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
