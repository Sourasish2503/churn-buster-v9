"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Shield,
  Sparkles,
  TrendingUp,
  AlertTriangle,
  Zap,
  CreditCard,
  Loader2,
} from "lucide-react";

interface AdminDashboardClientProps {
  companyId: string;
  companyName: string;
}

interface Stats {
  credits: number;
  saves: number;
  logs: Array<{
    id: string;
    timestamp: string;
    discountPercent: string;
    membershipId: string;
  }>;
}

const creditPacks = [
  {
    name: "Starter Pack",
    description: "Good for testing things out.",
    credits: 10,
    price: "$50",
    packSize: "10",
    icon: CreditCard,
  },
  {
    name: "Growth Pack",
    description: "Best for growing communities.",
    credits: 50,
    price: "$200",
    packSize: "50",
    icon: TrendingUp,
    popular: true,
  },
  {
    name: "Scale Pack",
    description: "Maximum retention power.",
    credits: 200,
    price: "$700",
    packSize: "200",
    icon: Zap,
  },
];

export default function AdminDashboardClient({
  companyId,
  companyName,
}: AdminDashboardClientProps) {
  const [stats, setStats] = useState<Stats>({
    credits: 0,
    saves: 0,
    logs: [],
  });
  const [statsLoading, setStatsLoading] = useState(true);
  const [discountPercent, setDiscountPercent] = useState("30");
  const [saving, setSaving] = useState(false);
  const [purchasingPack, setPurchasingPack] = useState<string | null>(null);

  useEffect(() => {
    fetchStats();
    fetchConfig();
  }, [companyId]);

  /* -----------------------------
     FETCH STATS
  ------------------------------ */
  const fetchStats = async () => {
    try {
      const response = await fetch(`/api/admin/stats?company_id=${companyId}`);
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error("Failed to fetch stats:", error);
    } finally {
      setStatsLoading(false);
    }
  };

  /* -----------------------------
     FETCH CONFIG
  ------------------------------ */
  const fetchConfig = async () => {
    try {
      const response = await fetch(`/api/admin/config?company_id=${companyId}`);
      if (response.ok) {
        const data = await response.json();
        setDiscountPercent(data.discountPercent || "30");
      }
    } catch (error) {
      console.error("Failed to fetch config:", error);
    }
  };

  /* -----------------------------
     SAVE CONFIG
  ------------------------------ */
  const handleSaveConfig = async () => {
    setSaving(true);
    try {
      const response = await fetch("/api/admin/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ companyId, discountPercent }),
      });

      if (response.ok) {
        alert("Configuration saved successfully!");
      } else {
        const text = await response.text();
        alert(text || "Failed to save configuration");
      }
    } catch {
      alert("Network error");
    } finally {
      setSaving(false);
    }
  };

  /* -----------------------------
     ✅ FIXED CHECKOUT HANDLER
     (NO JSON PARSE CRASH)
  ------------------------------ */
  const handlePurchaseCredits = async (packSize: string) => {
    setPurchasingPack(packSize);

    try {
      const response = await fetch("/api/create-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ packSize, companyId }),
      });

      const text = await response.text();

      if (!text) {
        throw new Error("Empty response from server");
      }

      let data: any;
      try {
        data = JSON.parse(text);
      } catch {
        console.error("Invalid JSON response:", text);
        throw new Error("Invalid server response");
      }

      if (!response.ok) {
        throw new Error(data.error || "Failed to create checkout");
      }

      if (!data.url) {
        throw new Error("Checkout URL missing");
      }

      // ✅ Redirect to Whop Checkout
      window.location.href = data.url;
      return;
    } catch (err: any) {
      console.error("Checkout error:", err);
      alert(err.message || "Failed to create checkout");
    } finally {
      setPurchasingPack(null);
    }
  };

  const lowCredits = stats.credits < 5;

  /* =============================
     UI (UNCHANGED)
  ============================== */
  return (
    <div className="min-h-screen bg-background p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
            <Shield className="w-4 h-4" />
            <span>Admin Control</span>
          </div>
          <h1 className="text-4xl font-bold">
            Retention <span className="text-neon-cyan glow-cyan">Command</span>
          </h1>
        </div>
        <div className="text-right">
          <p className="text-sm text-muted-foreground">System Status</p>
          <p className={`font-bold ${lowCredits ? "text-destructive" : "text-green-500"}`}>
            {lowCredits ? "⚠️ Paused (No Credits)" : "✓ Active"}
          </p>
        </div>
      </div>

      {/* Low Credits Warning */}
      {lowCredits && (
        <Card className="bg-neon-yellow/10 border-neon-yellow/30">
          <CardContent className="p-4 flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-neon-yellow" />
            <div>
              <p className="font-semibold text-neon-yellow">
                Low credit balance ({stats.credits})
              </p>
              <p className="text-sm text-neon-yellow/80">
                Top up to keep retention active
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Credit Packs */}
      <div>
        <h2 className="text-2xl font-bold mb-4 text-center">Top Up Credits</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {creditPacks.map((pack) => {
            const Icon = pack.icon;
            const isPurchasing = purchasingPack === pack.packSize;

            return (
              <Card key={pack.packSize} className="hover:scale-105 transition">
                <CardContent className="p-6 space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-lg bg-card-nested flex items-center justify-center">
                      <Icon className="w-6 h-6 text-muted-foreground" />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg">{pack.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {pack.description}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-baseline gap-2">
                    <p className="text-3xl font-bold">{pack.price}</p>
                    <p className="text-muted-foreground">
                      / {pack.credits} credits
                    </p>
                  </div>

                  <Button
                    className="w-full"
                    onClick={() => handlePurchaseCredits(pack.packSize)}
                    disabled={isPurchasing}
                  >
                    {isPurchasing ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Opening Checkout…
                      </>
                    ) : (
                      "Purchase"
                    )}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
