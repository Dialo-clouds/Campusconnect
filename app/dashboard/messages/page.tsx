"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ChatProvider, useChat } from "@/context/SocketContext";
import { Send, Users, MessageCircle, User, Megaphone } from "lucide-react";

function ChatContent() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { 
    messages, 
    onlineUsers, 
    sendMessage, 
    sendBroadcast, 
    conversations, 
    selectedUser, 
    setSelectedUser, 
    loading,
    isAdmin 
  } = useChat();
  const [newMessage, setNewMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedUser) return;
    
    await sendMessage(selectedUser.id, newMessage);
    setNewMessage("");
  };

  const handleBroadcast = async () => {
    const message = prompt("Enter announcement message to send to ALL students:");
    if (message && message.trim()) {
      await sendBroadcast(message);
      alert("✅ Announcement sent to all students!");
    }
  };

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-blue-950 to-purple-950">
        <div className="w-16 h-16 border-4 border-white/20 border-t-purple-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-purple-950">
      <div className="container mx-auto px-4 py-8">
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl border border-white/10 overflow-hidden h-[80vh]">
          <div className="flex h-full">
            {/* Conversations Sidebar */}
            <div className="w-80 border-r border-white/10 bg-white/5">
              <div className="p-4 border-b border-white/10">
                <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                  <MessageCircle className="w-5 h-5" />
                  Messages
                </h2>
                <p className="text-white/40 text-xs mt-1">
                  {conversations.length} contact{conversations.length !== 1 ? 's' : ''}
                </p>
              </div>
              <div className="overflow-y-auto h-[calc(100%-80px)]">
                {conversations.length === 0 ? (
                  <div className="p-8 text-center">
                    <Users className="w-12 h-12 text-white/20 mx-auto mb-3" />
                    <p className="text-white/40">No users available</p>
                    <p className="text-white/30 text-sm mt-1">Other users will appear here</p>
                  </div>
                ) : (
                  conversations.map((user) => (
                    <button
                      key={user.id}
                      onClick={() => setSelectedUser(user)}
                      className={`w-full p-4 text-left hover:bg-white/10 transition-all flex items-center gap-3 ${
                        selectedUser?.id === user.id ? "bg-purple-600/20" : ""
                      }`}
                    >
                      <div className="relative">
                        <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                          <User className="w-5 h-5 text-white" />
                        </div>
                        {onlineUsers.includes(user.id) && (
                          <div className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 rounded-full border-2 border-slate-900" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-white font-medium truncate">{user.name || user.email}</p>
                        <p className="text-white/40 text-xs">
                          {onlineUsers.includes(user.id) ? "Online" : "Offline"}
                        </p>
                        {user.role === "ADMIN" && (
                          <span className="text-xs text-purple-400">Admin</span>
                        )}
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>

            {/* Chat Area */}
            <div className="flex-1 flex flex-col">
              {selectedUser ? (
                <>
                  {/* Chat Header */}
                  <div className="p-4 border-b border-white/10 bg-white/5 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                          <User className="w-5 h-5 text-white" />
                        </div>
                        {onlineUsers.includes(selectedUser.id) && (
                          <div className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 rounded-full border-2 border-slate-900" />
                        )}
                      </div>
                      <div>
                        <h3 className="text-white font-semibold">{selectedUser.name || selectedUser.email}</h3>
                        <p className="text-white/40 text-xs">
                          {onlineUsers.includes(selectedUser.id) ? "Online" : "Offline"}
                        </p>
                      </div>
                    </div>
                    
                    {/* Broadcast Button - Only visible to Admins */}
                    {isAdmin && (
                      <button
                        onClick={handleBroadcast}
                        className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-all"
                      >
                        <Megaphone className="w-4 h-4" />
                        Announce to All
                      </button>
                    )}
                  </div>

                  {/* Messages */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {messages.length === 0 ? (
                      <div className="flex items-center justify-center h-full">
                        <div className="text-center">
                          <MessageCircle className="w-12 h-12 text-white/20 mx-auto mb-3" />
                          <p className="text-white/40">No messages yet</p>
                          <p className="text-white/30 text-sm mt-1">Send a message to start the conversation</p>
                        </div>
                      </div>
                    ) : (
                      messages.map((msg) => {
                        const isOwn = msg.senderId === session?.user?.id;
                        const isBroadcast = msg.isBroadcast || msg.content?.startsWith("📢");
                        
                        return (
                          <div
                            key={msg.id}
                            className={`flex ${isOwn ? "justify-end" : "justify-start"}`}
                          >
                            <div
                              className={`max-w-[70%] rounded-2xl px-4 py-2 ${
                                isBroadcast
                                  ? "bg-orange-600/20 border border-orange-500/30 text-orange-200"
                                  : isOwn
                                    ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white"
                                    : "bg-white/10 text-white"
                              }`}
                            >
                              {!isOwn && !isBroadcast && (
                                <p className="text-xs text-purple-400 mb-1">{msg.senderName}</p>
                              )}
                              {isBroadcast && (
                                <p className="text-xs text-orange-400 mb-1 flex items-center gap-1">
                                  <Megaphone className="w-3 h-3" /> Announcement
                                </p>
                              )}
                              <p className="text-sm">{msg.content}</p>
                              <p className="text-xs opacity-70 mt-1">
                                {new Date(msg.createdAt).toLocaleTimeString()}
                              </p>
                            </div>
                          </div>
                        );
                      })
                    )}
                    <div ref={messagesEndRef} />
                  </div>

                  {/* Message Input */}
                  <div className="p-4 border-t border-white/10 bg-white/5">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                        placeholder="Type a message..."
                        className="flex-1 bg-white/10 border border-white/20 rounded-xl px-4 py-2 text-white placeholder:text-white/40 focus:outline-none focus:border-purple-500"
                      />
                      <button
                        onClick={handleSendMessage}
                        disabled={!newMessage.trim()}
                        className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-4 py-2 rounded-xl disabled:opacity-50 transition-all"
                      >
                        <Send className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-center">
                    <MessageCircle className="w-16 h-16 text-white/20 mx-auto mb-4" />
                    <p className="text-white/40">Select a conversation to start chatting</p>
                    {isAdmin && (
                      <button
                        onClick={handleBroadcast}
                        className="mt-4 bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 mx-auto transition-all"
                      >
                        <Megaphone className="w-4 h-4" />
                        Send Announcement to All
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function MessagesPage() {
  return (
    <ChatProvider>
      <ChatContent />
    </ChatProvider>
  );
}