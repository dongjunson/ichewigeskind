import { NextRequest, NextResponse } from "next/server";
import { getDriveUsage } from "@/lib/drive-monitor";

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const driveUsageKey = process.env.DRIVE_USAGE_ACCESS_KEY;

  if (driveUsageKey && process.env.NODE_ENV === "production") {
    const token = authHeader?.replace("Bearer ", "");
    if (token !== driveUsageKey) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const usage = getDriveUsage();
  return NextResponse.json(usage, {
    headers: {
      "Cache-Control": "no-store, max-age=0",
    },
  });
}
