"use client";

import { useState } from "react";
import { DollarSign, Users, TrendingDown, Clock, ShieldCheck, AlertTriangle } from "lucide-react";
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
  // --- PRESERVING YOUR EXACT STATE & LOGIC ---
  const [selectedReason, setSelectedReason] = useState<string | null>(null);
  const [claimed, setClaimed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleClaim = async () => {
    if (!selectedReason) {
      setErrorMessage("Please select a reason so we can help better.");
      return;
    }
    
    setLoading(true);
    setErrorMessage(null);

    if (previewMode) {
      // Logic from your file (simulating delay for preview)
      await new Promise(resolve => setTimeout(resolve, 1000));
      setClaimed(true);
      setLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/claim-offer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          membershipId,
          companyId,
          discountPercent,
          reason: selectedReason // Passing the reason for analytics
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to claim offer");
      }

      setClaimed(true);
    } catch (error) {
      console.error(error);
      setErrorMessage("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // --- NEW VISUALS (LOGIC UNTOUCHED) ---

  if (claimed) {
    return (
      <div className="w-full max-w-md mx-auto p-4 animate-fade-in">
        <Card glow="pink" className="bg-black/80 backdrop-blur-xl border-pink-500/50">
          <CardContent className="pt-6 text-center space-y-4">
            <div className="w-16 h-16 bg-pink-500/20 rounded-full flex items-center justify-center mx-auto shadow-[0_0_20px_rgba(255,0,255,0.4)]">
              <ShieldCheck className="w-8 h-8 text-neon-pink" />
            </div>
            <h2 className="text-2xl font-bold text-white">Offer Claimed!</h2>
            <p className="text-gray-400">
              The <span className="text-neon-pink font-bold">{discountPercent}% discount</span> has been applied to your membership.
            </p>
            <div className="p-3 bg-white/5 rounded-lg border border-white/10 text-sm text-gray-500">
              ID: {membershipId}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="w-full max-w-2xl mx-auto p-4 space-y-8 animate-slide-up">
      
      {/* Header */}
      <div className="text-center space-y-2">
        {previewMode && (
          <div className="inline-block px-3 py-1 bg-yellow-500/10 border border-yellow-500/30 rounded-full text-yellow-500 text-xs font-bold mb-4">
            PREVIEW MODE
          </div>
        )}
        <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight">
          Wait, <span className="text-neon-cyan drop-shadow-[0_0_10px_rgba(0,243,255,0.6)]">{customerName}</span>
        </h1>
        <p className="text-xl text-gray-400 font-light">
          Before you go, let us make it right.
        </p>
      </div>

      <Card glow="cyan" className="bg-black/60 backdrop-blur-xl border-white/10">
        <CardContent className="p-8 space-y-8">
          
          {/* Discount Banner */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-cyan-900/40 to-blue-900/40 border border-cyan-500/30 p-6 text-center">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent opacity-50" />
            <h2 className="text-3xl font-bold text-white mb-1">
              {discountPercent}% OFF
            </h2>
            <p className="text-cyan-200 text-sm uppercase tracking-widest font-semibold">
              Retention Offer
            </p>
          </div>

          {/* Reason Selection */}
          <div className="space-y-4">
            <label className="text-sm font-medium text-gray-400 uppercase tracking-wider ml-1">
              Why are you leaving?
            </label>
            <div className="grid grid-cols-1 gap-3">
              {cancellationReasons.map((reason) => {
                const Icon = reason.icon;
                const isSelected = selectedReason === reason.id;
                
                return (
                  <button
                    key={reason.id}
                    onClick={() => setSelectedReason(reason.id)}
                    className={cn(
                      "flex items-center gap-4 p-4 rounded-xl border transition-all duration-300 text-left group",
                      isSelected 
                        ? "bg-cyan-950/50 border-cyan-400 shadow-[0_0_15px_rgba(0,243,255,0.2)]" 
                        : "bg-white/5 border-white/5 hover:bg-white/10 hover:border-cyan-500/30"
                    )}
                  >
                    <div className={cn(
                      "p-2 rounded-lg transition-colors",
                      isSelected ? "bg-cyan-500 text-black" : "bg-white/10 text-gray-400 group-hover:text-cyan-400"
                    )}>
                      <Icon size={20} />
                    </div>
                    <span className={cn(
                      "font-medium transition-colors",
                      isSelected ? "text-cyan-400" : "text-gray-300 group-hover:text-white"
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
            <div className="flex items-center gap-2 text-red-400 bg-red-950/30 p-3 rounded-lg border border-red-900/50 text-sm">
              <AlertTriangle size={16} />
              {errorMessage}
            </div>
          )}

          {/* Action Button */}
          <Button
            variant="neon"
            size="xl"
            className="w-full h-14 text-lg"
            onClick={handleClaim}
            disabled={loading}
          >
            {loading ? "Applying Discount..." : "Claim This Offer"}
          </Button>

          <p className="text-center text-xs text-gray-600 pt-2">
            By clicking above, you agree to apply this discount to your next billing cycle.
          </p>

        </CardContent>
      </Card>
    </div>
  );
}