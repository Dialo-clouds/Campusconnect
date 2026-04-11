import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { submissionId, grade, feedback } = await request.json();

    // Get submission with assignment and user info
    const submission = await prisma.submission.findUnique({
      where: { id: submissionId },
      include: {
        assignment: true,
        user: true
      }
    });

    if (!submission) {
      return NextResponse.json({ error: "Submission not found" }, { status: 404 });
    }

    // Update the submission with grade and feedback
    const updatedSubmission = await prisma.submission.update({
      where: { id: submissionId },
      data: { 
        grade: Number(grade),
        feedback: feedback || null
      }
    });

    // Create in-app notification for the student
    try {
      await prisma.notification.create({
        data: {
          userId: submission.userId,
          title: "📝 Assignment Graded",
          message: `Your assignment "${submission.assignment.title}" has been graded: ${grade}/${submission.assignment.totalPoints}`,
          type: "grade",
          link: "/dashboard/assignments",
          read: false,
        }
      });
      console.log("✅ Grade notification created for student:", submission.user.email);
    } catch (notifError) {
      console.error("❌ Failed to create grade notification:", notifError);
    }

    return NextResponse.json({ success: true, submission: updatedSubmission });
  } catch (error) {
    console.error("Grade API error:", error);
    return NextResponse.json({ error: "Failed to update grade" }, { status: 500 });
  }
}