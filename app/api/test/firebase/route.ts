import { NextResponse } from "next/server";
import { db, isFirebaseConfigured } from "@/lib/firebase";

export async function GET() {
  try {
    // 1. Check if Firebase is configured
    if (!isFirebaseConfigured()) {
      return NextResponse.json({
        status: "error",
        error: "Firebase not configured",
        details: "Check environment variables"
      }, { status: 500 });
    }

    // 2. Test write operation
    const testRef = db!.collection("_test").doc("connection");
    await testRef.set({
      test: true,
      timestamp: new Date().toISOString(),
    });

    // 3. Test read operation
    const doc = await testRef.get();
    const data = doc.data();

    // 4. Clean up
    await testRef.delete();

    // 5. Return success
    return NextResponse.json({
      status: "success",
      message: "Firebase connected and working",
      testData: data,
      config: {
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        hasPrivateKey: !!process.env.FIREBASE_PRIVATE_KEY,
        hasClientEmail: !!process.env.FIREBASE_CLIENT_EMAIL,
      }
    });
  } catch (error: any) {
    return NextResponse.json({
      status: "error",
      error: error.message,
      stack: error.stack
    }, { status: 500 });
  }
}
