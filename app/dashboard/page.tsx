"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import { 
  BookOpen, 
  ClipboardList, 
  MessageSquare, 
  TrendingUp,
  Award,
  Calendar,
  Star,
  Clock,
  CheckCircle
} from "lucide-react";

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [greeting, setGreeting] = useState("");

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting("Good morning");
    else if (hour < 18) setGreeting("Good afternoon");
    else setGreeting("Good evening");
  }, []);

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

  const stats = [
    { label: "Current GPA", value: "3.8", change: "+0.3", icon: TrendingUp, color: "text-emerald-400", bg: "bg-emerald-400/10" },
    { label: "Enrolled Courses", value: "5", change: "+2", icon: BookOpen, color: "text-blue-400", bg: "bg-blue-400/10" },
    { label: "Study Streak", value: "12", change: "days", icon: Award, color: "text-amber-400", bg: "bg-amber-400/10" },
    { label: "Completion Rate", value: "78%", change: "+12%", icon: CheckCircle, color: "text-purple-400", bg: "bg-purple-400/10" },
  ];

  const recentActivities = [
    { icon: CheckCircle, message: "You completed Module 3 of Web Development", time: "2 hours ago", color: "text-emerald-400" },
    { icon: ClipboardList, message: "New assignment posted: Database Design Project", time: "5 hours ago", color: "text-blue-400" },
    { icon: Star, message: "Grade released: UI/UX Design - 92%", time: "1 day ago", color: "text-amber-400" },
    { icon: Calendar, message: "Reminder: Team meeting tomorrow at 2 PM", time: "1 day ago", color: "text-purple-400" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-purple-950">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">
            {greeting}, {session.user?.name?.split(" ")[0] || "Student"}! 👋
          </h1>
          <p className="text-white/60">Here's your learning journey at a glance.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => (
            <div key={index} className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10 hover:bg-white/10 transition-all group">
              <div className="flex justify-between items-start mb-4">
                <div className={`p-3 rounded-xl ${stat.bg} group-hover:scale-110 transition-transform`}>
                  <stat.icon className={`w-6 h-6 ${stat.color}`} />
                </div>
                <span className={`text-xs ${stat.color} bg-white/10 px-2 py-1 rounded-full`}>
                  {stat.change}
                </span>
              </div>
              <p className="text-3xl font-bold text-white mb-1">{stat.value}</p>
              <p className="text-white/60 text-sm">{stat.label}</p>
            </div>
          ))}
        </div>

        <div className="grid lg:grid-cols-2 gap-8 mb-8">
          <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-semibold text-white">Recent Activity</h3>
              <button className="text-sm text-purple-400 hover:text-purple-300 transition-colors">View all →</button>
            </div>
            <div className="space-y-4">
              {recentActivities.map((activity, i) => (
                <div key={i} className="flex items-start gap-4 p-3 rounded-xl hover:bg-white/5 transition-all">
                  <activity.icon className={`w-5 h-5 ${activity.color} mt-0.5`} />
                  <div className="flex-1">
                    <p className="text-white text-sm">{activity.message}</p>
                    <p className="text-white/40 text-xs mt-1">{activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-semibold text-white">Upcoming Assignments</h3>
              <button className="text-sm text-purple-400 hover:text-purple-300 transition-colors">View all →</button>
            </div>
            <div className="space-y-4">
              <div className="flex items-start justify-between p-3 rounded-xl hover:bg-white/5 transition-all">
                <div>
                  <p className="text-white font-medium">Database Design Project</p>
                  <p className="text-white/40 text-xs mt-1">Database Systems</p>
                  <div className="flex items-center gap-2 mt-2">
                    <Clock className="w-3 h-3 text-white/40" />
                    <p className="text-white/40 text-xs">Due: Tomorrow, 11:59 PM</p>
                  </div>
                </div>
                <span className="text-xs px-2 py-1 rounded-full bg-red-500/20 text-red-400">High</span>
              </div>
              <div className="flex items-start justify-between p-3 rounded-xl hover:bg-white/5 transition-all">
                <div>
                  <p className="text-white font-medium">React Component Assignment</p>
                  <p className="text-white/40 text-xs mt-1">Web Development</p>
                  <div className="flex items-center gap-2 mt-2">
                    <Clock className="w-3 h-3 text-white/40" />
                    <p className="text-white/40 text-xs">Due: Feb 15, 11:59 PM</p>
                  </div>
                </div>
                <span className="text-xs px-2 py-1 rounded-full bg-yellow-500/20 text-yellow-400">Medium</span>
              </div>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          <Link href="/dashboard/courses">
            <div className="bg-gradient-to-r from-blue-600/20 to-blue-500/20 rounded-2xl p-6 border border-blue-500/30 hover:scale-105 transition-all cursor-pointer">
              <BookOpen className="w-12 h-12 text-blue-400 mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">Continue Learning</h3>
              <p className="text-white/60 text-sm">Resume your courses and track progress</p>
            </div>
          </Link>

          <Link href="/dashboard/assignments">
            <div className="bg-gradient-to-r from-purple-600/20 to-pink-500/20 rounded-2xl p-6 border border-purple-500/30 hover:scale-105 transition-all cursor-pointer">
              <ClipboardList className="w-12 h-12 text-purple-400 mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">View Tasks</h3>
              <p className="text-white/60 text-sm">3 assignments due this week</p>
            </div>
          </Link>

          <Link href="/dashboard/messages">
            <div className="bg-gradient-to-r from-emerald-600/20 to-green-500/20 rounded-2xl p-6 border border-emerald-500/30 hover:scale-105 transition-all cursor-pointer">
              <MessageSquare className="w-12 h-12 text-emerald-400 mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">Messages</h3>
              <p className="text-white/60 text-sm">Connect with classmates and instructors</p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}