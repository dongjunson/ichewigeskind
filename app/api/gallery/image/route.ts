import { google } from "googleapis";
import { type NextRequest, NextResponse } from "next/server";
import { recordDriveUsage } from "@/lib/drive-monitor";

async function fetchDriveImageWithServiceAccount(id: string) {
  const credentialsJson = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  if (!credentialsJson) return null;

  let credentials: object;
  try {
    credentials = JSON.parse(credentialsJson) as object;
  } catch {
    throw new Error("Invalid GOOGLE_SERVICE_ACCOUNT_JSON");
  }

  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ["https://www.googleapis.com/auth/drive.readonly"],
  });
  const client = await auth.getClient();
  const token = await client.getAccessToken();
  if (!token.token) throw new Error("No access token");

  return fetch(`https://www.googleapis.com/drive/v3/files/${id}?alt=media`, {
    headers: {
      Authorization: `Bearer ${token.token}`,
    },
  });
}

async function fetchDriveImageWithApiKey(id: string) {
  const apiKey = process.env.GOOGLE_DRIVE_API_KEY;
  if (!apiKey) return null;

  const params = new URLSearchParams({
    alt: "media",
    key: apiKey,
    supportsAllDrives: "true",
  });
  return fetch(`https://www.googleapis.com/drive/v3/files/${id}?${params}`);
}

export async function GET(request: NextRequest) {
  const id = request.nextUrl.searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }

  try {
    const driveRes =
      (await fetchDriveImageWithServiceAccount(id)) ?? (await fetchDriveImageWithApiKey(id));

    if (!driveRes) {
      return NextResponse.json({ error: "Not configured" }, { status: 500 });
    }

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
        "Cache-Control": "public, max-age=86400, s-maxage=604800, stale-while-revalidate=86400",
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
