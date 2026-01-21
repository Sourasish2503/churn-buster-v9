import { headers } from "next/headers";
import crypto from "crypto";
import { addPaidCredits } from "@/lib/credits";
import { db } from "@/lib/firebase";

// ✅ HARDCODED CREDIT TIERS - amount in cents -> credits
// This maps Whop payment amounts to credit values
const CREDIT_TIERS: Record<number, number> = {
  5000: 10,   // $50 = 10 credits
  20000: 50,  // $200 = 50 credits
  70000: 200, // $700 = 200 credits
};

// Calculate credits for any amount (fallback for non-standard amounts)
function calculateCredits(amountCents: number): number {
  // Check exact match first
  if (CREDIT_TIERS[amountCents] !== undefined) {
    return CREDIT_TIERS[amountCents];
  }

  // For non-standard amounts, calculate proportionally ($5 = 1 credit)
  const credits = Math.floor(amountCents / 500);
  return Math.max(credits, 0);
}

// Verify webhook signature using HMAC-SHA256
function verifySignature(rawBody: string, signature: string, secret: string): boolean {
  const expected = crypto
    .createHmac("sha256", secret)
    .update(rawBody)
    .digest("hex");
  const sigBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);

  if (sigBuffer.length !== expectedBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(sigBuffer, expectedBuffer);
}

// Handle payment.succeeded event
async function handlePaymentSucceeded(payment: any): Promise<void> {
  const companyId = payment?.company_id;
  const amount = payment?.final_amount;
  const paymentId = payment?.id;
  const metadata = payment?.metadata || {};

  if (!companyId) {
    console.error("Payment webhook missing company_id:", paymentId);
    return;
  }

  if (typeof amount !== "number" || amount <= 0) {
    console.error("Payment webhook invalid amount:", { paymentId, amount });
    return;
  }

  const creditsToAdd = calculateCredits(amount);
  console.log(`Payment received: company=${companyId}, amount=$${amount / 100}, credits=${creditsToAdd}`);

  if (creditsToAdd > 0) {
    await addPaidCredits(companyId, creditsToAdd);

    // Log the transaction for audit trail
    if (db) {
      await db.collection("businesses").doc(companyId).collection("credit_transactions").add({
        type: "purchase",
        paymentId,
        amountCents: amount,
        creditsAdded: creditsToAdd,
        packSize: metadata.pack_size || null,
        timestamp: new Date().toISOString(),
      });
    }

    console.log(`Added ${creditsToAdd} credits to company ${companyId}`);
  } else {
    console.warn(`Payment amount too low for credits: company=${companyId}, amount=$${amount / 100}`);
  }
}

// Handle membership.went_valid event (app installed)
async function handleMembershipValid(membership: any): Promise<void> {
  const companyId = membership?.company?.id;
  const membershipId = membership?.id;

  if (!companyId) {
    console.log("Membership valid event without company_id");
    return;
  }

  console.log(`App installed for company: ${companyId}`);

  // Initialize company in Firebase if not exists
  if (db) {
    const companyRef = db.collection("businesses").doc(companyId);
    const doc = await companyRef.get();

    if (!doc.exists) {
      await companyRef.set({
        createdAt: new Date().toISOString(),
        membershipId,
        status: "active",
      });

      // Give 3 free credits to new companies
      await addPaidCredits(companyId, 3);
      await db.collection("businesses").doc(companyId).collection("credit_transactions").add({
        type: "welcome_bonus",
        creditsAdded: 3,
        timestamp: new Date().toISOString(),
      });

      console.log(`New company ${companyId} initialized with 3 free credits`);
    }
  }
}

// Handle membership.went_invalid event (app uninstalled or expired)
async function handleMembershipInvalid(membership: any): Promise<void> {
  const companyId = membership?.company?.id;

  if (!companyId) {
    return;
  }

  console.log(`App access revoked for company: ${companyId}`);

  // Update company status in Firebase
  if (db) {
    await db.collection("businesses").doc(companyId).update({
      status: "inactive",
      deactivatedAt: new Date().toISOString(),
    }).catch(() => {
      // Document might not exist
    });
  }
}

export async function POST(req: Request) {
  try {
    const secret = process.env.WHOP_WEBHOOK_SECRET;
    if (!secret) {
      console.error("Missing WHOP_WEBHOOK_SECRET");
      return new Response("Server Misconfigured", { status: 500 });
    }

    // 1. Read raw body
    const rawBody = await req.text();
    const signature = (await headers()).get("x-whop-signature");

    if (!signature) {
      return new Response("Missing Signature", { status: 400 });
    }

    // 2. Verify signature
    if (!verifySignature(rawBody, signature, secret)) {
      console.warn("Invalid webhook signature received");
      return new Response("Invalid Signature", { status: 401 });
    }

    // 3. Parse payload
    let payload;
    try {
      payload = JSON.parse(rawBody);
    } catch (parseError) {
      console.error("Failed to parse webhook payload:", parseError);
      return new Response("Invalid JSON", { status: 400 });
    }

    const action = payload.action;
    const data = payload.data;

    console.log(`Webhook received: ${action}`);

    // 4. Route to appropriate handler
    switch (action) {
      case "payment.succeeded":
        await handlePaymentSucceeded(data);
        break;

      case "membership.went_valid":
        await handleMembershipValid(data);
        break;

      case "membership.went_invalid":
        await handleMembershipInvalid(data);
        break;

      case "membership.metadata_updated":
        // Retention offer was applied - could trigger additional logic here
        console.log("Membership metadata updated:", data?.id);
        break;

      default:
        // Log unhandled events for debugging
        console.log(`Unhandled webhook action: ${action}`);
    }

    return new Response("Webhook Processed", { status: 200 });
  } catch (err) {
    console.error("Webhook Error:", err);
    return new Response("Error", { status: 500 });
  }
}
