"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import Link from "next/link";

export default function AnalyticsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-blue-950 to-purple-950">
        <div className="w-16 h-16 border-4 border-white/20 border-t-purple-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (!session) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-purple-950">
      <div className="container mx-auto px-4 py-12">
        <Link href="/dashboard" className="text-purple-400 hover:text-purple-300 mb-4 inline-block">← Back to Dashboard</Link>
        <h1 className="text-4xl font-bold text-white mb-8">Learning Analytics</h1>
        
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-white/5 rounded-2xl p-8 border border-white/10">
            <h3 className="text-xl font-semibold text-white mb-4">📊 Performance Overview</h3>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-white/60">Web Development</span>
                  <span className="text-white">75%</span>
                </div>
                <div className="w-full bg-white/10 rounded-full h-2">
                  <div className="bg-blue-500 rounded-full h-2" style={{ width: "75%" }} />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-white/60">Database Systems</span>
                  <span className="text-white">45%</span>
                </div>
                <div className="w-full bg-white/10 rounded-full h-2">
                  <div className="bg-yellow-500 rounded-full h-2" style={{ width: "45%" }} />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-white/60">UI/UX Design</span>
                  <span className="text-white">90%</span>
                </div>
                <div className="w-full bg-white/10 rounded-full h-2">
                  <div className="bg-emerald-500 rounded-full h-2" style={{ width: "90%" }} />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white/5 rounded-2xl p-8 border border-white/10">
            <h3 className="text-xl font-semibold text-white mb-4">🎯 Goals & Progress</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-white/60">Complete all assignments</span>
                <span className="text-emerald-400">3/5</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-white/60">Achieve 3.5+ GPA</span>
                <span className="text-emerald-400">3.6</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-white/60">Study hours this week</span>
                <span className="text-blue-400">12/20 hrs</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}