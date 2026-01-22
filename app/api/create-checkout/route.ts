import { NextResponse } from "next/server";

const CREDIT_PLANS: Record<string, string> = {
  "10": "plan_TiRTD1hLt3Qms",   // ✅ REAL PLAN ID
  "50": "plan_zcRyWFMoC7qq4",
  "200": "plan_ZkocUylT3Psgd",
};

export async function POST(req: Request) {
  try {
    const { packSize, companyId } = await req.json();

    if (!packSize || !companyId) {
      return NextResponse.json(
        { error: "packSize and companyId required" },
        { status: 400 }
      );
    }

    const planId = CREDIT_PLANS[packSize];
    if (!planId) {
      return NextResponse.json(
        { error: "Invalid pack size" },
        { status: 400 }
      );
    }

    // ✅ DIRECT WHOP CHECKOUT (APP STORE APPROVED)
    const checkoutUrl =
      `https://whop.com/checkout/${planId}` +
      `?metadata[company_id]=${companyId}` +
      `&metadata[pack_size]=${packSize}`;

    return NextResponse.json({ url: checkoutUrl });
  } catch {
    return NextResponse.json(
      { error: "Failed to create checkout" },
      { status: 500 }
    );
  }
}
