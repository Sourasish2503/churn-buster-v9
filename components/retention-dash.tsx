"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Shield, TrendingDown, Heart, Clock, Sparkles, CheckCircle2, DollarSign, UserX, Wrench, Coffee } from "lucide-react";

interface RetentionDashboardProps {
  experienceId: string;
  membershipId?: string;
  companyId?: string;
  discountPercent?: string;
  isDemo?: boolean;
  demoData?: {
    membershipId: string;
    companyId: string;
    discountPercent: string;
    userName: string;
  };
}

// ✅ NEW: Survey reasons
const CANCELLATION_REASONS = [
  { id: "expensive", label: "Too expensive", icon: DollarSign },
  { id: "not_using", label: "Not using it enough", icon: UserX },
  { id: "missing_features", label: "Missing features", icon: Wrench },
  { id: "need_break", label: "Need a break", icon: Coffee },
];

export function RetentionDashboard({
  experienceId,
  membershipId,
  companyId,
  discountPercent = "30",
  isDemo = false,
  demoData,
}: RetentionDashboardProps) {
  // ✅ NEW: Add survey step
  const [step, setStep] = useState<"survey" | "offer" | "success">("survey");
  const [selectedReason, setSelectedReason] = useState<string | null>(null);
  const [claiming, setClaiming] = useState(false);

  const effectiveMembershipId = isDemo ? demoData?.membershipId || "demo_membership_123" : membershipId || "";
  const effectiveCompanyId = isDemo ? demoData?.companyId || "demo_company_123" : companyId || "";
  const effectiveDiscount = isDemo ? demoData?.discountPercent || "80" : discountPercent || "30";
  const userName = isDemo ? demoData?.userName || "Demo User" : "there";

  // ✅ NEW: Handle survey submission
  const handleSurveySubmit = () => {
    if (!selectedReason) {
      alert("Please select a reason");
      return;
    }
    // Move to offer step
    setStep("offer");
  };

  const handleClaim = async () => {
    if (isDemo) {
      setClaiming(true);
      setTimeout(() => {
        setClaiming(false);
        setStep("success");
      }, 1500);
      return;
    }

    setClaiming(true);
    try {
      const response = await fetch("/api/claim-offer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          membershipId: effectiveMembershipId,
          companyId: effectiveCompanyId,
          experienceId,
          discountPercent: effectiveDiscount,
          cancellationReason: selectedReason, // ✅ Include survey data
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setStep("success");
      } else {
        alert(data.error || "Failed to claim offer");
      }
    } catch (error) {
      console.error("Claim error:", error);
      alert("Network error. Please try again.");
    } finally {
      setClaiming(false);
    }
  };

  // ✅ DEMO MODE
  if (isDemo) {
    return (
      <div className="min-h-screen bg-background relative">
        <div className="absolute top-0 left-0 right-0 bg-neon-yellow/20 border-b border-neon-yellow/30 py-3 px-4 z-50">
          <div className="max-w-4xl mx-auto text-center">
            <p className="text-sm font-semibold text-neon-yellow">
              🎬 DEMO MODE - This is a preview of how your retention offer will look to members
            </p>
          </div>
        </div>

        <div className="pt-16">
          {step === "survey" && (
            <SurveyView
              reasons={CANCELLATION_REASONS}
              selectedReason={selectedReason}
              onSelectReason={setSelectedReason}
              onSubmit={handleSurveySubmit}
            />
          )}
          {step === "offer" && (
            <OfferView
              discount={effectiveDiscount}
              userName={userName}
              onClaim={handleClaim}
              claiming={claiming}
            />
          )}
          {step === "success" && <SuccessView discount={effectiveDiscount} />}
        </div>
      </div>
    );
  }

  // ✅ PRODUCTION MODE
  return (
    <div className="min-h-screen bg-background">
      {step === "survey" && (
        <SurveyView
          reasons={CANCELLATION_REASONS}
          selectedReason={selectedReason}
          onSelectReason={setSelectedReason}
          onSubmit={handleSurveySubmit}
        />
      )}
      {step === "offer" && (
        <OfferView
          discount={effectiveDiscount}
          userName={userName}
          onClaim={handleClaim}
          claiming={claiming}
        />
      )}
      {step === "success" && <SuccessView discount={effectiveDiscount} />}
    </div>
  );
}

// ✅ NEW: SURVEY VIEW COMPONENT
function SurveyView({
  reasons,
  selectedReason,
  onSelectReason,
  onSubmit,
}: {
  reasons: Array<{ id: string; label: string; icon: any }>;
  selectedReason: string | null;
  onSelectReason: (id: string) => void;
  onSubmit: () => void;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="max-w-2xl w-full">
        <CardHeader className="text-center space-y-4 pb-6">
          <div>
            <p className="text-sm text-muted-foreground mb-2">Before you go...</p>
            <CardTitle className="text-4xl font-bold">
              Wait, <span className="text-neon-pink glow-pink">before you go...</span>
            </CardTitle>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="text-center mb-6">
            <h3 className="text-xl font-semibold mb-2">What's making you cancel?</h3>
            <p className="text-muted-foreground text-sm">
              Help us understand so we can make things better
            </p>
          </div>

          {/* Reason Options */}
          <div className="space-y-3">
            {reasons.map((reason) => {
              const Icon = reason.icon;
              const isSelected = selectedReason === reason.id;
              
              return (
                <button
                  key={reason.id}
                  onClick={() => onSelectReason(reason.id)}
                  className={`w-full flex items-center gap-4 p-4 rounded-lg border-2 transition-all ${
                    isSelected
                      ? "border-neon-pink bg-neon-pink/10"
                      : "border-border/30 bg-card-nested hover:border-neon-pink/50"
                  }`}
                >
                  <div className={`w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 ${
                    isSelected ? "bg-neon-pink/20" : "bg-card"
                  }`}>
                    <Icon className={`w-6 h-6 ${isSelected ? "text-neon-pink" : "text-muted-foreground"}`} />
                  </div>
                  <span className={`text-lg ${isSelected ? "text-neon-pink font-semibold" : "text-white"}`}>
                    {reason.label}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Continue Button */}
          <Button
            onClick={onSubmit}
            disabled={!selectedReason}
            className="w-full py-6 text-lg font-bold"
            size="lg"
          >
            Continue
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

// ✅ OFFER VIEW COMPONENT (unchanged)
function OfferView({
  discount,
  userName,
  onClaim,
  claiming,
}: {
  discount: string;
  userName: string;
  onClaim: () => void;
  claiming: boolean;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="max-w-2xl w-full" glow="pink">
        <CardHeader className="text-center space-y-4 pb-6">
          <div className="flex justify-center">
            <div className="w-20 h-20 rounded-full bg-neon-pink/20 flex items-center justify-center">
              <Heart className="w-10 h-10 text-neon-pink" />
            </div>
          </div>
          <div>
            <p className="text-sm text-muted-foreground mb-2">Before you go...</p>
            <CardTitle className="text-4xl font-bold">
              Wait, {userName}! We Have a{" "}
              <span className="text-neon-pink glow-pink">Special Offer</span>
            </CardTitle>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="relative p-8 bg-gradient-to-br from-neon-pink/10 to-neon-purple/10 rounded-xl border border-neon-pink/30">
            <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
              <span className="bg-neon-pink text-black text-xs font-bold px-4 py-1 rounded-full">
                EXCLUSIVE OFFER
              </span>
            </div>
            <div className="text-center space-y-2">
              <p className="text-6xl font-bold text-neon-pink glow-pink">{discount}% OFF</p>
              <p className="text-xl text-white">For the next 3 months</p>
            </div>
          </div>

          <div className="space-y-3">
            <BenefitItem
              icon={TrendingDown}
              text={`Save ${discount}% on your subscription for 3 months`}
            />
            <BenefitItem icon={Shield} text="Keep all your current benefits" />
            <BenefitItem icon={Clock} text="Cancel anytime, no strings attached" />
          </div>

          <div className="space-y-3">
            <Button
              onClick={onClaim}
              disabled={claiming}
              className="w-full py-6 text-lg font-bold"
              size="lg"
            >
              {claiming ? (
                <>
                  <Sparkles className="w-5 h-5 mr-2 animate-spin" />
                  Applying Offer...
                </>
              ) : (
                <>
                  <Heart className="w-5 h-5 mr-2" />
                  Yes! Give Me {discount}% OFF
                </>
              )}
            </Button>
            <p className="text-center text-sm text-muted-foreground">
              One-time offer • Automatically applied to your account
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ✅ SUCCESS VIEW COMPONENT (unchanged)
function SuccessView({ discount }: { discount: string }) {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="max-w-2xl w-full" glow="cyan">
        <CardContent className="p-12 text-center space-y-6">
          <div className="flex justify-center">
            <div className="w-24 h-24 rounded-full bg-green-500/20 flex items-center justify-center">
              <CheckCircle2 className="w-12 h-12 text-green-500" />
            </div>
          </div>

          <div className="space-y-2">
            <h2 className="text-3xl font-bold">🎉 Offer Claimed Successfully!</h2>
            <p className="text-lg text-muted-foreground">
              Your {discount}% discount will be applied by the creator within 24 hours.
            </p>
          </div>

          <div className="bg-card-nested rounded-lg p-6 space-y-3">
            <h3 className="font-semibold text-lg">What happens next?</h3>
            <ul className="text-left space-y-2 text-muted-foreground">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                <span>The creator has been notified of your accepted offer</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                <span>Your {discount}% discount will be applied to your next 3 billing cycles</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                <span>You'll receive a confirmation email once the discount is active</span>
              </li>
            </ul>
          </div>

          <p className="text-sm text-muted-foreground">
            Thank you for staying with us! 💙
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

function BenefitItem({ icon: Icon, text }: { icon: any; text: string }) {
  return (
    <div className="flex items-center gap-3 p-3 bg-card-nested rounded-lg">
      <div className="w-10 h-10 rounded-lg bg-neon-cyan/20 flex items-center justify-center flex-shrink-0">
        <Icon className="w-5 h-5 text-neon-cyan" />
      </div>
      <p className="text-sm">{text}</p>
    </div>
  );
}
