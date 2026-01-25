import { headers } from "next/headers";
import { whopsdk } from "@/lib/whop";
import { db } from "@/lib/firebase";
import { RetentionDashboard } from "@/components/retention-dash";

export const dynamic = 'force-dynamic';

export default async function ExperiencePage({
  params,
}: {
  params: Promise<{ experienceId: string }>;
}) {
  const { experienceId } = await params;

  // ✅ 1. VERIFY USER TOKEN
  let userId: string | undefined;
  let isPreviewMode = false;
  
  try {
    const verifyResult = await whopsdk.verifyUserToken(await headers());
    userId = verifyResult?.userId;
  } catch (error) {
    console.log("Token verification failed, might be preview mode:", error);
  }

  // ✅ 2. CHECK IF THIS IS PREVIEW/DEMO MODE
  const headersList = await headers();
  const referer = headersList.get("referer") || "";
  const host = headersList.get("host") || "";
  
  // Detect Whop preview mode
  if (referer.includes("whop.com") || host.includes("localhost") || !userId) {
    isPreviewMode = true;
    console.log("Preview/Demo mode detected");
  }

  // ✅ 3. IF PREVIEW MODE - SHOW DEMO VERSION
  if (isPreviewMode) {
    return (
      <RetentionDashboard
        experienceId={experienceId}
        isDemo={true}
        demoData={{
          membershipId: "demo_membership_123",
          companyId: "demo_company_123",
          discountPercent: "80",
          userName: "Demo User",
        }}
      />
    );
  }

  // ✅ 4. PRODUCTION MODE - VERIFY MEMBERSHIP
  if (!userId) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold text-destructive">Unauthorized</h1>
          <p className="text-muted-foreground">
            Could not verify your Whop account. Please access this page through the Whop platform.
          </p>
        </div>
      </div>
    );
  }

  // Get the membership from the experience
  let membership;
  let companyId;
  let discountPercent = "30"; // Default

  try {
    // Fetch experience details to get the company/membership context
    const experience = await whopsdk.experiences.retrieve(experienceId);
    companyId = experience?.company?.id;

    if (!companyId) {
      throw new Error("No company associated with this experience");
    }

    // ✅ FIXED: Get all memberships for this company, then filter by user
    const memberships = await whopsdk.memberships.list({
      company_id: companyId, // ✅ Changed from user_id
    });

    // ✅ FIXED: Filter to find this user's membership
    membership = memberships?.data?.find((m: any) => m.user?.id === userId);

    if (!membership) {
      throw new Error("No active membership found");
    }

    // Get discount configuration from Firebase
    if (db) {
      const configDoc = await db
        .collection("businesses")
        .doc(companyId)
        .collection("config")
        .doc("retention")
        .get();

      if (configDoc.exists) {
        discountPercent = configDoc.data()?.discountPercent || "30";
      }
    }
  } catch (error) {
    console.error("Error fetching membership:", error);
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold text-destructive">No Active Membership</h1>
          <p className="text-muted-foreground">
            Could not find an active membership for this experience.
          </p>
          <p className="text-sm text-muted-foreground">
            Please ensure you have an active subscription to access this page.
          </p>
        </div>
      </div>
    );
  }

  // ✅ 5. RENDER PRODUCTION VERSION
  return (
    <RetentionDashboard
      experienceId={experienceId}
      membershipId={membership.id}
      companyId={companyId}
      discountPercent={discountPercent}
      isDemo={false}
    />
  );
}
