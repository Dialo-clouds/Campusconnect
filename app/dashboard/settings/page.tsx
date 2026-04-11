"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";

export default function SettingsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [notifications, setNotifications] = useState(true);
  const [darkMode, setDarkMode] = useState(true);

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
        <h1 className="text-4xl font-bold text-white mb-8">Settings</h1>

        <div className="max-w-2xl space-y-6">
          <div className="bg-white/5 rounded-2xl p-8 border border-white/10">
            <h3 className="text-xl font-semibold text-white mb-6">Profile Settings</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-white/60 mb-2">Full Name</label>
                <input type="text" value={session.user?.name || ""} className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white" />
              </div>
              <div>
                <label className="block text-white/60 mb-2">Email</label>
                <input type="email" value={session.user?.email || ""} className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white" />
              </div>
              <button className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-xl font-semibold">Save Changes</button>
            </div>
          </div>

          <div className="bg-white/5 rounded-2xl p-8 border border-white/10">
            <h3 className="text-xl font-semibold text-white mb-6">Preferences</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-white">Email Notifications</span>
                <button onClick={() => setNotifications(!notifications)} className={`w-12 h-6 rounded-full transition-all ${notifications ? "bg-purple-600" : "bg-white/20"}`}>
                  <div className={`w-5 h-5 rounded-full bg-white transition-all ${notifications ? "translate-x-6" : "translate-x-1"}`} />
                </button>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-white">Dark Mode</span>
                <button onClick={() => setDarkMode(!darkMode)} className={`w-12 h-6 rounded-full transition-all ${darkMode ? "bg-purple-600" : "bg-white/20"}`}>
                  <div className={`w-5 h-5 rounded-full bg-white transition-all ${darkMode ? "translate-x-6" : "translate-x-1"}`} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}