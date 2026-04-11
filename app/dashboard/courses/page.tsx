"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import Link from "next/link";

interface Course {
  id: string;
  title: string;
  code: string;
  description: string;
  instructor: string;
  credits: number;
  capacity: number;
  enrolled: number;
  startDate: string;
  endDate: string;
  enrollments?: { progress: number; status: string }[];
}

export default function CoursesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  const fetchCourses = useCallback(async () => {
    try {
      const response = await fetch("/api/courses");
      const data = await response.json();
      setCourses(data);
    } catch (error) {
      console.error("Failed to fetch courses:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (session) {
      fetchCourses();
    }
  }, [session, fetchCourses]);

  async function enrollInCourse(courseId: string, courseTitle: string) {
    setActionLoading(courseId);
    try {
      const response = await fetch("/api/enroll", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ courseId }),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        alert(`Successfully enrolled in ${courseTitle}!`);
        fetchCourses();
      } else {
        alert(`Failed to enroll: ${data.error || "Unknown error"}`);
      }
    } catch (error) {
      alert("Network error. Please try again.");
    } finally {
      setActionLoading(null);
    }
  }

  async function dropCourse(courseId: string, courseTitle: string) {
    if (!confirm(`Are you sure you want to drop ${courseTitle}?`)) return;
    
    setActionLoading(courseId);
    try {
      const response = await fetch("/api/enroll", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ courseId }),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        alert(`Successfully dropped ${courseTitle}`);
        fetchCourses();
      } else {
        alert(`Failed to drop course: ${data.error || "Unknown error"}`);
      }
    } catch (error) {
      alert("Network error. Please try again.");
    } finally {
      setActionLoading(null);
    }
  }

  const enrolledCourses = courses.filter(c => c.enrollments && c.enrollments.length > 0);
  const availableCourses = courses.filter(c => !c.enrollments || c.enrollments.length === 0);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-blue-950 to-purple-950">
        <div className="w-16 h-16 border-4 border-white/20 border-t-purple-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-purple-950">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white">My Learning</h1>
          <p className="text-white/60 mt-2">Track your progress and discover new courses</p>
        </div>

        {enrolledCourses.length > 0 && (
          <div className="mb-12">
            <h2 className="text-2xl font-bold text-white mb-4">📚 In Progress ({enrolledCourses.length})</h2>
            <div className="grid lg:grid-cols-2 gap-6">
              {enrolledCourses.map((course) => {
                const progress = course.enrollments?.[0]?.progress || 0;
                return (
                  <div key={course.id} className="bg-white/5 rounded-2xl border border-white/10 hover:bg-white/10 transition-all overflow-hidden">
                    <div className="p-6">
                      <h3 className="text-xl font-semibold text-white">{course.title}</h3>
                      <p className="text-purple-400 text-sm mb-2">{course.code}</p>
                      <p className="text-white/60 text-sm mb-4">{course.description}</p>
                      <div className="mb-4">
                        <div className="flex justify-between text-sm mb-2">
                          <span className="text-white/60">Your Progress</span>
                          <span className="text-white">{progress}%</span>
                        </div>
                        <div className="w-full bg-white/10 rounded-full h-2">
                          <div className="bg-gradient-to-r from-blue-500 to-purple-500 rounded-full h-2" style={{ width: `${progress}%` }} />
                        </div>
                      </div>
                      <div className="flex gap-3">
                        <button className="flex-1 bg-blue-600/50 hover:bg-blue-600 text-white py-2 rounded-xl font-semibold text-sm transition-all">
                          +10% Complete
                        </button>
                        <button
                          onClick={() => dropCourse(course.id, course.title)}
                          disabled={actionLoading === course.id}
                          className="px-4 bg-red-600/30 hover:bg-red-600 text-white py-2 rounded-xl font-semibold text-sm transition-all disabled:opacity-50"
                        >
                          {actionLoading === course.id ? "..." : "Drop"}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {availableCourses.length > 0 && (
          <div>
            <h2 className="text-2xl font-bold text-white mb-4">📖 Available Courses ({availableCourses.length})</h2>
            <div className="grid lg:grid-cols-2 gap-6">
              {availableCourses.map((course) => (
                <div key={course.id} className="bg-white/5 rounded-2xl border border-white/10 hover:bg-white/10 transition-all overflow-hidden">
                  <div className="p-6">
                    <h3 className="text-xl font-semibold text-white">{course.title}</h3>
                    <p className="text-purple-400 text-sm mb-2">{course.code}</p>
                    <p className="text-white/60 text-sm mb-4">{course.description}</p>
                    <div className="flex items-center gap-4 text-sm mb-4">
                      <span className="text-white/60">👨‍🏫 {course.instructor}</span>
                      <span className="text-white/60">📚 {course.credits} credits</span>
                      <span className="text-white/60">🎓 {course.capacity - course.enrolled} spots left</span>
                    </div>
                    <button
                      onClick={() => enrollInCourse(course.id, course.title)}
                      disabled={actionLoading === course.id}
                      className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white py-2 rounded-xl font-semibold transition-all disabled:opacity-50"
                    >
                      {actionLoading === course.id ? "Enrolling..." : "Enroll Now"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {enrolledCourses.length === 0 && availableCourses.length === 0 && (
          <div className="bg-white/10 rounded-2xl p-12 text-center">
            <p className="text-white/60">No courses available at the moment.</p>
          </div>
        )}
      </div>
    </div>
  );
}