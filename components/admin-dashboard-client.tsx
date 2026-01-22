"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils"; // Ensure you have this, or use standard input
import {
  Shield,
  TrendingUp,
  Zap,
  CreditCard,
  Loader2,
  Activity,
  UserCheck,
  Settings,
  Save,
  AlertTriangle
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
  // --- CORE LOGIC (PRESERVED) ---
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

  const fetchStats = async () => {
    try {
      const response = await fetch(`/api/stats?company_id=${companyId}`);
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
      const response = await fetch(`/api/config?company_id=${companyId}`);
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
      const response = await fetch("/api/config", {
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

  const handlePurchaseCredits = async (packSize: string) => {
    setPurchasingPack(packSize);
    try {
      const response = await fetch("/api/create-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ packSize, companyId }),
      });

      const text = await response.text();
      if (!text) throw new Error("Empty response from server");

      let data: any;
      try {
        data = JSON.parse(text);
      } catch {
        throw new Error("Invalid server response");
      }

      if (!response.ok) throw new Error(data.error || "Failed to create checkout");
      if (!data.url) throw new Error("Checkout URL missing");

      window.location.href = data.url;
    } catch (err: any) {
      console.error("Checkout error:", err);
      alert(err.message || "Failed to create checkout");
    } finally {
      setPurchasingPack(null);
    }
  };

  const lowCredits = stats.credits < 5;

  // --- NEW CYBERPUNK UI (WRAPPING YOUR LOGIC) ---
  return (
    <div className="min-h-screen bg-black text-white p-6 md:p-12 font-sans selection:bg-cyan-500/30">
      <div className="max-w-6xl mx-auto space-y-12">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-end gap-4 animate-slide-up">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-cyan-500/30 bg-cyan-500/10 text-cyan-400 text-xs font-bold tracking-wider uppercase mb-3 shadow-[0_0_10px_rgba(0,243,255,0.2)]">
              <Shield size={12} /> Admin Console
            </div>
            <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-2">
              <span className="text-white">Churn</span>
              <span className="text-neon-cyan drop-shadow-[0_0_15px_rgba(0,243,255,0.6)]">Buster</span>
            </h1>
            <p className="text-gray-400">
              Managing <span className="text-white font-semibold">{companyName || "Your Company"}</span>
            </p>
          </div>
          
          <div className="text-right">
             <div className="text-sm text-gray-500 mb-1">Current Balance</div>
             <div className="text-4xl font-mono font-bold text-neon-pink drop-shadow-[0_0_15px_rgba(255,0,255,0.4)]">
               {statsLoading ? "..." : stats.credits} <span className="text-lg text-gray-500">credits</span>
             </div>
          </div>
        </div>

        {/* Warning Banner */}
        {lowCredits && !statsLoading && (
          <div className="animate-fade-in p-4 rounded-xl border border-yellow-500/50 bg-yellow-500/10 flex items-center gap-4 text-yellow-200 shadow-[0_0_20px_rgba(234,179,8,0.2)]">
            <AlertTriangle className="text-yellow-500 h-6 w-6" />
            <div>
              <p className="font-bold">Low Credit Balance</p>
              <p className="text-sm opacity-80">Your retention offers will stop working soon. Please top up below.</p>
            </div>
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-slide-up" style={{ animationDelay: "100ms" }}>
           {/* Total Saves Card */}
           <Card glow="cyan" className="bg-white/5 border-white/10 backdrop-blur-md">
             <CardHeader className="flex flex-row items-center justify-between pb-2">
               <CardTitle className="text-sm font-medium text-gray-400 uppercase tracking-wider">Total Saves</CardTitle>
               <Activity className="h-4 w-4 text-neon-cyan" />
             </CardHeader>
             <CardContent>
               <div className="text-3xl font-bold text-white">
                 {statsLoading ? <Loader2 className="animate-spin" /> : stats.saves}
               </div>
               <p className="text-xs text-gray-500 mt-1">Customers retained</p>
             </CardContent>
           </Card>

           {/* Config Card (Restoring the UI for handleSaveConfig) */}
           <Card className="bg-white/5 border-white/10 backdrop-blur-md md:col-span-2">
             <CardHeader className="flex flex-row items-center justify-between pb-2">
               <CardTitle className="text-sm font-medium text-gray-400 uppercase tracking-wider">Offer Configuration</CardTitle>
               <Settings className="h-4 w-4 text-purple-400" />
             </CardHeader>
             <CardContent className="flex items-center gap-4">
               <div className="flex-1">
                 <label className="text-xs text-gray-500 block mb-1">Discount Percentage</label>
                 <div className="flex items-center gap-2">
                   <input
                     type="number"
                     value={discountPercent}
                     onChange={(e) => setDiscountPercent(e.target.value)}
                     className="bg-black/50 border border-white/20 rounded-md px-3 py-2 text-white w-24 focus:border-neon-cyan focus:outline-none focus:ring-1 focus:ring-neon-cyan transition-all"
                   />
                   <span className="text-gray-400">%</span>
                 </div>
               </div>
               <Button 
                 onClick={handleSaveConfig} 
                 disabled={saving}
                 variant="outline"
                 className="border-purple-500/50 text-purple-400 hover:bg-purple-500/10 hover:text-purple-300"
               >
                 {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                 Save Changes
               </Button>
             </CardContent>
           </Card>
        </div>

        {/* Credit Packs */}
        <div className="animate-slide-up" style={{ animationDelay: "200ms" }}>
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2 text-white">
            <Zap className="text-neon-yellow" /> Top Up Credits
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {creditPacks.map((pack) => {
              const Icon = pack.icon;
              const isPopular = (pack as any).popular; 
              const isPurchasing = purchasingPack === pack.packSize;
              
              return (
                <Card 
                  key={pack.name} 
                  glow={isPopular ? "pink" : "none"}
                  className={`relative flex flex-col justify-between transition-all duration-300 border-white/10 ${isPopular ? 'bg-white/10 scale-105 z-10' : 'bg-white/5 hover:bg-white/10'}`}
                >
                  {isPopular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-neon-pink text-white text-[10px] font-bold uppercase tracking-widest rounded-full shadow-[0_0_15px_rgba(255,0,255,0.5)]">
                      Most Popular
                    </div>
                  )}

                  <CardContent className="pt-8 space-y-6">
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${isPopular ? 'bg-neon-pink/20 text-neon-pink' : 'bg-white/10 text-gray-400'}`}>
                        <Icon size={24} />
                      </div>
                      <div>
                        <h3 className="font-bold text-lg text-white">{pack.name}</h3>
                        <p className="text-sm text-gray-400">{pack.description}</p>
                      </div>
                    </div>

                    <div className="flex items-baseline gap-2">
                      <span className="text-4xl font-bold text-white">{pack.price}</span>
                      <span className="text-gray-500 font-mono">/ {pack.credits} credits</span>
                    </div>

                    <Button
                      variant={isPopular ? "neon" : "secondary"}
                      className={`w-full font-bold h-12 ${!isPopular && "bg-white/10 hover:bg-white/20 border-0"}`}
                      onClick={() => handlePurchaseCredits(pack.packSize)}
                      disabled={isPurchasing}
                    >
                      {isPurchasing ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        "Purchase Pack"
                      )}
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}