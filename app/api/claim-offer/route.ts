import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { whopsdk } from "@/lib/whop";
import { useCredit, refundCredit } from "@/lib/credits";
import { db } from "@/lib/firebase";

export async function POST(req: Request) {
  let creditDeducted = false;
  let companyId: string | null = null;

  try {
    // ✅ 1. Parse request (cancellationReason added safely)
    const {
      membershipId,
      companyId: reqCompanyId,
      experienceId,
      discountPercent,
      cancellationReason,
    } = await req.json();

    companyId = reqCompanyId;

    // 2. Basic Validation
    if (!membershipId || !companyId || !discountPercent) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const discount = parseInt(discountPercent, 10);
    if (isNaN(discount) || discount < 1 || discount > 100) {
      return NextResponse.json(
        { error: "Invalid discount percent (1-100)" },
        { status: 400 }
      );
    }

    // 3. Verify User (JWT)
    const { userId } = await whopsdk.verifyUserToken(await headers());
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 4. Ownership Check
    let membership;
    try {
      membership = await whopsdk.memberships.retrieve(membershipId);

      if (membership.user?.id !== userId) {
        console.warn(
          `Security Alert: User ${userId} tried to modify membership ${membershipId}`
        );
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    } catch (err) {
      console.error("Membership lookup failed:", err);
      return NextResponse.json(
        { error: "Invalid Membership ID" },
        { status: 404 }
      );
    }

    // 5. Prevent duplicate claims
    if (membership.metadata?.retention_offer_claimed === "true") {
      return NextResponse.json(
        { error: "Offer already claimed for this membership" },
        { status: 409 }
      );
    }

    // 6. Deduct Credit
    const hasCredits = await useCredit(companyId);
    if (!hasCredits) {
      return NextResponse.json(
        { error: "No credits remaining" },
        { status: 402 }
      );
    }
    creditDeducted = true;

    // 7. Apply metadata on Whop (rollback-safe)
    try {
      await whopsdk.memberships.update(membershipId, {
        metadata: {
          retention_offer_claimed: "true",
          retention_discount_percent: discountPercent.toString(),
          retention_date: new Date().toISOString(),
          retention_experience_id: experienceId || "",
          retention_cancellation_reason: cancellationReason || "",
        },
      });
    } catch (whopError) {
      console.error("Whop API failed, rolling back credit:", whopError);
      await refundCredit(companyId);
      creditDeducted = false;
      throw new Error("Failed to apply discount. Credit refunded.");
    }

    // 8. Log to Firebase (cancellationReason included)
    if (db) {
      await db
        .collection("businesses")
        .doc(companyId)
        .collection("saves")
        .add({
          membershipId,
          experienceId: experienceId || null,
          discountPercent: discountPercent.toString(),
          timestamp: new Date().toISOString(),
          claimedAt: new Date().toISOString(),
          savedByUserId: userId,
          cost: 1,
          cancellationReason: cancellationReason || null, // ✅ NEW FIELD
        });
    }

    console.log(`Retention offer applied for membership ${membershipId}`);

    return NextResponse.json({
      success: true,
      message: `${discountPercent}% discount recorded successfully.`,
    });
  } catch (error: any) {
    console.error("Claim Error:", error);

    // Rollback credit if needed
    if (creditDeducted && companyId) {
      try {
        await refundCredit(companyId);
        console.log(`Credit refunded for company ${companyId}`);
      } catch (refundError) {
        console.error("Failed to refund credit:", refundError);
      }
    }

    return NextResponse.json(
      { error: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}
