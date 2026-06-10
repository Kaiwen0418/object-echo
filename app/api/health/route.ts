import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { recordHeartbeat } from "@/lib/health/heartbeat";

export const dynamic = "force-dynamic";

function isAuthorized(request: Request) {
  const secret = process.env.CRON_SECRET;
  const authorization = request.headers.get("authorization");

  if (!secret || !authorization?.startsWith("Bearer ")) {
    return false;
  }

  const provided = Buffer.from(authorization.slice("Bearer ".length));
  const expected = Buffer.from(secret);

  return provided.length === expected.length && timingSafeEqual(provided, expected);
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ status: "unauthorized" }, { status: 401 });
  }

  try {
    const heartbeat = await recordHeartbeat();
    return NextResponse.json(heartbeat, {
      headers: { "Cache-Control": "no-store" }
    });
  } catch (error) {
    console.error("Heartbeat failed", error);
    return NextResponse.json(
      {
        status: "unhealthy",
        checkedAt: new Date().toISOString()
      },
      {
        status: 503,
        headers: { "Cache-Control": "no-store" }
      }
    );
  }
}
