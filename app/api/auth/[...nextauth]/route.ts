import { authOptions } from "@/lib/auth";
import NextAuth from "next-auth";
import { checkRateLimit } from "@/lib/rate-limit";

// Wrap the authOptions to add rate limiting
const rateLimitedAuth = async (req: any, res: any) => {
  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
  const rateLimit = await checkRateLimit(ip);
  
  if (!rateLimit.success) {
    return new Response(JSON.stringify({ error: rateLimit.message }), { status: 429 });
  }
  
  return NextAuth(authOptions)(req, res);
};

const handler = rateLimitedAuth;

export { handler as GET, handler as POST };