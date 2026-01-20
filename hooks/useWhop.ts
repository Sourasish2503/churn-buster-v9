"use client";
import { useEffect, useState, useCallback } from "react";
import { createSdk } from "@whop/iframe";

// Use a more flexible type that works with the actual SDK
type WhopSdk = ReturnType<typeof createSdk> & {
  openUrl?: (url: string) => void;
  openCheckout?: (productId: string) => void;
  showToast?: (message: string, type?: string) => void;
  close?: () => void;
};

interface UseWhopReturn {
  sdk: WhopSdk | null;
  isLoading: boolean;
  isInIframe: boolean;
  openCheckout: (productId: string) => void;
  showToast: (message: string, type?: "success" | "error" | "info") => void;
}

export function useWhop(): UseWhopReturn {
  const [sdk, setSdk] = useState<WhopSdk | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isInIframe, setIsInIframe] = useState(false);

  useEffect(() => {
    const appId = process.env.NEXT_PUBLIC_WHOP_APP_ID;
    
    // Check if we're in an iframe
    const inIframe = typeof window !== "undefined" && window.self !== window.top;
    setIsInIframe(inIframe);
    
    if (appId && inIframe) {
      try {
        const whop = createSdk({ appId });
        setSdk(whop as WhopSdk);
      } catch (err) {
        console.error("Failed to initialize Whop iframe SDK:", err);
      }
    } else if (!appId) {
      console.error("Missing NEXT_PUBLIC_WHOP_APP_ID");
    }
    
    setIsLoading(false);
  }, []);

  // Helper to open checkout - works in iframe or falls back to new tab
  const openCheckout = useCallback((productId: string) => {
    if (sdk?.openCheckout) {
      sdk.openCheckout(productId);
    } else {
      // Fallback for non-iframe context
      window.open(`https://whop.com/checkout/${productId}`, "_blank");
    }
  }, [sdk]);

  // Helper to show toast notifications
  const showToast = useCallback((message: string, type: "success" | "error" | "info" = "info") => {
    if (sdk?.showToast) {
      sdk.showToast(message, type);
    } else {
      // Fallback to console
      console.log(`[${type.toUpperCase()}] ${message}`);
    }
  }, [sdk]);

  return { 
    sdk, 
    isLoading, 
    isInIframe,
    openCheckout,
    showToast,
  };
}