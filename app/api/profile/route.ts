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

    const profile = await prisma.profile.findUnique({
      where: { userId: session.user.id }
    });

    return NextResponse.json(profile || {});
  } catch (error) {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { bio, studentId, course, year, phone } = await request.json();

    // Update user name
    await prisma.user.update({
      where: { id: session.user.id },
      data: { name: bio ? bio.split(' ')[0] : session.user.name }
    });

    // Upsert profile
    const profile = await prisma.profile.upsert({
      where: { userId: session.user.id },
      update: { bio, studentId, course, year: year ? parseInt(year) : null, phone },
      create: {
        userId: session.user.id,
        bio,
        studentId,
        course,
        year: year ? parseInt(year) : null,
        phone
      }
    });

    return NextResponse.json({ success: true, profile });
  } catch (error) {
    console.error("Profile error:", error);
    return NextResponse.json({ error: "Failed to update profile" }, { status: 500 });
  }
}