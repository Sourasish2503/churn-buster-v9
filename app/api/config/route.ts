import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { whopsdk } from "@/lib/whop";
import { db } from "@/lib/firebase";

// GET: Fetch config for a specific company
export async function GET(req: Request) {
  try {
    // 1. Verify User
    const { userId } = await whopsdk.verifyUserToken(await headers());
    
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Get company_id from URL
    const { searchParams } = new URL(req.url);
    const companyId = searchParams.get("company_id");
    
    if (!companyId) {
      return NextResponse.json({ error: "company_id required" }, { status: 400 });
    }

    // 3. Verify user has access to this company
    const access = await whopsdk.users.checkAccess(companyId, { id: userId });
    
    if (!access.has_access) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // 4. Fetch config from Firestore
    if (!db) {
      return NextResponse.json({ discountPercent: "30" }); // Default fallback
    }

    const configDoc = await db.collection("configs").doc(companyId).get();
    
    if (configDoc.exists) {
      return NextResponse.json(configDoc.data());
    }
    
    // Return default config if none exists
    return NextResponse.json({ discountPercent: "30" });
  } catch (err) {
    console.error("Config GET Error:", err);
    return NextResponse.json({ error: "Failed to fetch config" }, { status: 500 });
  }
}

// POST: Save config (Admin only)
export async function POST(req: Request) {
  try {
    // 1. Verify User
    const { userId } = await whopsdk.verifyUserToken(await headers());
    
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { companyId, discountPercent } = await req.json();
    
    if (!companyId) {
      return NextResponse.json({ error: "companyId required" }, { status: 400 });
    }

    // 2. Verify user is admin of this company
    const access = await whopsdk.users.checkAccess(companyId, { id: userId });
    
    if (access.access_level !== "admin") {
      return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
    }

    // 3. Validate discount percent
    const discount = parseInt(discountPercent, 10);
    if (isNaN(discount) || discount < 1 || discount > 100) {
      return NextResponse.json({ error: "Invalid discount percent (1-100)" }, { status: 400 });
    }

    // 4. Save to Firestore
    if (!db) {
      return NextResponse.json({ error: "Database not configured" }, { status: 503 });
    }

    await db.collection("configs").doc(companyId).set(
      { 
        discountPercent: discountPercent.toString(),
        updatedAt: new Date().toISOString(),
        updatedBy: userId,
      }, 
      { merge: true }
    );
    
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Config POST Error:", err);
    return NextResponse.json({ error: "Failed to save" }, { status: 500 });
  }
}