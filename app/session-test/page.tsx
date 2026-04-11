"use client";

import { useSession } from "next-auth/react";

export default function SessionTest() {
  const { data: session, status } = useSession();
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-black text-white p-8">
      <div className="bg-gray-900 p-8 rounded-xl">
        <h1 className="text-2xl font-bold mb-4">Session Status: {status}</h1>
        <pre className="text-sm">{JSON.stringify(session, null, 2)}</pre>
      </div>
    </div>
  );
}