import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { whopsdk, verifyAdminAccess } from "@/lib/whop";

/* ----------------------------------
   CREDIT PACK CONFIG
----------------------------------- */
const CREDIT_PACKS: Record<string, { credits: number; productId: string }> = {
  "10": { credits: 10, productId: "prod_5DYFc5vGQtqe5" },
  "50": { credits: 50, productId: "prod_TrO9TOfBEiZ0f" },
  "200": { credits: 200, productId: "prod_xrPgZwKf6gi9F" },
};

/* ----------------------------------
   CORS HELPERS (CRITICAL)
----------------------------------- */
function corsHeaders(origin: string | null) {
  return {
    "Access-Control-Allow-Origin": origin ?? "",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
  };
}

/* ----------------------------------
   PRE-FLIGHT HANDLER (REQUIRED)
----------------------------------- */
export async function OPTIONS(req: Request) {
  const origin = req.headers.get("origin");
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders(origin),
  });
}

/* ----------------------------------
   POST: CREATE CHECKOUT
----------------------------------- */
export async function POST(req: Request) {
  const origin = req.headers.get("origin");

  try {
    // 1️⃣ Verify Whop user (iframe-safe)
    const { userId } = await whopsdk.verifyUserToken(headers());
    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401, headers: corsHeaders(origin) }
      );
    }

    // 2️⃣ Parse request body
    const { packSize, companyId } = await req.json();
    if (!packSize || !companyId) {
      return NextResponse.json(
        { error: "packSize and companyId required" },
        { status: 400, headers: corsHeaders(origin) }
      );
    }

    // 3️⃣ Admin check
    const isAdmin = await verifyAdminAccess(companyId, userId);
    if (!isAdmin) {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403, headers: corsHeaders(origin) }
      );
    }

    // 4️⃣ Validate credit pack
    const pack = CREDIT_PACKS[packSize];
    if (!pack) {
      return NextResponse.json(
        { error: "Invalid pack size" },
        { status: 400, headers: corsHeaders(origin) }
      );
    }

    // 5️⃣ Create Whop checkout (direct API call = correct)
    const response = await fetch("https://api.whop.com/api/v5/checkouts", {
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
        success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/${companyId}?credits=success`,
        cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/${companyId}?credits=cancel`,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("Whop API error:", errorData);
      return NextResponse.json(
        { error: errorData.message || "Failed to create checkout" },
        { status: response.status, headers: corsHeaders(origin) }
      );
    }

    const checkout = await response.json();

    // 6️⃣ Success
    return NextResponse.json(
      {
        url: checkout.url,
        pack: { credits: pack.credits },
      },
      { headers: corsHeaders(origin) }
    );

  } catch (err: any) {
    console.error("Checkout creation failed:", err);
    return NextResponse.json(
      { error: err.message || "Failed to create checkout" },
      { status: 500, headers: corsHeaders(origin) }
    );
  }
}
