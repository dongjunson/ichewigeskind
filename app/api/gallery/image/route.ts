import { NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";
import { recordDriveUsage } from "@/lib/drive-monitor";

export async function GET(request: NextRequest) {
  const id = request.nextUrl.searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }

  const credentialsJson = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  if (!credentialsJson) {
    return NextResponse.json({ error: "Not configured" }, { status: 500 });
  }

  let credentials: object;
  try {
    credentials = JSON.parse(credentialsJson) as object;
  } catch {
    return NextResponse.json({ error: "Invalid config" }, { status: 500 });
  }

  try {
    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ["https://www.googleapis.com/auth/drive.readonly"],
    });
    const client = await auth.getClient();
    const token = await client.getAccessToken();
    if (!token.token) throw new Error("No access token");

    const driveRes = await fetch(
      `https://www.googleapis.com/drive/v3/files/${id}?alt=media`,
      {
        headers: {
          Authorization: `Bearer ${token.token}`,
        },
      }
    );

    if (!driveRes.ok) {
      const text = await driveRes.text();
      console.error("Drive API image fetch failed:", driveRes.status, text);
      return NextResponse.json({ error: "Failed to fetch image" }, { status: 502 });
    }

    recordDriveUsage("files.get", { fileId: id });

    const contentType = driveRes.headers.get("content-type") ?? "image/jpeg";
    const body = driveRes.body;
    if (!body) {
      return NextResponse.json({ error: "No image data" }, { status: 502 });
    }

    return new NextResponse(body, {
      headers: {
        "Cache-Control":
          "public, max-age=86400, s-maxage=604800, stale-while-revalidate=86400",
        "Content-Type": contentType,
      },
    });
  } catch (err) {
    console.error("Image proxy error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to fetch image" },
      { status: 500 }
    );
  }
}
