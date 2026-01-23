import { NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { addPaidCredits, useCredit } from "@/lib/credits";

export async function POST(req: Request) {
  try {
    const { companyId, action } = await req.json();

    if (!companyId) {
      return NextResponse.json({ error: "companyId required" }, { status: 400 });
    }

    const results: any = {
      companyId,
      action,
      timestamp: new Date().toISOString(),
    };

    // Test adding credits
    if (action === "add") {
      await addPaidCredits(companyId, 10);
      results.message = "Added 10 credits";
    }

    // Test using credit
    if (action === "use") {
      const success = await useCredit(companyId);
      results.success = success;
      results.message = success ? "Credit used successfully" : "No credits available";
    }

    // Get current balance
    if (db) {
      const creditDoc = await db.collection("credits").doc(companyId).get();
      results.currentBalance = creditDoc.exists ? creditDoc.data()?.balance : 0;
    }

    return NextResponse.json(results);
  } catch (error: any) {
    return NextResponse.json({
      status: "error",
      error: error.message
    }, { status: 500 });
  }
}
