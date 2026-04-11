"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";

interface Assignment {
  id: string;
  title: string;
  description: string;
  dueDate: string;
  totalPoints: number;
  course: {
    title: string;
    code: string;
  };
  submissions: {
    id: string;
    content: string;
    fileUrl: string;
    grade: number;
    feedback: string;
    submittedAt: string;
  }[];
}

export default function AssignmentsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState<string | null>(null);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  useEffect(() => {
    if (session) {
      fetchAssignments();
    }
  }, [session]);

  async function fetchAssignments() {
    try {
      const response = await fetch("/api/assignments");
      const data = await response.json();
      setAssignments(data);
    } catch (error) {
      console.error("Failed to fetch assignments:", error);
    } finally {
      setLoading(false);
    }
  }

  async function submitAssignmentWithFile(assignmentId: string, formData: FormData) {
    setSubmitting(assignmentId);
    try {
      const response = await fetch("/api/assignments/submit", {
        method: "POST",
        body: formData,
      });
      
      if (response.ok) {
        alert("Assignment submitted successfully!");
        setShowSubmitModal(false);
        fetchAssignments();
      } else {
        const error = await response.json();
        alert(error.error || "Failed to submit assignment");
      }
    } catch (error) {
      alert("Error submitting assignment");
    } finally {
      setSubmitting(null);
    }
  }

  function isOverdue(dueDate: string) {
    return new Date(dueDate) < new Date();
  }

  const pendingAssignments = assignments.filter(a => (!a.submissions || a.submissions.length === 0) && !isOverdue(a.dueDate));
  const submittedAssignments = assignments.filter(a => a.submissions && a.submissions.length > 0);
  const overdueAssignments = assignments.filter(a => (!a.submissions || a.submissions.length === 0) && isOverdue(a.dueDate));

  const gradedSubmissions = submittedAssignments.filter(a => a.submissions[0]?.grade !== null && a.submissions[0]?.grade !== undefined);
  const averageGrade = gradedSubmissions.length > 0 
    ? Math.round(gradedSubmissions.reduce((acc, a) => acc + (a.submissions[0].grade / a.totalPoints) * 100, 0) / gradedSubmissions.length)
    : 0;

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
        <Link href="/dashboard" className="text-purple-400 hover:text-purple-300 mb-4 inline-block">← Back to Dashboard</Link>
        
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-white">Assignments</h1>
            <p className="text-white/60 mt-2">Track and submit your coursework</p>
          </div>
          <button
            onClick={fetchAssignments}
            className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm"
          >
            🔄 Refresh
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white/10 rounded-2xl p-6 border border-white/10">
            <p className="text-white/60 text-sm">Pending</p>
            <p className="text-3xl font-bold text-yellow-400 mt-2">{pendingAssignments.length}</p>
          </div>
          <div className="bg-white/10 rounded-2xl p-6 border border-white/10">
            <p className="text-white/60 text-sm">Submitted</p>
            <p className="text-3xl font-bold text-blue-400 mt-2">{submittedAssignments.length}</p>
          </div>
          <div className="bg-white/10 rounded-2xl p-6 border border-white/10">
            <p className="text-white/60 text-sm">Overdue</p>
            <p className="text-3xl font-bold text-red-400 mt-2">{overdueAssignments.length}</p>
          </div>
          <div className="bg-white/10 rounded-2xl p-6 border border-white/10">
            <p className="text-white/60 text-sm">Average Grade</p>
            <p className="text-3xl font-bold text-emerald-400 mt-2">{averageGrade}%</p>
          </div>
        </div>

        {/* Pending Assignments */}
        {pendingAssignments.length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-white mb-4">📋 Pending Assignments</h2>
            <div className="space-y-4">
              {pendingAssignments.map((assignment) => (
                <div key={assignment.id} className="bg-white/5 rounded-2xl p-6 border border-white/10 hover:bg-white/10 transition-all">
                  <div className="flex justify-between items-start flex-wrap gap-4">
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold text-white">{assignment.title}</h3>
                      <p className="text-purple-400 text-sm mb-2">{assignment.course.title} ({assignment.course.code})</p>
                      <p className="text-white/60 text-sm mb-3">{assignment.description}</p>
                      <div className="flex gap-4 text-sm">
                        <span className="text-white/60">📅 Due: {new Date(assignment.dueDate).toLocaleDateString()}</span>
                        <span className="text-white/60">⭐ Points: {assignment.totalPoints}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setSelectedAssignment(assignment);
                        setShowSubmitModal(true);
                      }}
                      className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 py-2 rounded-xl font-semibold transition-all"
                    >
                      Submit Assignment
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Submitted Assignments */}
        {submittedAssignments.length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-white mb-4">✅ Submitted Assignments</h2>
            <div className="space-y-4">
              {submittedAssignments.map((assignment) => {
                const submission = assignment.submissions[0];
                const hasGrade = submission?.grade !== null && submission?.grade !== undefined;
                const percentage = hasGrade ? Math.round((submission.grade / assignment.totalPoints) * 100) : 0;
                
                return (
                  <div key={assignment.id} className="bg-white/5 rounded-2xl p-6 border border-white/10">
                    <div className="flex justify-between items-start flex-wrap gap-4">
                      <div className="flex-1">
                        <h3 className="text-xl font-semibold text-white">{assignment.title}</h3>
                        <p className="text-purple-400 text-sm">{assignment.course.title}</p>
                        <p className="text-white/60 text-sm mt-2">{assignment.description}</p>
                        {submission.fileUrl && (
                          <a 
                            href={submission.fileUrl} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-blue-400 text-sm hover:underline inline-block mt-2"
                          >
                            📎 View Attached File
                          </a>
                        )}
                        <p className="text-white/40 text-xs mt-1">Submitted: {new Date(submission.submittedAt).toLocaleDateString()}</p>
                      </div>
                      <div className="text-right">
                        {hasGrade ? (
                          <div className="bg-emerald-500/20 rounded-xl p-4 min-w-[150px]">
                            <div className="text-emerald-400 font-semibold text-sm">
                              Grade: {submission.grade}/{assignment.totalPoints}
                            </div>
                            <div className="text-3xl font-bold text-emerald-400 mt-1">
                              {percentage}%
                            </div>
                            {submission.feedback && (
                              <div className="text-white/60 text-sm mt-2 border-t border-emerald-500/30 pt-2">
                                📝 "{submission.feedback}"
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="bg-yellow-500/20 rounded-xl p-4 min-w-[150px]">
                            <div className="text-yellow-400 font-semibold">
                              Awaiting Grade
                            </div>
                            <div className="text-2xl font-bold text-yellow-400 mt-1">
                              Pending
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Overdue Assignments */}
        {overdueAssignments.length > 0 && (
          <div>
            <h2 className="text-2xl font-bold text-white mb-4">⚠️ Overdue Assignments</h2>
            <div className="space-y-4">
              {overdueAssignments.map((assignment) => (
                <div key={assignment.id} className="bg-red-500/10 rounded-2xl p-6 border border-red-500/30">
                  <div className="flex justify-between items-start flex-wrap gap-4">
                    <div>
                      <h3 className="text-xl font-semibold text-white">{assignment.title}</h3>
                      <p className="text-purple-400 text-sm mb-2">{assignment.course.title}</p>
                      <p className="text-white/60 text-sm">{assignment.description}</p>
                      <p className="text-red-400 text-sm mt-2">⚠️ Past due date</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {assignments.length === 0 && (
          <div className="bg-white/10 rounded-2xl p-12 text-center">
            <p className="text-white/60">No assignments available for your enrolled courses.</p>
          </div>
        )}
      </div>

      {/* Submit Modal with File Upload */}
      {showSubmitModal && selectedAssignment && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-slate-800 rounded-2xl p-8 w-full max-w-lg border border-white/20 shadow-2xl">
            <h2 className="text-2xl font-bold text-white mb-2">Submit Assignment</h2>
            <p className="text-purple-400 mb-1">{selectedAssignment.title}</p>
            <p className="text-white/40 text-sm mb-6">{selectedAssignment.description}</p>
            
            <form onSubmit={async (e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              formData.append("assignmentId", selectedAssignment.id);
              await submitAssignmentWithFile(selectedAssignment.id, formData);
            }}>
              <div className="mb-4">
                <label className="block text-white mb-2">Text Submission (optional)</label>
                <textarea
                  name="content"
                  rows={4}
                  className="w-full bg-white/10 border border-white/20 rounded-xl p-4 text-white placeholder:text-white/40 focus:outline-none focus:border-purple-500 resize-none"
                  placeholder="Write your submission here..."
                />
              </div>
              
              <div className="mb-6">
                <label className="block text-white mb-2">Or Upload File</label>
                <input
                  type="file"
                  name="file"
                  accept=".pdf,.doc,.docx,.txt,.jpg,.png,.zip"
                  className="w-full bg-white/10 border border-white/20 rounded-xl p-3 text-white file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-purple-600 file:text-white hover:file:bg-purple-700 cursor-pointer"
                />
                <p className="text-white/40 text-xs mt-2">Accepted: PDF, DOC, DOCX, TXT, JPG, PNG, ZIP (Max 10MB)</p>
              </div>
              
              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={submitting === selectedAssignment.id}
                  className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white py-3 rounded-xl font-semibold disabled:opacity-50 transition-all"
                >
                  {submitting === selectedAssignment.id ? "Submitting..." : "Submit Assignment"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowSubmitModal(false);
                  }}
                  className="flex-1 bg-white/10 hover:bg-white/20 text-white py-3 rounded-xl font-semibold transition-all"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}