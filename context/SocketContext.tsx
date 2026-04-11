"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";
import { useSession } from "next-auth/react";

interface Message {
  id: string;
  content: string;
  senderId: string;
  receiverId: string;
  senderName: string;
  createdAt: string;
  read: boolean;
  isBroadcast?: boolean;
}

interface User {
  id: string;
  name: string;
  email: string;
  role?: string;
}

interface ChatContextType {
  messages: Message[];
  onlineUsers: string[];
  sendMessage: (receiverId: string, content: string) => void;
  sendBroadcast: (content: string) => void;
  conversations: User[];
  selectedUser: User | null;
  setSelectedUser: (user: User | null) => void;
  loading: boolean;
  isAdmin: boolean;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export function ChatProvider({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);
  const [conversations, setConversations] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const isAdmin = session?.user?.role === "ADMIN";

  useEffect(() => {
    if (!session?.user?.id) return;

    const socketIo = io("http://localhost:3001");
    setSocket(socketIo);

    socketIo.emit("user-connected", session.user.id);

    socketIo.on("users-online", (users) => {
      setOnlineUsers(users);
    });

    socketIo.on("receive-message", (data) => {
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        content: data.message,
        senderId: data.senderId,
        receiverId: session.user.id,
        senderName: data.senderName,
        createdAt: data.timestamp,
        read: false,
        isBroadcast: data.isBroadcast || false
      }]);
    });

    fetchConversations();

    return () => {
      socketIo.disconnect();
    };
  }, [session]);

  useEffect(() => {
    if (selectedUser) {
      fetchMessages(selectedUser.id);
    }
  }, [selectedUser]);

  async function fetchConversations() {
    try {
      const response = await fetch("/api/chat/conversations");
      const data = await response.json();
      setConversations(data);
    } catch (error) {
      console.error("Failed to fetch conversations:", error);
    } finally {
      setLoading(false);
    }
  }

  async function fetchMessages(userId: string) {
    try {
      const response = await fetch(`/api/chat/messages?userId=${userId}`);
      const data = await response.json();
      setMessages(data);
    } catch (error) {
      console.error("Failed to fetch messages:", error);
    }
  }

  async function sendMessage(receiverId: string, content: string) {
    if (!socket || !session?.user) return;

    const response = await fetch("/api/chat/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ receiverId, content }),
    });
    const newMessage = await response.json();

    socket.emit("send-message", {
      receiverId,
      message: content,
      senderName: session.user.name || "User",
      senderId: session.user.id,
      broadcast: false
    });

    setMessages(prev => [...prev, newMessage]);
  }

  async function sendBroadcast(content: string) {
    if (!socket || !session?.user || !isAdmin) return;

    // Save broadcast messages to database for all users
    const response = await fetch("/api/chat/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ broadcast: true, content }),
    });

    // Send via socket to all connected users
    socket.emit("send-message", {
      message: content,
      senderName: session.user.name || "Admin",
      senderId: session.user.id,
      broadcast: true
    });

    // Add to local messages
    setMessages(prev => [...prev, {
      id: Date.now().toString(),
      content: `📢 BROADCAST: ${content}`,
      senderId: session.user.id,
      receiverId: "all",
      senderName: `📢 ADMIN (${session.user.name})`,
      createdAt: new Date().toISOString(),
      read: false,
      isBroadcast: true
    }]);
  }

  return (
    <ChatContext.Provider value={{
      messages,
      onlineUsers,
      sendMessage,
      sendBroadcast,
      conversations,
      selectedUser,
      setSelectedUser,
      loading,
      isAdmin
    }}>
      {children}
    </ChatContext.Provider>
  );
}

export function useChat() {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error("useChat must be used within ChatProvider");
  }
  return context;
}