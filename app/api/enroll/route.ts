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

    const { courseId } = await request.json();
    console.log("📚 Enrolling in course:", courseId);

    // Get course info
    const course = await prisma.course.findUnique({
      where: { id: courseId }
    });

    if (!course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }
    console.log("✅ Course found:", course.title);

    // Check if already enrolled
    const existing = await prisma.enrollment.findFirst({
      where: {
        userId: session.user.id,
        courseId: courseId
      }
    });

    if (existing) {
      return NextResponse.json({ error: "Already enrolled" }, { status: 400 });
    }

    // Create enrollment
    const enrollment = await prisma.enrollment.create({
      data: {
        userId: session.user.id,
        courseId: courseId,
        status: "ACTIVE",
        progress: 0,
      }
    });
    console.log("✅ Enrollment created:", enrollment.id);

    // Update course count
    await prisma.course.update({
      where: { id: courseId },
      data: { enrolled: { increment: 1 } }
    });
    console.log("✅ Course count updated");

    // Create in-app notification
    try {
      const notification = await prisma.notification.create({
        data: {
          userId: session.user.id,
          title: "✅ Enrollment Confirmed",
          message: `You have successfully enrolled in "${course.title}"`,
          type: "enrollment",
          link: "/dashboard/courses",
          read: false,
        }
      });
      console.log("✅ In-app notification created:", notification.id);
    } catch (notifError) {
      console.error("❌ Failed to create notification:", notifError);
    }

    return NextResponse.json({ success: true, enrollment });
    
  } catch (error: any) {
    console.error("Enrollment error:", error);
    return NextResponse.json({ error: error?.message || "Failed to enroll" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { courseId } = await request.json();
    console.log("📚 Dropping course:", courseId);

    // Get course info
    const course = await prisma.course.findUnique({
      where: { id: courseId }
    });

    if (!course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }
    console.log("✅ Course found:", course.title);

    // Delete enrollment
    await prisma.enrollment.deleteMany({
      where: {
        userId: session.user.id,
        courseId: courseId
      }
    });
    console.log("✅ Enrollment deleted");

    // Update course count
    await prisma.course.update({
      where: { id: courseId },
      data: { enrolled: { decrement: 1 } }
    });
    console.log("✅ Course count updated");

    // Create drop notification
    try {
      const notification = await prisma.notification.create({
        data: {
          userId: session.user.id,
          title: "❌ Course Dropped",
          message: `You have dropped "${course.title}"`,
          type: "enrollment",
          link: "/dashboard/courses",
          read: false,
        }
      });
      console.log("✅ Drop notification created:", notification.id);
    } catch (notifError) {
      console.error("❌ Failed to create drop notification:", notifError);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Unenrollment error:", error);
    return NextResponse.json({ error: "Failed to unenroll" }, { status: 500 });
  }
}