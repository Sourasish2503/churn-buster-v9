"use client";

import { useState } from "react";
import { DollarSign, Users, TrendingDown, Clock, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface RetentionDashboardProps {
  membershipId: string;
  companyId: string;
  experienceId: string;
  customerName: string;
  discountPercent: string;
  previewMode?: boolean;
}

interface CancellationReason {
  id: string;
  label: string;
  icon: typeof DollarSign;
}

const cancellationReasons: CancellationReason[] = [
  { id: "expensive", label: "Too expensive", icon: DollarSign },
  { id: "not_using", label: "Not using it enough", icon: Users },
  { id: "missing_features", label: "Missing features", icon: TrendingDown },
  { id: "need_break", label: "Need a break", icon: Clock },
];

export function RetentionDashboard({
  membershipId,
  companyId,
  experienceId,
  customerName,
  discountPercent,
  previewMode = false,
}: RetentionDashboardProps) {
  const [selectedReason, setSelectedReason] = useState<string | null>(null);
  const [claimed, setClaimed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleClaim = async () => {
    if (!selectedReason) {
      setErrorMessage("Please select a reason before claiming");
      return;
    }

    if (previewMode) {
      alert("Preview Mode - No changes will be saved");
      return;
    }

    setLoading(true);
    setErrorMessage(null);

    try {
      const response = await fetch("/api/retention/claim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          membershipId,
          companyId,
          experienceId,
          discountPercent,
          cancellationReason: selectedReason,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setClaimed(true);
      } else {
        setErrorMessage(data.error || "Failed to apply discount");
      }
    } catch (error) {
      setErrorMessage("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (claimed) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card glow="cyan" className="max-w-2xl w-full">
          <CardContent className="p-12 text-center space-y-6">
            <div className="flex justify-center">
              <div className="w-20 h-20 rounded-full bg-neon-cyan/10 flex items-center justify-center">
                <Sparkles className="w-10 h-10 text-neon-cyan" />
              </div>
            </div>
            <h1 className="text-4xl font-bold">
              <span className="text-neon-pink glow-pink">We'd hate to lose you, </span>
              {customerName}.
            </h1>
            <div className="space-y-2">
              <p className="text-3xl font-bold text-neon-cyan glow-cyan">
                Your {discountPercent}% discount has been applied!
              </p>
              <p className="text-lg text-muted-foreground">
                You'll see the discount on your next billing cycle.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-4xl w-full space-y-8">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-5xl md:text-6xl font-bold">
            <span className="text-neon-pink glow-pink">Wait,</span>{" "}
            <span className="text-white">before you go...</span>
          </h1>
        </div>

        {/* Preview Mode Banner */}
        {previewMode && (
          <div className="bg-neon-yellow/10 border border-neon-yellow/30 rounded-lg p-4 text-center">
            <p className="text-neon-yellow font-semibold">
              Preview Mode - No changes will be saved
            </p>
          </div>
        )}

        {/* Main Offer Card */}
        <Card glow="cyan" className="overflow-hidden">
          <CardContent className="p-8 md:p-12 space-y-8">
            {/* Discount Offer */}
            <div className="text-center space-y-4">
              <div className="space-y-2">
                <h2 className="text-6xl md:text-7xl font-bold">
                  <span className="text-neon-cyan glow-cyan">{discountPercent}% OFF</span>
                </h2>
                <p className="text-3xl font-semibold text-white">Next 3 Months</p>
              </div>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                We'd hate to see you lose access to the alpha. Stay with us for a special rate.
              </p>
            </div>

            {/* Price Display */}
            <Card className="bg-card-nested border-border/30">
              <CardContent className="p-8">
                <div className="flex items-center justify-center gap-8 flex-wrap">
                  <div className="text-center">
                    <p className="text-muted-foreground line-through text-3xl">$99</p>
                  </div>
                  <div className="text-center">
                    <p className="text-6xl font-bold text-white">$20</p>
                  </div>
                  <div className="px-4 py-2 bg-neon-cyan/10 border border-neon-cyan/30 rounded-full">
                    <p className="text-neon-cyan font-bold text-xl">SAVE $79</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Cancellation Reasons */}
            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-center">What's making you cancel?</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {cancellationReasons.map((reason) => {
                  const Icon = reason.icon;
                  const isSelected = selectedReason === reason.id;
                  return (
                    <button
                      key={reason.id}
                      onClick={() => setSelectedReason(reason.id)}
                      className={cn(
                        "flex items-center gap-4 p-4 rounded-lg border-2 transition-all",
                        "hover:border-neon-cyan/50 hover:bg-neon-cyan/5",
                        isSelected
                          ? "border-neon-cyan bg-neon-cyan/10"
                          : "border-border/30 bg-card-nested"
                      )}
                    >
                      <Icon className={cn(
                        "w-6 h-6",
                        isSelected ? "text-neon-cyan" : "text-muted-foreground"
                      )} />
                      <span className={cn(
                        "text-lg font-medium",
                        isSelected ? "text-white" : "text-muted-foreground"
                      )}>
                        {reason.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Error Message */}
            {errorMessage && (
              <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-4 text-center">
                <p className="text-destructive font-medium">{errorMessage}</p>
              </div>
            )}

            {/* CTA Button */}
            <Button
              size="xl"
              className="w-full"
              onClick={handleClaim}
              disabled={loading || !selectedReason}
            >
              {loading ? "Processing..." : "Claim This Offer"}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
