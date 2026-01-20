"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TrendingDown, DollarSign, Clock, Users, CheckCircle, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useWhop } from "@/hooks/useWhop";

interface DashboardProps {
  membershipId: string;
  companyId: string;
  experienceId: string;
  discountPercent: string;
  customerName: string;
  isPreviewMode: boolean;
}

const cancellationReasons = [
  { id: 1, icon: DollarSign, label: "Too expensive", value: "price" },
  { id: 2, icon: Users, label: "Not using it enough", value: "usage" },
  { id: 3, icon: TrendingDown, label: "Missing features", value: "features" },
  { id: 4, icon: Clock, label: "Need a break", value: "break" },
];

export function RetentionDashboard({
  membershipId,
  companyId,
  experienceId,
  discountPercent,
  customerName,
  isPreviewMode
}: DashboardProps) {
  const { sdk, showToast } = useWhop();
  const [step, setStep] = useState<"reasons" | "offer" | "success" | "error">("reasons");
  const [selectedReason, setSelectedReason] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>("");

  const handleReasonSelect = async (value: string) => {
    setSelectedReason(value);
    
    // Log cancellation reason (only in live mode)
    if (!isPreviewMode) {
      try {
        await fetch("/api/log", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            businessId: companyId,
            collectionName: "cancellation_reasons",
            data: {
              membershipId,
              experienceId,
              reason: value,
            },
          }),
        });
      } catch (err) {
        // Non-blocking - don't fail the flow if logging fails
        console.error("Failed to log reason:", err);
      }
    }
    
    // Smooth transition to offer
    setTimeout(() => setStep("offer"), 300);
  };

  const handleClaimOffer = async () => {
    if (isPreviewMode) {
      // In preview mode, just show success
      setStep("success");
      return;
    }

    setLoading(true);
    setErrorMessage("");
    
    try {
      const response = await fetch("/api/claim-offer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          membershipId,
          companyId,
          experienceId,
          discountPercent,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to apply offer");
      }

      setStep("success");
      showToast("Discount applied successfully!", "success");
    } catch (e: any) {
      console.error("Error claiming offer:", e);
      setErrorMessage(e.message || "Could not apply discount. Please try again.");
      setStep("error");
      showToast(e.message || "Failed to apply discount", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    // Use Whop SDK to close if available, otherwise try window.close
    if (sdk?.close) {
      sdk.close();
    } else {
      window.close();
    }
  };

  const handleRetry = () => {
    setStep("offer");
    setErrorMessage("");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-purple-950 to-black flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl bg-black/60 border-purple-500/20 backdrop-blur-xl p-8">
        {/* Preview Mode Banner */}
        {isPreviewMode && (
          <div className="mb-4 bg-yellow-500/20 border border-yellow-500/50 rounded-lg p-3 text-center">
            <p className="text-yellow-500 font-semibold text-sm">
              Preview Mode - No changes will be saved
            </p>
          </div>
        )}

        {/* Header */}
        <h1 className="text-3xl font-bold text-white mb-2 text-center">
          Wait {customerName}, before you go...
        </h1>

        {/* Step 1: Reasons */}
        {step === "reasons" && (
          <div className="space-y-4 mt-8">
            <p className="text-gray-400 text-center mb-6">
              Help us understand why you're leaving:
            </p>
            {cancellationReasons.map((reason) => {
              const Icon = reason.icon;
              return (
                <button
                  key={reason.id}
                  onClick={() => handleReasonSelect(reason.value)}
                  className={cn(
                    "group relative w-full rounded-lg border-2 p-5 transition-all duration-300 flex items-center gap-4",
                    selectedReason === reason.value
                      ? "border-purple-500 bg-purple-500/10"
                      : "border-white/5 bg-black/20 hover:border-purple-500/50"
                  )}
                >
                  <Icon className="text-purple-400" size={24} />
                  <span className="text-white font-medium">{reason.label}</span>
                </button>
              );
            })}
          </div>
        )}

        {/* Step 2: Offer */}
        {step === "offer" && (
          <div className="text-center mt-8 space-y-6">
            <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg p-8">
              <p className="text-6xl font-bold text-white">{discountPercent}% OFF</p>
              <p className="text-white/80 mt-2">Next 3 Months</p>
            </div>
            
            <p className="text-gray-300">
              We'd hate to lose you, {customerName}.
            </p>

            <Button
              onClick={handleClaimOffer}
              disabled={loading}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 py-6 text-lg disabled:opacity-50"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></span>
                  Applying Discount...
                </span>
              ) : (
                "Claim This Offer"
              )}
            </Button>

            <button
              onClick={handleClose}
              className="text-gray-500 text-sm hover:text-gray-400 transition-colors"
            >
              No thanks, I still want to cancel
            </button>
          </div>
        )}

        {/* Step 3: Success */}
        {step === "success" && (
          <div className="text-center mt-8 space-y-6">
            <div className="flex justify-center">
              <CheckCircle className="w-20 h-20 text-green-500" />
            </div>
            <h2 className="text-2xl font-bold text-white">Success!</h2>
            <p className="text-gray-300">
              Your {discountPercent}% discount has been applied!
            </p>
            <p className="text-sm text-gray-500">
              You'll see the discount on your next billing cycle.
            </p>
            <Button
              onClick={handleClose}
              variant="outline"
              className="border-purple-500/30 text-purple-400 hover:bg-purple-500/10"
            >
              Close
            </Button>
          </div>
        )}

        {/* Step 4: Error */}
        {step === "error" && (
          <div className="text-center mt-8 space-y-6">
            <div className="flex justify-center">
              <XCircle className="w-20 h-20 text-red-500" />
            </div>
            <h2 className="text-2xl font-bold text-white">Something went wrong</h2>
            <p className="text-gray-300">
              {errorMessage}
            </p>
            <div className="flex gap-4 justify-center">
              <Button
                onClick={handleRetry}
                className="bg-purple-600 hover:bg-purple-700"
              >
                Try Again
              </Button>
              <Button
                onClick={handleClose}
                variant="outline"
                className="border-purple-500/30 text-purple-400 hover:bg-purple-500/10"
              >
                Close
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
