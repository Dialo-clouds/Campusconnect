import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const minCredits = searchParams.get("minCredits");
    const maxCredits = searchParams.get("maxCredits");
    const sortBy = searchParams.get("sortBy") || "title";

    // Build filter conditions
    const where: any = {};
    
    if (search) {
      where.OR = [
        { title: { contains: search } },
        { description: { contains: search } },
        { instructor: { contains: search } },
        { code: { contains: search } }
      ];
    }
    
    if (minCredits) {
      where.credits = { gte: parseInt(minCredits) };
    }
    
    if (maxCredits) {
      where.credits = { ...where.credits, lte: parseInt(maxCredits) };
    }

    // Get sort order
    let orderBy: any = {};
    if (sortBy === "title") orderBy = { title: 'asc' };
    if (sortBy === "credits") orderBy = { credits: 'desc' };
    if (sortBy === "enrolled") orderBy = { enrolled: 'desc' };

    const courses = await prisma.course.findMany({
      where,
      include: {
        enrollments: {
          where: { userId: session.user.id },
          select: { progress: true, status: true }
        },
        reviews: {
          select: { rating: true }
        }
      },
      orderBy
    });

    // Calculate average rating for each course
    const coursesWithRating = courses.map(course => ({
      ...course,
      averageRating: course.reviews.length > 0 
        ? course.reviews.reduce((acc, r) => acc + r.rating, 0) / course.reviews.length
        : 0,
      reviewCount: course.reviews.length
    }));

    return NextResponse.json(coursesWithRating);
  } catch (error) {
    console.error("Failed to fetch courses:", error);
    return NextResponse.json({ error: "Failed to fetch courses" }, { status: 500 });
  }
}