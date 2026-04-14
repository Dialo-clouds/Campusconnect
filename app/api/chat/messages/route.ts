import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { checkRateLimit } from "@/lib/rate-limit";

const messageSchema = z.object({
  receiverId: z.string().optional(),
  content: z.string().min(1, "Message cannot be empty"),
  broadcast: z.boolean().optional(),
});

export async function POST(request: Request) {
  try {
    // Rate limiting - prevent spam
    const ip = request.headers.get('x-forwarded-for') || 'unknown';
    const rateLimit = await checkRateLimit(ip);
    if (!rateLimit.success) {
      return NextResponse.json({ error: rateLimit.message }, { status: 429 });
    }

    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { receiverId, content, broadcast } = messageSchema.parse(body);

    // If broadcast is true and user is admin, send to ALL users
    if (broadcast && session.user?.role === "ADMIN") {
      // Get all users except the admin
      const allUsers = await prisma.user.findMany({
        where: { id: { not: session.user.id } },
        select: { id: true }
      });

      if (allUsers.length === 0) {
        return NextResponse.json({ success: true, count: 0, broadcast: true });
      }

      // Use transaction to ensure all messages are created or none
      const messages = await prisma.$transaction(
        allUsers.map(user => 
          prisma.message.create({
            data: {
              senderId: session.user.id,
              receiverId: user.id,
              content: `📢 ANNOUNCEMENT: ${content}`,
            }
          })
        )
      );

      return NextResponse.json({ success: true, count: messages.length, broadcast: true });
    }

    // Regular message to single user
    if (!receiverId) {
      return NextResponse.json({ error: "Receiver ID required" }, { status: 400 });
    }

    const message = await prisma.message.create({
      data: {
        senderId: session.user.id,
        receiverId,
        content,
      },
      include: {
        sender: { select: { name: true } },
        receiver: { select: { name: true } }
      }
    });

    return NextResponse.json(message);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }
    console.error("Failed to send message:", error);
    return NextResponse.json({ error: "Failed to send message" }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const otherUserId = searchParams.get("userId");

    if (!otherUserId) {
      return NextResponse.json({ error: "User ID required" }, { status: 400 });
    }

    const messages = await prisma.message.findMany({
      where: {
        OR: [
          { senderId: session.user.id, receiverId: otherUserId },
          { senderId: otherUserId, receiverId: session.user.id }
        ]
      },
      orderBy: { createdAt: 'asc' }
    });

    return NextResponse.json(messages);
  } catch (error) {
    console.error("Failed to fetch messages:", error);
    return NextResponse.json({ error: "Failed to fetch messages" }, { status: 500 });
  }
}