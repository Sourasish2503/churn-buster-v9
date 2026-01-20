"use client";

import { useState, useEffect, useCallback } from "react";
import { Zap, Shield, Activity, CreditCard, RefreshCw } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useWhop } from "@/hooks/useWhop";

interface AdminDashboardClientProps {
  userId: string;
  companyId: string;
  companyName: string;
}

interface Stats {
  credits: number;
  saves: number;
  logs: Array<{
    id: string;
    membershipId: string;
    discountPercent: string;
    timestamp: string;
  }>;
}

export default function AdminDashboardClient({ 
  userId, 
  companyId,
  companyName 
}: AdminDashboardClientProps) {
  const { sdk, isInIframe, showToast } = useWhop();
  const [loading, setLoading] = useState(false);
  const [statsLoading, setStatsLoading] = useState(true);
  const [discountPercent, setDiscountPercent] = useState("30");
  const [stats, setStats] = useState<Stats>({ credits: 0, saves: 0, logs: [] });

  const fetchStats = useCallback(async () => {
    setStatsLoading(true);
    try {
      const res = await fetch(`/api/stats?company_id=${companyId}`);
      if (res.ok) {
        const data = await res.json();
        setStats({ 
          credits: data.credits || 0, 
          saves: data.saves || 0,
          logs: data.logs || [],
        });
      }
    } catch (err) {
      console.error("Failed to fetch stats:", err);
    } finally {
      setStatsLoading(false);
    }
  }, [companyId]);

  const fetchConfig = useCallback(async () => {
    try {
      const res = await fetch(`/api/config?company_id=${companyId}`);
      if (res.ok) {
        const data = await res.json();
        if (data.discountPercent) {
          setDiscountPercent(data.discountPercent);
        }
      }
    } catch (err) {
      console.error("Failed to fetch config:", err);
    }
  }, [companyId]);

  // Load stats and config on mount
  useEffect(() => {
    fetchStats();
    fetchConfig();
  }, [fetchStats, fetchConfig]);

  const handleSaveConfig = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ companyId, discountPercent }),
      });
      
      if (res.ok) {
        showToast("Settings saved successfully!", "success");
      } else {
        const error = await res.json();
        showToast(error.error || "Failed to save settings", "error");
      }
    } catch (err) {
      showToast("Error saving settings", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleBuyCredits = async (packSize: string) => {
    try {
      const res = await fetch("/api/create-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ packSize, companyId }),
      });
      
      const data = await res.json();
      
      if (res.ok && data.url) {
        // Use Whop iframe SDK if available, otherwise open in new tab
        if (sdk?.openUrl) {
          sdk.openUrl(data.url);
        } else {
          window.open(data.url, "_blank");
        }
      } else {
        showToast(data.error || "Failed to create checkout", "error");
      }
    } catch (err) {
      showToast("Error creating checkout", "error");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-purple-950 to-black p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">
              Churn Buster Dashboard
            </h1>
            <p className="text-gray-400">{companyName}</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchStats}
            disabled={statsLoading}
            className="border-purple-500/30 text-purple-400 hover:bg-purple-500/10"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${statsLoading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card className="bg-black/40 border-purple-500/20 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Credits Remaining</p>
                <p className="text-3xl font-bold text-white">
                  {statsLoading ? "..." : stats.credits}
                </p>
              </div>
              <Zap className="text-yellow-500" size={32} />
            </div>
          </Card>

          <Card className="bg-black/40 border-purple-500/20 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Members Saved</p>
                <p className="text-3xl font-bold text-white">
                  {statsLoading ? "..." : stats.saves}
                </p>
              </div>
              <Shield className="text-green-500" size={32} />
            </div>
          </Card>

          <Card className="bg-black/40 border-purple-500/20 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Status</p>
                <p className="text-lg font-bold text-green-500">Active</p>
              </div>
              <Activity className="text-blue-500" size={32} />
            </div>
          </Card>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Settings */}
          <Card className="bg-black/40 border-purple-500/20 p-6">
            <h2 className="text-xl font-bold text-white mb-4">Retention Offer Settings</h2>
            
            <div className="mb-4">
              <label className="block text-gray-400 text-sm mb-2">
                Discount Percentage (1-100%)
              </label>
              <input
                type="number"
                value={discountPercent}
                onChange={(e) => setDiscountPercent(e.target.value)}
                className="w-full bg-black/60 border border-purple-500/30 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-purple-500"
                min="1"
                max="100"
              />
              <p className="text-xs text-gray-500 mt-1">
                This discount will be offered to members trying to cancel.
              </p>
            </div>

            <Button
              onClick={handleSaveConfig}
              disabled={loading}
              className="w-full bg-purple-600 hover:bg-purple-700"
            >
              {loading ? "Saving..." : "Save Settings"}
            </Button>
          </Card>

          {/* Buy Credits */}
          <Card className="bg-black/40 border-purple-500/20 p-6">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <CreditCard className="w-5 h-5" />
              Buy Credits
            </h2>
            
            <div className="space-y-3">
              <Button
                onClick={() => handleBuyCredits("10")}
                variant="outline"
                className="w-full justify-between border-purple-500/30 text-white hover:bg-purple-500/10"
              >
                <span>10 Credits</span>
                <span className="text-purple-400">$50</span>
              </Button>
              
              <Button
                onClick={() => handleBuyCredits("50")}
                variant="outline"
                className="w-full justify-between border-purple-500/30 text-white hover:bg-purple-500/10"
              >
                <span>50 Credits</span>
                <span className="text-purple-400">$200</span>
              </Button>
              
              <Button
                onClick={() => handleBuyCredits("200")}
                variant="outline"
                className="w-full justify-between border-purple-500/30 text-white hover:bg-purple-500/10"
              >
                <span>200 Credits</span>
                <span className="text-purple-400">$700</span>
              </Button>
            </div>
            
            <p className="text-xs text-gray-500 mt-4">
              1 credit = 1 retention offer shown to a canceling member
            </p>
          </Card>
        </div>

        {/* Recent Activity */}
        {stats.logs.length > 0 && (
          <Card className="bg-black/40 border-purple-500/20 p-6 mt-6">
            <h2 className="text-xl font-bold text-white mb-4">Recent Saves</h2>
            <div className="space-y-2">
              {stats.logs.slice(0, 5).map((log) => (
                <div 
                  key={log.id} 
                  className="flex items-center justify-between py-2 border-b border-purple-500/10 last:border-0"
                >
                  <div>
                    <p className="text-white text-sm">
                      Member saved with {log.discountPercent}% discount
                    </p>
                    <p className="text-gray-500 text-xs">
                      {new Date(log.timestamp).toLocaleDateString()}
                    </p>
                  </div>
                  <Shield className="text-green-500 w-4 h-4" />
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
