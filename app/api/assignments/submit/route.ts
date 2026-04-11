import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const assignmentId = formData.get("assignmentId") as string;
    const content = formData.get("content") as string;
    const file = formData.get("file") as File | null;

    let fileUrl = null;

    // Handle file upload
    if (file && file.size > 0) {
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      
      // Create unique filename
      const timestamp = Date.now();
      const safeFileName = `${timestamp}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
      const uploadDir = path.join(process.cwd(), "public", "uploads");
      
      // Ensure upload directory exists
      await mkdir(uploadDir, { recursive: true });
      
      const filePath = path.join(uploadDir, safeFileName);
      await writeFile(filePath, buffer);
      
      fileUrl = `/uploads/${safeFileName}`;
    }

    // Check if already submitted
    const existingSubmission = await prisma.submission.findFirst({
      where: {
        assignmentId: assignmentId,
        userId: session.user.id
      }
    });

    if (existingSubmission) {
      return NextResponse.json({ error: "Already submitted" }, { status: 400 });
    }

    // Create submission
    const submission = await prisma.submission.create({
      data: {
        assignmentId: assignmentId,
        userId: session.user.id,
        content: content || null,
        fileUrl: fileUrl,
        submittedAt: new Date()
      }
    });

    return NextResponse.json({ success: true, submission });
  } catch (error) {
    console.error("Submission error:", error);
    return NextResponse.json({ error: "Failed to submit" }, { status: 500 });
  }
}