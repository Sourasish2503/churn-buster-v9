import { Whop } from "@whop/sdk";
import { headers } from "next/headers";

// Environment variable validation
const apiKey = process.env.WHOP_API_KEY;
const appId = process.env.NEXT_PUBLIC_WHOP_APP_ID;

// Validate at module load time - fail fast if misconfigured
if (!apiKey) {
  throw new Error("MISSING WHOP_API_KEY in environment variables");
}

if (!appId) {
  throw new Error("MISSING NEXT_PUBLIC_WHOP_APP_ID in environment variables");
}

// Initialize Whop SDK with App credentials
export const whopsdk = new Whop({
  apiKey,
  appID: appId,
});

// Alias for backwards compatibility
export const whop = whopsdk;

// Type definitions for Whop user verification
export interface WhopUserContext {
  userId: string;
}

// JWT Token Verification for App Store apps
// This verifies the user token passed in headers when app is loaded in Whop iframe
export async function verifyWhopUser(): Promise<WhopUserContext | null> {
  try {
    const headerPayload = await headers();
    const { userId } = await whopsdk.verifyUserToken(headerPayload);
    
    if (!userId) {
      console.error("Whop Token Validation Failed: No User ID");
      return null;
    }

    return { userId };
  } catch (err) {
    console.error("Whop Security Error:", err);
    return null;
  }
}

// Check if user has admin access to a company
export async function verifyAdminAccess(companyId: string, userId: string): Promise<boolean> {
  try {
    const access = await whopsdk.users.checkAccess(companyId, { id: userId });
    return access.access_level === "admin";
  } catch (err) {
    console.error("Admin access check failed:", err);
    return false;
  }
}

// Check if user has any access to a resource (company or experience)
export async function verifyUserAccess(resourceId: string, userId: string): Promise<boolean> {
  try {
    const access = await whopsdk.users.checkAccess(resourceId, { id: userId });
    return access.has_access === true;
  } catch (err) {
    console.error("User access check failed:", err);
    return false;
  }
}

// Get user details with safe fallbacks
export async function getWhopUser(userId: string) {
  try {
    const user = await whopsdk.users.retrieve(userId);
    return user;
  } catch (err) {
    console.error("Failed to retrieve user:", err);
    return null;
  }
}

// Get company details
export async function getWhopCompany(companyId: string) {
  try {
    const company = await whopsdk.companies.retrieve(companyId);
    return company;
  } catch (err) {
    console.error("Failed to retrieve company:", err);
    return null;
  }
}
