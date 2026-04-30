import { type NextRequest, NextResponse } from "next/server";
import { fetchDriveImage } from "@/lib/drive-image";
import { recordDriveUsage } from "@/lib/drive-monitor";

export async function GET(request: NextRequest) {
  const id = request.nextUrl.searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }

  try {
    const driveRes = await fetchDriveImage(id);

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
