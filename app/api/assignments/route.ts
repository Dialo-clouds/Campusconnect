import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user's enrolled courses
    const enrollments = await prisma.enrollment.findMany({
      where: { userId: session.user.id },
      select: { courseId: true }
    });

    const courseIds = enrollments.map(e => e.courseId);

    if (courseIds.length === 0) {
      return NextResponse.json([]);
    }

    const assignments = await prisma.assignment.findMany({
      where: { 
        courseId: { in: courseIds }
      },
      include: {
        course: {
          select: {
            title: true,
            code: true
          }
        },
        submissions: {
          where: { userId: session.user.id },
          select: {
            id: true,
            content: true,
            grade: true,
            feedback: true,
            submittedAt: true
          }
        }
      },
      orderBy: { dueDate: 'asc' }
    });

    return NextResponse.json(assignments);
  } catch (error) {
    console.error("Failed to fetch assignments:", error);
    return NextResponse.json({ error: "Failed to fetch assignments" }, { status: 500 });
  }
}