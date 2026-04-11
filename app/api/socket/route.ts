import { NextResponse } from "next/server";
import { Server } from "socket.io";
import { createServer } from "http";



export async function GET() {
  return NextResponse.json({ message: "Socket server ready" });
}