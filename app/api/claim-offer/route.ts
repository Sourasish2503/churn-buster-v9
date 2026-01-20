import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { whopsdk } from "@/lib/whop";
import { useCredit, refundCredit } from "@/lib/credits";
import { db } from "@/lib/firebase";

export async function POST(req: Request) {
  let creditDeducted = false;
  let companyId: string | null = null;

  try {
    const { membershipId, companyId: reqCompanyId, experienceId, discountPercent } = await req.json();
    companyId = reqCompanyId;

    // 1. Basic Validation
    if (!membershipId || !companyId || !discountPercent) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Validate discount percent
    const discount = parseInt(discountPercent, 10);
    if (isNaN(discount) || discount < 1 || discount > 100) {
      return NextResponse.json({ error: "Invalid discount percent (1-100)" }, { status: 400 });
    }

    // 2. Verify User (JWT Token)
    const { userId } = await whopsdk.verifyUserToken(await headers());
    
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 3. Ownership Check
    let membership;
    try {
      membership = await whopsdk.memberships.retrieve(membershipId);
      
      if (membership.user?.id !== userId) {
        console.warn(`Security Alert: User ${userId} tried to modify membership ${membershipId}`);
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    } catch (err) {
      console.error("Membership lookup failed:", err);
      return NextResponse.json({ error: "Invalid Membership ID" }, { status: 404 });
    }

    // 4. Check if offer already claimed
    if (membership.metadata?.retention_offer_claimed === "true") {
      return NextResponse.json({ error: "Offer already claimed for this membership" }, { status: 409 });
    }

    // 5. Deduct Credit
    const hasCredits = await useCredit(companyId);
    if (!hasCredits) {
      return NextResponse.json({ error: "No credits remaining" }, { status: 402 });
    }
    creditDeducted = true;

    // 6. Apply Discount - wrapped in try/catch for rollback
    try {
      await whopsdk.memberships.update(membershipId, {
        metadata: {
          retention_offer_claimed: "true",
          retention_discount_percent: discountPercent.toString(),
          retention_date: new Date().toISOString(),
          retention_experience_id: experienceId || "",
        }
      });
    } catch (whopError) {
      // Rollback credit if Whop API fails
      console.error("Whop API failed, rolling back credit:", whopError);
      await refundCredit(companyId);
      creditDeducted = false;
      throw new Error("Failed to apply discount. Credit has been refunded.");
    }

    // 7. Log to Firebase
    if (db) {
      await db.collection("businesses").doc(companyId).collection("saves").add({
        membershipId,
        experienceId: experienceId || null,
        discountPercent: discountPercent.toString(),
        timestamp: new Date().toISOString(),
        savedByUserId: userId,
        cost: 1,
      });
    }

    console.log(`Retention offer applied for membership ${membershipId}`);

    return NextResponse.json({ 
      success: true,
      message: `${discountPercent}% discount recorded. Creator will apply manually.`
    });

  } catch (error: any) {
    console.error("Claim Error:", error);
    
    // Rollback credit if it was deducted but we failed later
    if (creditDeducted && companyId) {
      try {
        await refundCredit(companyId);
        console.log(`Credit refunded for company ${companyId} due to error`);
      } catch (refundError) {
        console.error("Failed to refund credit:", refundError);
      }
    }
    
    return NextResponse.json({ 
      error: error.message || "Internal Server Error" 
    }, { status: 500 });
  }
}
