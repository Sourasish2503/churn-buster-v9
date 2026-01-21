import { headers } from "next/headers";
import { whopsdk } from "@/lib/whop";
import { db } from "@/lib/firebase";
import { RetentionDashboard } from "@/components/retention-dash";

export const dynamic = "force-dynamic";

// Fetch company's retention config from Firebase
async function getCompanyConfig(companyId: string): Promise<{ discountPercent: string }> {
  const defaultConfig = { discountPercent: "30" };

  if (!db) return defaultConfig;

  try {
    const configDoc = await db.collection("configs").doc(companyId).get();
    if (configDoc.exists) {
      const data = configDoc.data();
      return {
        discountPercent: data?.discountPercent || defaultConfig.discountPercent,
      };
    }
  } catch (err) {
    console.error("Failed to fetch company config:", err);
  }

  return defaultConfig;
}

// Check if company has available credits
async function hasAvailableCredits(companyId: string): Promise<boolean> {
  if (!db) return false;

  try {
    const creditDoc = await db.collection("credits").doc(companyId).get();
    if (creditDoc.exists) {
      const balance = creditDoc.data()?.balance || 0;
      return balance > 0;
    }
  } catch (err) {
    console.error("Failed to check credits:", err);
  }

  return false;
}

export default async function ExperiencePage({
  params,
}: {
  params: Promise<{ experienceId: string }>;
}) {
  const { experienceId } = await params;

  try {
    // 1. Verify user from Whop
    const { userId } = await whopsdk.verifyUserToken(await headers());

    if (!userId) {
      return (
        <div className="flex items-center justify-center min-h-screen bg-black text-white p-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
            <p className="text-gray-400">Unable to verify your Whop session.</p>
          </div>
        </div>
      );
    }

    // 2. Resolve experience → company (CRITICAL FIX)
    const experience = await whopsdk.experiences.retrieve(experienceId);
    const companyId = experience.company.id;

    // 3. Get memberships (scoped to user + company) ✅
    const memberships = await whopsdk.memberships.list({
      user_ids: [userId],
      company_id: companyId,
    });

    // 🔍 DEBUG BLOCK (TEMPORARY — REMOVE AFTER TESTING)
    console.log("🔍 DEBUG:", {
      userId,
      companyId,
      experienceId,
      totalMemberships: memberships.data?.length,
      memberships: memberships.data?.map((m: any) => ({
        id: m.id,
        cancelled: m.cancelled_at,
        expires: m.expires_at,
        plan: m.plan?.name,
        experiences: m.plan?.experiences?.map((e: any) => e.id),
      })),
    });

    // 4. Filter active membership for THIS experience ✅
    const activeMembership = memberships.data?.find((m: any) => {
      if (m.cancelled_at) return false;
      if (m.expires_at && new Date(m.expires_at) < new Date()) return false;

      const hasExperience = m.plan?.experiences?.some(
        (exp: any) => exp.id === experienceId
      );

      return hasExperience;
    });

    if (!activeMembership) {
      return (
        <div className="flex items-center justify-center min-h-screen bg-black text-white p-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">No Active Membership</h1>
            <p className="text-gray-400">
              Could not find an active membership for this experience.
            </p>
          </div>
        </div>
      );
    }

    // 5. Check if company has credits
    const hasCredits = await hasAvailableCredits(companyId);

    if (!hasCredits) {
      return (
        <div className="flex items-center justify-center min-h-screen bg-black text-white p-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">We're Sorry to See You Go</h1>
            <p className="text-gray-400">
              Please contact support to complete your cancellation.
            </p>
          </div>
        </div>
      );
    }

    // 6. Fetch user details
    const user = await whopsdk.users.retrieve(userId);
    const userWithEmail = user as { username?: string; email?: string; id: string };

    const customerName =
      userWithEmail.username ||
      userWithEmail.email?.split("@")[0] ||
      userId.slice(0, 8);

    // 7. Load company config
    const config = await getCompanyConfig(companyId);

    // 8. Render retention dashboard
    return (
      <RetentionDashboard
        membershipId={activeMembership.id}
        companyId={companyId}
        experienceId={experienceId}
        discountPercent={config.discountPercent}
        customerName={customerName}
        isPreviewMode={false}
      />
    );
  } catch (error) {
    console.error("Experience Page Error:", error);

    return (
      <div className="flex items-center justify-center min-h-screen bg-black text-white p-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Error Loading Experience</h1>
          <p className="text-gray-400 text-sm mb-4">
            {error instanceof Error ? error.message : "Unknown error occurred"}
          </p>
          <p className="text-xs text-gray-500">
            Experience ID: {experienceId}
          </p>
        </div>
      </div>
    );
  }
}
