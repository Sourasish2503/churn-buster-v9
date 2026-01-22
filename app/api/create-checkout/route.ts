import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { whopsdk, verifyAdminAccess } from "@/lib/whop";

const CREDIT_PACKS: Record<string, { credits: number; productId: string }> = {
  "10": { 
    credits: 10, 
    productId: "prod_5DYFc5vGQtqe5" // Replace with actual product ID
  },
  "50": { 
    credits: 50, 
    productId: "prod_TrO9TOfBEiZ0f"
  },
  "200": { 
    credits: 200, 
    productId: "prod_xrPgZwKf6gi9F"
  },
};

export async function POST(req: Request) {
  try {
    const { userId } = await whopsdk.verifyUserToken(await headers());
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { packSize, companyId } = await req.json();
    if (!packSize || !companyId) {
      return NextResponse.json({ error: "packSize and companyId required" }, { status: 400 });
    }

    const isAdmin = await verifyAdminAccess(companyId, userId);
    if (!isAdmin) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    const pack = CREDIT_PACKS[packSize];
    if (!pack) {
      return NextResponse.json({ error: "Invalid pack size" }, { status: 400 });
    }

    // ✅ METHOD 1: Direct API call using fetch (Most reliable for App Store apps)
    const response = await fetch("https://api.whop.com/api/v5/checkouts", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.WHOP_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        product_id: pack.productId,
        metadata: {
          company_id: companyId,
          pack_size: packSize,
        },
        success_url: `${process.env.NEXT_PUBLIC_APP_URL || 'https://yourdomain.com'}/dashboard/${companyId}?credits=success`,
        cancel_url: `${process.env.NEXT_PUBLIC_APP_URL || 'https://yourdomain.com'}/dashboard/${companyId}?credits=cancel`,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("Whop API error:", errorData);
      return NextResponse.json({ 
        error: errorData.message || "Failed to create checkout" 
      }, { status: response.status });
    }

    const checkout = await response.json();
    console.log(`Checkout created for company ${companyId}:`, checkout.url);

    return NextResponse.json({
      url: checkout.url,
      pack: {
        credits: pack.credits,
      }
    });
  } catch (err: any) {
    console.error("Checkout creation failed:", err);
    return NextResponse.json({ 
      error: err.message || "Failed to create checkout" 
    }, { status: 500 });
  }
}
