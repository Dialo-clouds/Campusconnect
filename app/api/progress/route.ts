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

    const { courseId, progress } = await request.json();

    const enrollment = await prisma.enrollment.update({
      where: {
        userId_courseId: {
          userId: session.user.id,
          courseId: courseId
        }
      },
      data: { 
        progress: progress,
        ...(progress === 100 && { status: "COMPLETED", completedAt: new Date() })
      }
    });

    return NextResponse.json({ success: true, progress: enrollment.progress });
  } catch (error) {
    return NextResponse.json({ error: "Failed to update progress" }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const courseId = searchParams.get("courseId");

    const enrollment = await prisma.enrollment.findFirst({
      where: {
        userId: session.user.id,
        courseId: courseId
      }
    });

    return NextResponse.json({ progress: enrollment?.progress || 0 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to get progress" }, { status: 500 });
  }
}