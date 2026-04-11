import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Send a message (regular or broadcast)
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { receiverId, content, broadcast } = await request.json();

    // If broadcast is true and user is admin, send to ALL users
    if (broadcast && session.user?.role === "ADMIN") {
      // Get all users except the admin
      const allUsers = await prisma.user.findMany({
        where: { id: { not: session.user.id } },
        select: { id: true }
      });

      // Create messages for all users
      const messages = await Promise.all(
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
    console.error("Failed to send message:", error);
    return NextResponse.json({ error: "Failed to send message" }, { status: 500 });
  }
}

// Get messages between two users
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