"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Shield, Sparkles, TrendingUp, AlertTriangle, Zap, CreditCard } from "lucide-react";
import { useWhop } from "@/hooks/useWhop";

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
  const [stats, setStats] = useState<Stats>({ credits: 0, saves: 0, logs: [] });
  const [statsLoading, setStatsLoading] = useState(true);
  const [discountPercent, setDiscountPercent] = useState("30");
  const [saving, setSaving] = useState(false);
  const { openCheckout, showToast } = useWhop();

  useEffect(() => {
    fetchStats();
    fetchConfig();
  }, [companyId]);

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

  const handleSaveConfig = async () => {
    setSaving(true);
    try {
      const response = await fetch("/api/admin/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ companyId, discountPercent }),
      });

      if (response.ok) {
        showToast("Configuration saved successfully!", "success");
      } else {
        showToast("Failed to save configuration", "error");
      }
    } catch (error) {
      showToast("Network error", "error");
    } finally {
      setSaving(false);
    }
  };

  const handlePurchaseCredits = async (packSize: string) => {
    try {
      const response = await fetch("/api/admin/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ packSize, companyId }),
      });

      const data = await response.json();
      if (data.url) {
        openCheckout(data.url);
      } else {
        showToast(data.error || "Checkout not available", "error");
      }
    } catch (error) {
      showToast("Failed to create checkout", "error");
    }
  };

  const lowCredits = stats.credits < 5;

  return (
    <div className="min-h-screen bg-background p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
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
          <p className={`font-bold ${lowCredits ? 'text-destructive' : 'text-green-500'}`}>
            {lowCredits ? '⚠️ Paused (No Credits)' : '✓ Active'}
          </p>
        </div>
      </div>

      {/* Low Credits Warning */}
      {lowCredits && (
        <Card className="bg-neon-yellow/10 border-neon-yellow/30">
          <CardContent className="p-4 flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-neon-yellow flex-shrink-0" />
            <div>
              <p className="font-semibold text-neon-yellow">Low credit balance ({stats.credits})</p>
              <p className="text-sm text-neon-yellow/80">Top up to keep retention active</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-card border-border/30">
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground mb-1">Revenue Protected</p>
            <p className="text-4xl font-bold text-white">
              ${statsLoading ? "..." : stats.saves * 99}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border/30">
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground mb-1">Churn Attempts Stopped</p>
            <p className="text-4xl font-bold text-white">
              {statsLoading ? "..." : stats.saves}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border/30">
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground mb-1">Credits Available</p>
            <p className="text-4xl font-bold text-neon-cyan glow-cyan">
              {statsLoading ? "..." : stats.credits}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Offer Configuration */}
        <Card glow="pink">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-neon-pink/20 flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-neon-pink" />
              </div>
              Offer Configuration
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Discount Percentage</label>
              <div className="flex gap-2">
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={discountPercent}
                  onChange={(e) => setDiscountPercent(e.target.value)}
                  className="flex-1 bg-card-nested border border-border/30 rounded-lg px-4 py-2 focus:border-neon-pink/50 focus:outline-none"
                />
                <span className="flex items-center px-3 text-muted-foreground">%</span>
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                Users will be offered this discount for 3 months to prevent cancellation.
              </p>
            </div>
            <Button
              onClick={handleSaveConfig}
              disabled={saving}
              variant="outline"
              className="w-full"
            >
              {saving ? "Saving..." : "💾 Save Configuration"}
            </Button>
          </CardContent>
        </Card>

        {/* Live Activity Feed */}
        <Card glow="cyan">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-neon-cyan/20 flex items-center justify-center">
                <Shield className="w-4 h-4 text-neon-cyan" />
              </div>
              Live Activity Feed
            </CardTitle>
          </CardHeader>
          <CardContent>
            {stats.logs.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No activity recorded yet.</p>
            ) : (
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {stats.logs.map((log) => (
                  <div
                    key={log.id}
                    className="p-3 bg-card-nested rounded-lg border border-border/30"
                  >
                    <p className="font-medium">
                      Member saved with {log.discountPercent}% discount
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(log.timestamp).toLocaleDateString()}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Credit Packs */}
      <div>
        <h2 className="text-2xl font-bold mb-4 text-center">Top Up Credits</h2>
        <p className="text-center text-muted-foreground mb-6">
          1 credit = 1 retention offer shown to a canceling member
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {creditPacks.map((pack) => {
            const Icon = pack.icon;
            return (
              <Card
                key={pack.packSize}
                glow={pack.popular ? "cyan" : "none"}
                className="relative hover:scale-105 transition-transform"
              >
                {pack.popular && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <span className="bg-neon-cyan text-black text-xs font-bold px-3 py-1 rounded-full">
                      MOST POPULAR
                    </span>
                  </div>
                )}
                <CardContent className="p-6 space-y-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-lg ${pack.popular ? 'bg-neon-cyan/20' : 'bg-card-nested'} flex items-center justify-center`}>
                      <Icon className={`w-6 h-6 ${pack.popular ? 'text-neon-cyan' : 'text-muted-foreground'}`} />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg">{pack.name}</h3>
                      <p className={`text-sm ${pack.popular ? 'text-neon-cyan' : 'text-muted-foreground'}`}>
                        {pack.description}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <p className="text-3xl font-bold">{pack.price}</p>
                    <p className="text-muted-foreground">/ {pack.credits} credits</p>
                  </div>
                  <Button
                    variant={pack.popular ? "default" : "outline"}
                    className="w-full"
                    onClick={() => handlePurchaseCredits(pack.packSize)}
                  >
                    Purchase
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
