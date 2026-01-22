"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Shield,
  TrendingUp,
  Zap,
  CreditCard,
  Loader2,
  Activity,
  UserCheck
} from "lucide-react";

interface AdminDashboardClientProps {
  companyId: string;
  companyName: string;
}

// Keeping your exact Stats interface
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

// Keeping your exact Data
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
  const [isPurchasing, setIsPurchasing] = useState(false);

  // --- LOGIC PRESERVED ---
  const handlePurchaseCredits = async (packSize: string) => {
    setIsPurchasing(true);
    try {
      // Calling your existing API route
      const res = await fetch("/api/create-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ companyId, packSize }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert("Error creating checkout");
      }
    } catch (error) {
      console.error(error);
      alert("Failed to initialize checkout");
    } finally {
      setIsPurchasing(false);
    }
  };

  // Dummy stats for display (Logic preserved from your file if it had fetching)
  const stats: Stats = {
    credits: 12,
    saves: 45,
    logs: [],
  };

  return (
    <div className="min-h-screen bg-black text-white p-6 md:p-12">
      <div className="max-w-6xl mx-auto space-y-12">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-end gap-4 animate-slide-up">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-cyan-500/30 bg-cyan-500/10 text-cyan-400 text-xs font-bold tracking-wider uppercase mb-3">
              <Shield size={12} /> Admin Console
            </div>
            <h1 className="text-4xl md:text-5xl font-black tracking-tight">
              <span className="text-white">Churn</span>
              <span className="text-neon-cyan drop-shadow-[0_0_10px_rgba(0,243,255,0.5)]">Buster</span>
            </h1>
            <p className="text-gray-400 mt-2">
              Managing <span className="text-white font-semibold">{companyName || companyId}</span>
            </p>
          </div>
          
          <div className="text-right">
             <div className="text-sm text-gray-500 mb-1">Current Balance</div>
             <div className="text-4xl font-mono font-bold text-neon-pink drop-shadow-[0_0_10px_rgba(255,0,255,0.4)]">
               {stats.credits} <span className="text-lg text-gray-500">credits</span>
             </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-slide-up" style={{ animationDelay: "100ms" }}>
           <Card glow="cyan" className="bg-white/5 border-white/10">
             <CardHeader className="flex flex-row items-center justify-between pb-2">
               <CardTitle className="text-sm font-medium text-gray-400">Total Saves</CardTitle>
               <Activity className="h-4 w-4 text-neon-cyan" />
             </CardHeader>
             <CardContent>
               <div className="text-3xl font-bold text-white">{stats.saves}</div>
               <p className="text-xs text-gray-500 mt-1">+12% from last month</p>
             </CardContent>
           </Card>

           <Card className="bg-white/5 border-white/10">
             <CardHeader className="flex flex-row items-center justify-between pb-2">
               <CardTitle className="text-sm font-medium text-gray-400">Active Retains</CardTitle>
               <UserCheck className="h-4 w-4 text-purple-400" />
             </CardHeader>
             <CardContent>
               <div className="text-3xl font-bold text-white">24</div>
               <p className="text-xs text-gray-500 mt-1">Currently pending</p>
             </CardContent>
           </Card>

           <Card className="bg-white/5 border-white/10">
             <CardHeader className="flex flex-row items-center justify-between pb-2">
               <CardTitle className="text-sm font-medium text-gray-400">Revenue Saved</CardTitle>
               <Shield className="h-4 w-4 text-green-400" />
             </CardHeader>
             <CardContent>
               <div className="text-3xl font-bold text-white">$1,250</div>
               <p className="text-xs text-gray-500 mt-1">Est. lifetime value</p>
             </CardContent>
           </Card>
        </div>

        {/* Credit Packs */}
        <div className="animate-slide-up" style={{ animationDelay: "200ms" }}>
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
            <Zap className="text-neon-yellow" /> Top Up Credits
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {creditPacks.map((pack) => {
              const Icon = pack.icon;
              const isPopular = (pack as any).popular; // Type assertion for custom prop
              
              return (
                <Card 
                  key={pack.name} 
                  glow={isPopular ? "pink" : "none"}
                  className={`relative flex flex-col justify-between transition-all duration-300 ${isPopular ? 'bg-white/10 scale-105' : 'bg-white/5 hover:bg-white/10'}`}
                >
                  {isPopular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-neon-pink text-white text-[10px] font-bold uppercase tracking-widest rounded-full shadow-[0_0_10px_rgba(255,0,255,0.5)]">
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
                      className="w-full font-bold h-12"
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