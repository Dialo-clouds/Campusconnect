"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface Submission {
  id: string;
  content: string;
  grade: number | null;
  feedback: string | null;
  submittedAt: string;
  assignment: {
    title: string;
    totalPoints: number;
    course: { title: string };
  };
  user: { name: string; email: string };
}

export default function AdminGradesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  useEffect(() => {
    if (session) {
      fetchSubmissions();
    }
  }, [session]);

  async function fetchSubmissions() {
    try {
      const response = await fetch("/api/admin/submissions");
      const data = await response.json();
      setSubmissions(data);
    } catch (error) {
      console.error("Failed:", error);
    } finally {
      setLoading(false);
    }
  }

  async function updateGrade(submissionId: string, grade: number, feedback: string) {
    try {
      const response = await fetch("/api/grade", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ submissionId, grade, feedback }),
      });
      
      if (response.ok) {
        alert("Grade saved!");
        fetchSubmissions();
      } else {
        alert("Failed to save grade");
      }
    } catch (error) {
      console.error("Failed:", error);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-blue-950 to-purple-950">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-purple-950 p-8">
      <div className="container mx-auto">
        <h1 className="text-4xl font-bold text-white mb-8">Grade Submissions</h1>
        
        {submissions.length === 0 ? (
          <div className="bg-white/10 rounded-2xl p-12 text-center">
            <p className="text-white/60">No submissions yet.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {submissions.map((sub) => (
              <div key={sub.id} className="bg-white/10 rounded-2xl p-6 border border-white/10">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-semibold text-white">{sub.assignment.title}</h3>
                    <p className="text-purple-400">{sub.assignment.course.title}</p>
                    <p className="text-white/60 text-sm mt-2">
                      Student: {sub.user.name} ({sub.user.email})
                    </p>
                  </div>
                  <span className="text-white/40 text-sm">
                    Submitted: {new Date(sub.submittedAt).toLocaleDateString()}
                  </span>
                </div>
                
                <div className="bg-white/5 rounded-xl p-4 mb-4">
                  <p className="text-white/80">{sub.content}</p>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-white/60 text-sm mb-1">Grade (out of {sub.assignment.totalPoints})</label>
                    <input
                      type="number"
                      id={`grade-${sub.id}`}
                      defaultValue={sub.grade || ""}
                      className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white"
                      placeholder={`0-${sub.assignment.totalPoints}`}
                    />
                  </div>
                  <div>
                    <label className="block text-white/60 text-sm mb-1">Feedback</label>
                    <input
                      type="text"
                      id={`feedback-${sub.id}`}
                      defaultValue={sub.feedback || ""}
                      className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white"
                      placeholder="Add feedback..."
                    />
                  </div>
                </div>
                
                <button
                  onClick={() => {
                    const gradeInput = document.getElementById(`grade-${sub.id}`) as HTMLInputElement;
                    const feedbackInput = document.getElementById(`feedback-${sub.id}`) as HTMLInputElement;
                    const grade = parseInt(gradeInput.value);
                    const feedback = feedbackInput.value;
                    if (!isNaN(grade)) {
                      updateGrade(sub.id, grade, feedback);
                    } else {
                      alert("Please enter a valid grade");
                    }
                  }}
                  className="mt-4 w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white py-2 rounded-lg font-semibold"
                >
                  Save Grade
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}