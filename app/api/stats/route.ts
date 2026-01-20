import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { whopsdk } from "@/lib/whop";
import { db } from "@/lib/firebase";

export async function GET(req: Request) {
  try {
    // ✅ 1. VERIFY USER (JWT Token, not cookies)
    const { userId } = await whopsdk.verifyUserToken(await headers());
    
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // ✅ 2. GET COMPANY ID FROM URL
    const { searchParams } = new URL(req.url);
    const companyId = searchParams.get("company_id");
    
    if (!companyId) {
      return NextResponse.json({ error: "company_id required" }, { status: 400 });
    }

    // ✅ 3. VERIFY USER HAS ACCESS TO THIS COMPANY
    const access = await whopsdk.users.checkAccess(companyId, { id: userId });
    
    if (access.access_level !== "admin") {
      return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
    }

    // ✅ 4. FETCH STATS FROM FIREBASE
    if (!db) {
      return NextResponse.json({ credits: 0, saves: 0, logs: [] });
    }

    // Get Credits
    const creditDoc = await db.collection("credits").doc(companyId).get();
    const credits = creditDoc.exists ? creditDoc.data()?.balance || 0 : 0;

    // Get Total Saves
    const savesSnapshot = await db
      .collection("businesses")
      .doc(companyId)
      .collection("saves")
      .get();
    const saves = savesSnapshot.size;

    // Get Recent Logs
    const logsSnapshot = await db
      .collection("businesses")
      .doc(companyId)
      .collection("saves")
      .orderBy("timestamp", "desc")
      .limit(10)
      .get();

    const logs = logsSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    return NextResponse.json({ credits, saves, logs });
  } catch (err) {
    console.error("Stats Error:", err);
    return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 });
  }
}
