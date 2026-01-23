import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    webhookSecretConfigured: !!process.env.WHOP_WEBHOOK_SECRET,
    webhookSecretLength: process.env.WHOP_WEBHOOK_SECRET?.length || 0,
    startsWithWhsec: process.env.WHOP_WEBHOOK_SECRET?.startsWith("whsec_") || false,
    allEnvVars: {
      WHOP_API_KEY: !!process.env.WHOP_API_KEY,
      WHOP_WEBHOOK_SECRET: !!process.env.WHOP_WEBHOOK_SECRET,
      NEXT_PUBLIC_WHOP_APP_ID: !!process.env.NEXT_PUBLIC_WHOP_APP_ID,
      FIREBASE_PRIVATE_KEY: !!process.env.FIREBASE_PRIVATE_KEY,
    }
  });
}
