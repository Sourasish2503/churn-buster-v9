import { headers } from "next/headers";
import { whopsdk } from "@/lib/whop";
import AdminDashboardClient from "@/components/admin-dashboard-client";

export const dynamic = 'force-dynamic';  // Add at top

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
      <div className="flex items-center justify-center min-h-screen bg-black text-white p-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
          <p className="text-gray-400">
            Could not verify Whop security token. Please open this app from the Whop Dashboard.
          </p>
        </div>
      </div>
    );
  }

  // ✅ 2. CHECK ADMIN ACCESS
  const access = await whopsdk.users.checkAccess(companyId, { id: userId });
  
  if (access.access_level !== "admin") {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black text-white p-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Admin Access Required</h1>
          <p className="text-gray-400">
            You must be an admin of this company to access the dashboard.
          </p>
        </div>
      </div>
    );
  }

  // ✅ 3. GET REAL COMPANY DATA
  const company = await whopsdk.companies.retrieve(companyId);

  // ✅ 4. RENDER ADMIN DASHBOARD
  return (
    <AdminDashboardClient 
      userId={userId}
      companyId={companyId}
      companyName={company.title || "Your Business"}
    />
  );
}
