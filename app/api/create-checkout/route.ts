import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const CREDIT_PACKS: Record<string, { credits: number; productId: string }> = {
  "10": { credits: 10, productId: "prod_5DYFc5vGQtqe5" },
  "50": { credits: 50, productId: "prod_TrO9TOfBEiZ0f" },
  "200": { credits: 200, productId: "prod_xrPgZwKf6gi9F" },
};

export async function POST(req: Request) {
  try {
    if (!process.env.WHOP_API_KEY) {
      return NextResponse.json(
        { error: "WHOP_API_KEY missing" },
        { status: 500 }
      );
    }

    const body = await req.json().catch(() => null);
    if (!body) {
      return NextResponse.json(
        { error: "Invalid JSON body" },
        { status: 400 }
      );
    }

    const { packSize, companyId } = body;

    if (!packSize || !companyId) {
      return NextResponse.json(
        { error: "packSize and companyId required" },
        { status: 400 }
      );
    }

    const pack = CREDIT_PACKS[packSize];
    if (!pack) {
      return NextResponse.json(
        { error: "Invalid pack size" },
        { status: 400 }
      );
    }

    // ✅ SERVER → WHOP CHECKOUT CREATION
    const res = await fetch("https://api.whop.com/api/v5/checkouts", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.WHOP_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        product_id: pack.productId,
        metadata: {
          company_id: companyId,
          pack_size: packSize,
        },
      }),
    });

    const text = await res.text();

    if (!res.ok) {
      return NextResponse.json(
        { error: text || "Whop checkout failed" },
        { status: res.status }
      );
    }

    const data = JSON.parse(text);

    return NextResponse.json({
      url: data.url,
      credits: pack.credits,
    });
  } catch (err: any) {
    console.error("Checkout fatal error:", err);
    return NextResponse.json(
      { error: "Checkout creation failed" },
      { status: 500 }
    );
  }
}
