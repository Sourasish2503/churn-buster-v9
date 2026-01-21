import { headers } from "next/headers";
import { whopsdk } from "@/lib/whop";
import { db } from "@/lib/firebase";
import { RetentionDashboard } from "@/components/retention-dash";

export const dynamic = 'force-dynamic';

// Fetch company's retention config from Firebase
async function getCompanyConfig(companyId: string): Promise<{ discountPercent: string }> {
  const defaultConfig = { discountPercent: "30" };
  
  if (!db) {
    return defaultConfig;
  }
  
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
  if (!db) {
    return false;
  }
  
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
    // 1. Verify User
    const { userId } = await whopsdk.verifyUserToken(await headers());
    
    if (!userId) {
      return (
        <div className="flex items-center justify-center min-h-screen bg-black text-white p-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
            <p className="text-gray-400">
              Unable to verify your Whop session.
            </p>
          </div>
        </div>
      );
    }

    // 2. Get User's Memberships FIRST
    const memberships = await whopsdk.memberships.list({
      user_ids: [userId],
    });

    // Filter by experienceId manually
    const membership = memberships.data?.find(
      (m: any) => m.plan?.experiences?.some((exp: any) => exp.id === experienceId)
    ) || memberships.data?.[0];
    
    if (!membership) {
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

    // 3. Get Company ID
    const companyId = membership.company.id;

    // 4. Check Access (pass companyId as first param) ✅ FIXED
    const access = await whopsdk.users.checkAccess(companyId, { 
      id: userId
    });
    
    if (!access.has_access) {
      return (
        <div className="flex items-center justify-center min-h-screen bg-black text-white p-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">No Access</h1>
            <p className="text-gray-400">
              You need an active membership to access this experience.
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

    // 6. Get User Details
    const user = await whopsdk.users.retrieve(userId);
    const userWithEmail = user as { username?: string; email?: string; id: string };
    const customerName = userWithEmail.username || 
                        userWithEmail.email?.split('@')[0] || 
                        userId.slice(0, 8);

    // 7. Get Company Config
    const config = await getCompanyConfig(companyId);

    // 8. Render Dashboard
    return (
      <RetentionDashboard
        membershipId={membership.id}
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
          <p className="text-xs text-gray-500">Experience ID: {experienceId}</p>
        </div>
      </div>
    );
  }
}
