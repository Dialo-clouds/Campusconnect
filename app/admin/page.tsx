"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { 
  Users, 
  BookOpen, 
  GraduationCap, 
  Activity, 
  TrendingUp, 
  UserPlus, 
  BookPlus, 
  Trash2, 
  Edit, 
  Star, 
  Calendar, 
  CheckCircle, 
  XCircle,
  ClipboardList, 
  Send, 
  Eye, 
  Clock  // ← ADD THIS
} from "lucide-react";
interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
}

interface Course {
  id: string;
  title: string;
  code: string;
  credits: number;
  enrolled: number;
  capacity: number;
  instructor: string;
}

interface Submission {
  id: string;
  content: string;
  fileUrl: string;
  grade: number | null;
  feedback: string | null;
  submittedAt: string;
  assignment: {
    id: string;
    title: string;
    totalPoints: number;
    course: {
      title: string;
      code: string;
    };
  };
  user: {
    id: string;
    name: string;
    email: string;
  };
}

interface Stats {
  totalUsers: number;
  totalCourses: number;
  totalEnrollments: number;
  totalSubmissions: number;
}

export default function AdminPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [stats, setStats] = useState<Stats>({ totalUsers: 0, totalCourses: 0, totalEnrollments: 0, totalSubmissions: 0 });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [showAddCourse, setShowAddCourse] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
  const [gradeValue, setGradeValue] = useState("");
  const [feedbackValue, setFeedbackValue] = useState("");
  const [newCourse, setNewCourse] = useState({ title: "", code: "", credits: 3, instructor: "", capacity: 30, description: "" });

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
    if (session?.user?.role !== "ADMIN") {
      router.push("/dashboard");
    }
  }, [status, router, session]);

  useEffect(() => {
    if (session?.user?.role === "ADMIN") {
      fetchData();
    }
  }, [session]);

  async function fetchData() {
    try {
      const [usersRes, coursesRes, statsRes, submissionsRes] = await Promise.all([
        fetch("/api/admin/users"),
        fetch("/api/admin/courses"),
        fetch("/api/admin/stats"),
        fetch("/api/admin/submissions"),
      ]);
      
      const usersData = await usersRes.json();
      const coursesData = await coursesRes.json();
      const statsData = await statsRes.json();
      const submissionsData = await submissionsRes.json();
      
      setUsers(usersData);
      setCourses(coursesData);
      setStats(statsData);
      setSubmissions(submissionsData);
    } catch (error) {
      console.error("Failed to fetch admin data:", error);
    } finally {
      setLoading(false);
    }
  }

  async function deleteUser(userId: string) {
    if (!confirm("Are you sure you want to delete this user?")) return;
    try {
      await fetch(`/api/admin/users/${userId}`, { method: "DELETE" });
      fetchData();
    } catch (error) {
      alert("Failed to delete user");
    }
  }

  async function changeUserRole(userId: string, newRole: string) {
    try {
      await fetch(`/api/admin/users/${userId}/role`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole }),
      });
      fetchData();
    } catch (error) {
      alert("Failed to change role");
    }
  }

  async function deleteCourse(courseId: string) {
    if (!confirm("Are you sure you want to delete this course?")) return;
    try {
      await fetch(`/api/admin/courses/${courseId}`, { method: "DELETE" });
      fetchData();
    } catch (error) {
      alert("Failed to delete course");
    }
  }

  async function addCourse() {
    if (!newCourse.title || !newCourse.code || !newCourse.instructor) {
      alert("Please fill in all required fields");
      return;
    }
    try {
      const response = await fetch("/api/admin/courses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newCourse),
      });
      if (response.ok) {
        setShowAddCourse(false);
        setNewCourse({ title: "", code: "", credits: 3, instructor: "", capacity: 30, description: "" });
        fetchData();
      } else {
        alert("Failed to add course");
      }
    } catch (error) {
      alert("Error adding course");
    }
  }

  async function gradeSubmission(submissionId: string, grade: number, feedback: string) {
    try {
      const response = await fetch("/api/grade", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ submissionId, grade, feedback }),
      });
      if (response.ok) {
        alert("Grade saved successfully!");
        setSelectedSubmission(null);
        fetchData();
      } else {
        alert("Failed to save grade");
      }
    } catch (error) {
      alert("Error saving grade");
    }
  }

  const pendingSubmissions = submissions.filter(s => s.grade === null || s.grade === undefined);
  const gradedSubmissions = submissions.filter(s => s.grade !== null && s.grade !== undefined);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-blue-950 to-purple-950">
        <div className="w-16 h-16 border-4 border-white/20 border-t-purple-500 rounded-full animate-spin" />
      </div>
    );
  }

  const statCards = [
    { icon: Users, label: "Total Users", value: stats.totalUsers, color: "text-blue-400", bg: "bg-blue-500/10" },
    { icon: BookOpen, label: "Total Courses", value: stats.totalCourses, color: "text-purple-400", bg: "bg-purple-500/10" },
    { icon: GraduationCap, label: "Enrollments", value: stats.totalEnrollments, color: "text-emerald-400", bg: "bg-emerald-500/10" },
    { icon: ClipboardList, label: "Submissions", value: stats.totalSubmissions, color: "text-orange-400", bg: "bg-orange-500/10" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-purple-950">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white">Admin Dashboard</h1>
          <p className="text-white/60 mt-2">Manage your platform, grade assignments, and view analytics</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {statCards.map((stat, index) => (
            <div key={index} className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
              <div className={`p-3 rounded-xl ${stat.bg} w-fit mb-4`}>
                <stat.icon className={`w-6 h-6 ${stat.color}`} />
              </div>
              <p className="text-3xl font-bold text-white">{stat.value}</p>
              <p className="text-white/60 text-sm mt-1">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-2 mb-6 border-b border-white/10 pb-4 overflow-x-auto">
          <button
            onClick={() => setActiveTab("overview")}
            className={`px-4 py-2 rounded-lg transition-all whitespace-nowrap ${activeTab === "overview" ? "bg-purple-600 text-white" : "text-white/60 hover:text-white"}`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab("grading")}
            className={`px-4 py-2 rounded-lg transition-all whitespace-nowrap ${activeTab === "grading" ? "bg-purple-600 text-white" : "text-white/60 hover:text-white"}`}
          >
            Grade Submissions ({pendingSubmissions.length} pending)
          </button>
          <button
            onClick={() => setActiveTab("users")}
            className={`px-4 py-2 rounded-lg transition-all whitespace-nowrap ${activeTab === "users" ? "bg-purple-600 text-white" : "text-white/60 hover:text-white"}`}
          >
            Users ({users.length})
          </button>
          <button
            onClick={() => setActiveTab("courses")}
            className={`px-4 py-2 rounded-lg transition-all whitespace-nowrap ${activeTab === "courses" ? "bg-purple-600 text-white" : "text-white/60 hover:text-white"}`}
          >
            Courses ({courses.length})
          </button>
        </div>

        {/* Overview Tab */}
        {activeTab === "overview" && (
          <div className="grid lg:grid-cols-2 gap-6">
            <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
              <h3 className="text-lg font-semibold text-white mb-4">Recent Users</h3>
              <div className="space-y-3">
                {users.slice(0, 5).map((user) => (
                  <div key={user.id} className="flex justify-between items-center p-3 rounded-xl hover:bg-white/5">
                    <div>
                      <p className="text-white font-medium">{user.name || "No name"}</p>
                      <p className="text-white/40 text-sm">{user.email}</p>
                    </div>
                    <span className="text-xs text-white/40">{new Date(user.createdAt).toLocaleDateString()}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
              <h3 className="text-lg font-semibold text-white mb-4">Popular Courses</h3>
              <div className="space-y-3">
                {courses.slice(0, 5).map((course) => (
                  <div key={course.id} className="flex justify-between items-center p-3 rounded-xl hover:bg-white/5">
                    <div>
                      <p className="text-white font-medium">{course.title}</p>
                      <p className="text-white/40 text-sm">{course.code}</p>
                    </div>
                    <span className="text-xs text-emerald-400">{course.enrolled}/{course.capacity} enrolled</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Grading Tab */}
        {activeTab === "grading" && (
          <div>
            {/* Pending Submissions */}
            {pendingSubmissions.length > 0 && (
              <div className="mb-8">
                <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-yellow-400" />
                  Pending Grading ({pendingSubmissions.length})
                </h2>
                <div className="space-y-4">
                  {pendingSubmissions.map((sub) => (
                    <div key={sub.id} className="bg-white/5 rounded-2xl p-6 border border-white/10 hover:bg-white/10 transition-all">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="text-xl font-semibold text-white">{sub.assignment.title}</h3>
                          <p className="text-purple-400 text-sm">{sub.assignment.course.title} ({sub.assignment.course.code})</p>
                          <p className="text-white/60 text-sm mt-1">Student: {sub.user.name || sub.user.email}</p>
                        </div>
                        <span className="text-xs text-yellow-400 bg-yellow-400/10 px-2 py-1 rounded-full">Pending</span>
                      </div>
                      
                      <div className="bg-white/5 rounded-xl p-4 mb-4">
                        <p className="text-white/80 text-sm">{sub.content || "No text submission"}</p>
                        {sub.fileUrl && (
                          <a 
                            href={sub.fileUrl} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-blue-400 text-sm hover:underline inline-block mt-2"
                          >
                            📎 View Attached File
                          </a>
                        )}
                      </div>
                      
                      <div className="flex gap-3">
                        <button
                          onClick={() => {
                            setSelectedSubmission(sub);
                            setGradeValue(sub.grade?.toString() || "");
                            setFeedbackValue(sub.feedback || "");
                          }}
                          className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 py-2 rounded-xl font-semibold"
                        >
                          Grade Submission
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Graded Submissions */}
            {gradedSubmissions.length > 0 && (
              <div>
                <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-400" />
                  Graded ({gradedSubmissions.length})
                </h2>
                <div className="space-y-4">
                  {gradedSubmissions.map((sub) => {
                    const percentage = Math.round((sub.grade! / sub.assignment.totalPoints) * 100);
                    return (
                      <div key={sub.id} className="bg-white/5 rounded-2xl p-6 border border-white/10">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="text-xl font-semibold text-white">{sub.assignment.title}</h3>
                            <p className="text-purple-400 text-sm">{sub.assignment.course.title}</p>
                            <p className="text-white/60 text-sm mt-1">Student: {sub.user.name || sub.user.email}</p>
                          </div>
                          <div className="text-right">
                            <span className="text-emerald-400 font-semibold">{sub.grade}/{sub.assignment.totalPoints}</span>
                            <p className="text-2xl font-bold text-emerald-400">{percentage}%</p>
                          </div>
                        </div>
                        {sub.feedback && (
                          <div className="mt-3 p-3 bg-white/5 rounded-lg">
                            <p className="text-white/40 text-xs">Feedback:</p>
                            <p className="text-white/80 text-sm">"{sub.feedback}"</p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {submissions.length === 0 && (
              <div className="bg-white/10 rounded-2xl p-12 text-center">
                <p className="text-white/60">No submissions yet.</p>
              </div>
            )}
          </div>
        )}

        {/* Users Tab */}
        {activeTab === "users" && (
          <div className="bg-white/5 rounded-2xl border border-white/10 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-white/10 border-b border-white/10">
                  <tr>
                    <th className="text-left p-4 text-white/60">Name</th>
                    <th className="text-left p-4 text-white/60">Email</th>
                    <th className="text-left p-4 text-white/60">Role</th>
                    <th className="text-left p-4 text-white/60">Joined</th>
                    <th className="text-left p-4 text-white/60">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id} className="border-b border-white/5 hover:bg-white/5">
                      <td className="p-4 text-white">{user.name || "-"}</td>
                      <td className="p-4 text-white/80">{user.email}</td>
                      <td className="p-4">
                        <select
                          value={user.role}
                          onChange={(e) => changeUserRole(user.id, e.target.value)}
                          className="bg-white/10 border border-white/20 rounded-lg px-2 py-1 text-white text-sm"
                        >
                          <option value="STUDENT">Student</option>
                          <option value="ADMIN">Admin</option>
                        </select>
                      </td>
                      <td className="p-4 text-white/60 text-sm">{new Date(user.createdAt).toLocaleDateString()}</td>
                      <td className="p-4">
                        <button
                          onClick={() => deleteUser(user.id)}
                          className="text-red-400 hover:text-red-300 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Courses Tab */}
        {activeTab === "courses" && (
          <div>
            <div className="flex justify-end mb-4">
              <button
                onClick={() => setShowAddCourse(true)}
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
              >
                <BookPlus className="w-4 h-4" /> Add Course
              </button>
            </div>

            <div className="bg-white/5 rounded-2xl border border-white/10 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-white/10 border-b border-white/10">
                    <tr>
                      <th className="text-left p-4 text-white/60">Title</th>
                      <th className="text-left p-4 text-white/60">Code</th>
                      <th className="text-left p-4 text-white/60">Instructor</th>
                      <th className="text-left p-4 text-white/60">Credits</th>
                      <th className="text-left p-4 text-white/60">Enrolled</th>
                      <th className="text-left p-4 text-white/60">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {courses.map((course) => (
                      <tr key={course.id} className="border-b border-white/5 hover:bg-white/5">
                        <td className="p-4 text-white">{course.title}</td>
                        <td className="p-4 text-white/80">{course.code}</td>
                        <td className="p-4 text-white/80">{course.instructor}</td>
                        <td className="p-4 text-white/80">{course.credits}</td>
                        <td className="p-4">
                          <span className="text-emerald-400">{course.enrolled}</span>
                          <span className="text-white/40">/{course.capacity}</span>
                        </td>
                        <td className="p-4">
                          <button
                            onClick={() => deleteCourse(course.id)}
                            className="text-red-400 hover:text-red-300 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Grade Modal */}
      {selectedSubmission && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-slate-800 rounded-2xl p-6 w-full max-w-md border border-white/20">
            <h2 className="text-2xl font-bold text-white mb-2">Grade Submission</h2>
            <p className="text-purple-400 mb-4">{selectedSubmission.assignment.title}</p>
            <p className="text-white/60 text-sm mb-4">Student: {selectedSubmission.user.name || selectedSubmission.user.email}</p>
            
            <div className="bg-white/10 rounded-xl p-4 mb-4 max-h-40 overflow-y-auto">
              <p className="text-white/80 text-sm">{selectedSubmission.content || "No text submission"}</p>
              {selectedSubmission.fileUrl && (
                <a href={selectedSubmission.fileUrl} target="_blank" rel="noopener noreferrer" className="text-blue-400 text-sm hover:underline block mt-2">
                  📎 View Attached File
                </a>
              )}
            </div>
            
            <div className="mb-4">
              <label className="block text-white/60 text-sm mb-2">Grade (out of {selectedSubmission.assignment.totalPoints})</label>
              <input
                type="number"
                value={gradeValue}
                onChange={(e) => setGradeValue(e.target.value)}
                className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-2 text-white"
                placeholder={`0-${selectedSubmission.assignment.totalPoints}`}
              />
            </div>
            
            <div className="mb-6">
              <label className="block text-white/60 text-sm mb-2">Feedback (optional)</label>
              <textarea
                rows={3}
                value={feedbackValue}
                onChange={(e) => setFeedbackValue(e.target.value)}
                className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-2 text-white resize-none"
                placeholder="Add feedback for the student..."
              />
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={() => gradeSubmission(selectedSubmission.id, parseInt(gradeValue), feedbackValue)}
                className="flex-1 bg-gradient-to-r from-emerald-600 to-teal-600 text-white py-2 rounded-xl font-semibold"
              >
                Save Grade
              </button>
              <button
                onClick={() => setSelectedSubmission(null)}
                className="flex-1 bg-white/10 text-white py-2 rounded-xl font-semibold"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Course Modal */}
      {showAddCourse && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-slate-800 rounded-2xl p-6 w-full max-w-md border border-white/20">
            <h2 className="text-2xl font-bold text-white mb-4">Add New Course</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-white/60 text-sm mb-1">Course Title *</label>
                <input
                  type="text"
                  value={newCourse.title}
                  onChange={(e) => setNewCourse({ ...newCourse, title: e.target.value })}
                  className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-2 text-white"
                  placeholder="e.g., Advanced Web Development"
                />
              </div>
              <div>
                <label className="block text-white/60 text-sm mb-1">Course Code *</label>
                <input
                  type="text"
                  value={newCourse.code}
                  onChange={(e) => setNewCourse({ ...newCourse, code: e.target.value })}
                  className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-2 text-white"
                  placeholder="e.g., CS401"
                />
              </div>
              <div>
                <label className="block text-white/60 text-sm mb-1">Instructor *</label>
                <input
                  type="text"
                  value={newCourse.instructor}
                  onChange={(e) => setNewCourse({ ...newCourse, instructor: e.target.value })}
                  className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-2 text-white"
                  placeholder="e.g., Dr. Sarah Johnson"
                />
              </div>
              <div>
                <label className="block text-white/60 text-sm mb-1">Description</label>
                <textarea
                  rows={2}
                  value={newCourse.description}
                  onChange={(e) => setNewCourse({ ...newCourse, description: e.target.value })}
                  className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-2 text-white resize-none"
                  placeholder="Course description..."
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-white/60 text-sm mb-1">Credits</label>
                  <input
                    type="number"
                    value={newCourse.credits}
                    onChange={(e) => setNewCourse({ ...newCourse, credits: parseInt(e.target.value) })}
                    className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-2 text-white"
                  />
                </div>
                <div>
                  <label className="block text-white/60 text-sm mb-1">Capacity</label>
                  <input
                    type="number"
                    value={newCourse.capacity}
                    onChange={(e) => setNewCourse({ ...newCourse, capacity: parseInt(e.target.value) })}
                    className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-2 text-white"
                  />
                </div>
              </div>
            </div>
            
            <div className="flex gap-3 mt-6">
              <button
                onClick={addCourse}
                className="flex-1 bg-gradient-to-r from-emerald-600 to-teal-600 text-white py-2 rounded-xl font-semibold"
              >
                Add Course
              </button>
              <button
                onClick={() => setShowAddCourse(false)}
                className="flex-1 bg-white/10 text-white py-2 rounded-xl font-semibold"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}