"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
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
  averageRating?: number;
  reviewCount?: number;
  enrollments?: { progress: number; status: string }[];
  userReview?: { rating: number; comment: string };
}

export default function CoursesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  
  // Review modal state
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [selectedCourseForReview, setSelectedCourseForReview] = useState<Course | null>(null);
  const [rating, setRating] = useState(0);
  const [reviewComment, setReviewComment] = useState("");
  const [hoverRating, setHoverRating] = useState(0);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  useEffect(() => {
    if (session) {
      fetchCourses();
    }
  }, [session]);

  async function fetchCourses() {
    try {
      const response = await fetch("/api/courses");
      const data = await response.json();
      
      // Fetch reviews for each course
      const coursesWithReviews = await Promise.all(
        data.map(async (course: Course) => {
          const reviewRes = await fetch(`/api/reviews?courseId=${course.id}`);
          const reviewData = await reviewRes.json();
          
          // Check if user has already reviewed this course
          const userReview = reviewData.reviews?.find(
            (r: any) => r.userId === session?.user?.id
          );
          
          return {
            ...course,
            averageRating: reviewData.averageRating || 0,
            reviewCount: reviewData.total || 0,
            userReview: userReview ? { rating: userReview.rating, comment: userReview.comment } : null
          };
        })
      );
      
      setCourses(coursesWithReviews);
    } catch (error) {
      console.error("Failed to fetch courses:", error);
    } finally {
      setLoading(false);
    }
  }

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
        alert(`✅ Successfully enrolled in ${courseTitle}!`);
        await fetchCourses();
        window.dispatchEvent(new Event('refresh-notifications'));
      } else {
        alert(`❌ ${data.error || "Failed to enroll"}`);
      }
    } catch (error) {
      alert("❌ Network error. Please try again.");
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
        alert(`✅ Successfully dropped ${courseTitle}`);
        await fetchCourses();
        window.dispatchEvent(new Event('refresh-notifications'));
      } else {
        alert(`❌ ${data.error || "Failed to drop course"}`);
      }
    } catch (error) {
      alert("❌ Network error. Please try again.");
    } finally {
      setActionLoading(null);
    }
  }

  async function submitReview(courseId: string) {
    if (rating === 0) {
      alert("Please select a rating");
      return;
    }
    
    try {
      const response = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ courseId, rating, comment: reviewComment }),
      });
      
      if (response.ok) {
        alert("✅ Thank you for your review!");
        setShowReviewModal(false);
        setRating(0);
        setReviewComment("");
        fetchCourses();
      } else {
        alert("❌ Failed to submit review");
      }
    } catch (error) {
      alert("❌ Error submitting review");
    }
  }

  const renderStars = (rating: number) => {
    const validRating = typeof rating === 'number' && !isNaN(rating) ? rating : 0;
    const fullStars = Math.floor(validRating);
    const hasHalfStar = validRating % 1 >= 0.5;
    const emptyStars = Math.max(0, 5 - fullStars - (hasHalfStar ? 1 : 0));
    
    const stars = [];
    for (let i = 0; i < fullStars; i++) {
      stars.push(<span key={`full-${i}`} className="text-yellow-400">★</span>);
    }
    if (hasHalfStar) {
      stars.push(<span key="half" className="text-yellow-400">½</span>);
    }
    for (let i = 0; i < emptyStars; i++) {
      stars.push(<span key={`empty-${i}`} className="text-white/30">★</span>);
    }
    
    return (
      <div className="flex items-center gap-0.5">
        {stars}
      </div>
    );
  };

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

        {/* Enrolled Courses */}
        {enrolledCourses.length > 0 && (
          <div className="mb-12">
            <h2 className="text-2xl font-bold text-white mb-4">📚 In Progress ({enrolledCourses.length})</h2>
            <div className="grid lg:grid-cols-2 gap-6">
              {enrolledCourses.map((course) => {
                const progress = course.enrollments?.[0]?.progress || 0;
                const hasReviewed = !!course.userReview;
                
                return (
                  <div key={course.id} className="bg-white/5 rounded-2xl border border-white/10 hover:bg-white/10 transition-all overflow-hidden">
                    <div className="p-6">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h3 className="text-xl font-semibold text-white">{course.title}</h3>
                          <p className="text-purple-400 text-sm">{course.code}</p>
                        </div>
                        {course.averageRating > 0 && (
                          <div className="text-right">
                            {renderStars(course.averageRating)}
                            <span className="text-white/40 text-xs ml-1">({course.reviewCount})</span>
                          </div>
                        )}
                      </div>
                      
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
                      
                      {/* Review Section */}
                      <div className="mt-4 pt-4 border-t border-white/10">
                        {hasReviewed ? (
                          <div className="text-center">
                            <div className="text-sm text-white/60">Your Review</div>
                            <div className="flex justify-center gap-0.5 my-1">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <span key={star} className={star <= (course.userReview?.rating || 0) ? "text-yellow-400" : "text-white/30"}>
                                  ★
                                </span>
                              ))}
                            </div>
                            <p className="text-white/40 text-xs italic">"{course.userReview?.comment}"</p>
                          </div>
                        ) : (
                          <button
                            onClick={() => {
                              setSelectedCourseForReview(course);
                              setRating(0);
                              setReviewComment("");
                              setShowReviewModal(true);
                            }}
                            className="w-full text-purple-400 hover:text-purple-300 text-sm font-semibold transition-all"
                          >
                            ⭐ Rate this course
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Available Courses */}
        {availableCourses.length > 0 && (
          <div>
            <h2 className="text-2xl font-bold text-white mb-4">📖 Available Courses ({availableCourses.length})</h2>
            <div className="grid lg:grid-cols-2 gap-6">
              {availableCourses.map((course) => (
                <div key={course.id} className="bg-white/5 rounded-2xl border border-white/10 hover:bg-white/10 transition-all overflow-hidden">
                  <div className="p-6">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="text-xl font-semibold text-white">{course.title}</h3>
                        <p className="text-purple-400 text-sm">{course.code}</p>
                      </div>
                      {course.averageRating > 0 && (
                        <div className="text-right">
                          {renderStars(course.averageRating)}
                          <span className="text-white/40 text-xs ml-1">({course.reviewCount})</span>
                        </div>
                      )}
                    </div>
                    
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

      {/* Review Modal */}
      {showReviewModal && selectedCourseForReview && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-slate-800 rounded-2xl p-6 w-full max-w-md border border-white/20 shadow-2xl">
            <h2 className="text-2xl font-bold text-white mb-2">Rate {selectedCourseForReview.title}</h2>
            <p className="text-white/40 text-sm mb-6">Share your experience with this course</p>
            
            <div className="mb-6">
              <label className="block text-white/60 text-sm mb-3">Your Rating</label>
              <div className="flex gap-3 justify-center">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    className="text-5xl hover:scale-110 transition-transform focus:outline-none"
                  >
                    {star <= (hoverRating || rating) ? "⭐" : "☆"}
                  </button>
                ))}
              </div>
              <p className="text-center text-white/40 text-sm mt-2">
                {rating === 1 && "Poor"}
                {rating === 2 && "Fair"}
                {rating === 3 && "Good"}
                {rating === 4 && "Very Good"}
                {rating === 5 && "Excellent!"}
              </p>
            </div>
            
            <div className="mb-6">
              <label className="block text-white/60 text-sm mb-2">Your Review (optional)</label>
              <textarea
                rows={4}
                value={reviewComment}
                onChange={(e) => setReviewComment(e.target.value)}
                placeholder="What did you like about this course? What could be improved?"
                className="w-full bg-white/10 border border-white/20 rounded-xl p-3 text-white placeholder:text-white/40 focus:outline-none focus:border-purple-500 resize-none"
              />
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={() => submitReview(selectedCourseForReview.id)}
                disabled={rating === 0}
                className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white py-2.5 rounded-xl font-semibold disabled:opacity-50 transition-all"
              >
                Submit Review
              </button>
              <button
                onClick={() => {
                  setShowReviewModal(false);
                  setRating(0);
                  setReviewComment("");
                }}
                className="flex-1 bg-white/10 hover:bg-white/20 text-white py-2.5 rounded-xl font-semibold transition-all"
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