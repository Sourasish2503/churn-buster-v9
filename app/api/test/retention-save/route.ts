import { NextResponse } from "next/server";
import { db } from "@/lib/firebase";

export async function POST(req: Request) {
  try {
    const { companyId } = await req.json();

    if (!companyId) {
      return NextResponse.json({ error: "companyId required" }, { status: 400 });
    }

    if (!db) {
      return NextResponse.json({ error: "Firebase not configured" }, { status: 500 });
    }

    // Simulate a retention save
    const testSave = {
      membershipId: "test_mem_" + Date.now(),
      experienceId: "test_exp_123",
      discountPercent: "80",
      timestamp: new Date().toISOString(),
      savedByUserId: "test_user_123",
      cost: 1,
      isTest: true, // Flag to identify test data
    };

    // Write to Firebase
    const docRef = await db
      .collection("businesses")
      .doc(companyId)
      .collection("saves")
      .add(testSave);

    // Read it back
    const savedDoc = await docRef.get();
    const savedData = savedDoc.data();

    return NextResponse.json({
      status: "success",
      message: "Test save logged successfully",
      documentId: docRef.id,
      data: savedData,
      path: `businesses/${companyId}/saves/${docRef.id}`
    });
  } catch (error: any) {
    return NextResponse.json({
      status: "error",
      error: error.message,
      stack: error.stack
    }, { status: 500 });
  }
}
