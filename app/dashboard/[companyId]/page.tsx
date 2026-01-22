// ✅ CORRECT imports
import { headers } from "next/headers";
import { whopsdk } from "@/lib/whop";
import AdminDashboardClient from "@/components/admin-dashboard-client";


export const dynamic = 'force-dynamic';

export default async function DashboardPage({
  params,
}: {
  params: Promise<{ companyId: string }>;
}) {
  const { companyId } = await params;

  // ✅ 1. VERIFY USER
  const { userId } = await whopsdk.verifyUserToken(await headers());
  if (!userId) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold text-destructive">Unauthorized</h1>
          <p className="text-muted-foreground">
            Could not verify Whop security token. Please open this app from the Whop Dashboard.
          </p>
        </div>
      </div>
    );
  }

  // ✅ 2. VERIFY ADMIN ACCESS
  const access = await whopsdk.users.checkAccess(companyId, { id: userId });
  if (access.access_level !== "admin") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold text-destructive">Forbidden</h1>
          <p className="text-muted-foreground">
            You must be an admin of this company to access the dashboard.
          </p>
        </div>
      </div>
    );
  }

  // ✅ 3. GET COMPANY DETAILS (FIXED - use 'title' instead of 'name')
  let companyName = "Your Company";
  try {
    const company = await whopsdk.companies.retrieve(companyId);
    // Try to get the company title/name - adjust based on actual Whop SDK response
    companyName = (company as any).title || (company as any).company_name || companyId;
  } catch (error) {
    console.error("Failed to fetch company details:", error);
    // Fallback to companyId if retrieval fails
    companyName = companyId;
  }

  // ✅ 4. RENDER CLIENT COMPONENT
  return (
    <AdminDashboardClient 
      companyId={companyId} 
      companyName={companyName} 
    />
  );
}

