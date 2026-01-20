import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { whopsdk } from "@/lib/whop";
import { db } from "@/lib/firebase";

export async function POST(req: Request) {
  try {
    // 1. Verify User (JWT Token)
    const { userId } = await whopsdk.verifyUserToken(await headers());
    
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { businessId, collectionName, data } = await req.json();
    
    if (!businessId || !collectionName) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    // 2. Verify user has access to this business
    const access = await whopsdk.users.checkAccess(businessId, { id: userId });
    
    if (!access.has_access) {
      return NextResponse.json({ error: "Forbidden: No access to this business" }, { status: 403 });
    }

    // 3. Validate collection name to prevent arbitrary collection writes
    const allowedCollections = ["cancellation_reasons", "saves", "feedback"];
    if (!allowedCollections.includes(collectionName)) {
      return NextResponse.json({ error: "Invalid collection name" }, { status: 400 });
    }

    // 4. Save to Firestore
    if (!db) {
      return NextResponse.json({ error: "Database not configured" }, { status: 503 });
    }

    await db
      .collection("businesses")
      .doc(businessId)
      .collection(collectionName)
      .add({
        ...data,
        loggedByUserId: userId,
        timestamp: new Date().toISOString(),
      });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Log Error:", error);
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}