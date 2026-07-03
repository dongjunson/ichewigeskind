import { google } from "googleapis";
import { type NextRequest, NextResponse } from "next/server";
import { recordDriveUsage } from "@/lib/drive-monitor";

const SUPPORTED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/heic",
  "image/heif",
];
const DRIVE_PAGE_SIZE = 30;
const GALLERY_REVALIDATE_SECONDS = 60;

interface DriveFile {
  id: string;
  name: string;
  mimeType?: string;
  createdTime?: string;
  thumbnailLink?: string;
  webContentLink?: string;
}

interface DriveListPage {
  files: DriveFile[];
  nextPageToken: string | null;
}

async function fetchWithServiceAccount(
  folderId: string,
  pageToken?: string
): Promise<DriveListPage> {
  const credentialsJson = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  if (!credentialsJson) throw new Error("GOOGLE_SERVICE_ACCOUNT_JSON not set");

  let credentials: object;
  try {
    credentials = JSON.parse(credentialsJson) as object;
  } catch {
    throw new Error("GOOGLE_SERVICE_ACCOUNT_JSON is invalid JSON");
  }

  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ["https://www.googleapis.com/auth/drive.readonly"],
  });
  const drive = google.drive({ version: "v3", auth });
  const mimeQuery = SUPPORTED_IMAGE_TYPES.map((t) => `mimeType='${t}'`).join(" or ");
  const q = `'${folderId}' in parents and (${mimeQuery}) and trashed=false`;
  const res = await drive.files.list({
    q,
    fields: "nextPageToken,files(id,name,mimeType,createdTime,thumbnailLink,webContentLink)",
    orderBy: "createdTime desc",
    pageSize: DRIVE_PAGE_SIZE,
    pageToken,
    supportsAllDrives: true,
    includeItemsFromAllDrives: true,
  });
  const files = (res.data.files ?? []) as DriveFile[];
  const nextPageToken = res.data.nextPageToken ?? null;
  recordDriveUsage("files.list", {
    source: "api/gallery",
    count: files.length,
    hasNextPage: !!nextPageToken,
  });

  return { files, nextPageToken };
}

async function fetchWithApiKey(
  folderId: string,
  apiKey: string,
  resourceKey?: string,
  pageToken?: string
): Promise<DriveListPage> {
  const mimeQuery = SUPPORTED_IMAGE_TYPES.map((t) => `mimeType='${t}'`).join(" or ");
  const q = `'${folderId}' in parents and (${mimeQuery}) and trashed=false`;

  const headers: HeadersInit = {};
  if (resourceKey) {
    headers["X-Goog-Drive-Resource-Keys"] = `${folderId}/${resourceKey}`;
  }
  const params = new URLSearchParams({
    q,
    key: apiKey,
    fields: "nextPageToken,files(id,name,mimeType,createdTime,thumbnailLink,webContentLink)",
    orderBy: "createdTime desc",
    pageSize: String(DRIVE_PAGE_SIZE),
    supportsAllDrives: "true",
    includeItemsFromAllDrives: "true",
  });
  if (pageToken) params.set("pageToken", pageToken);

  const res = await fetch(`https://www.googleapis.com/drive/v3/files?${params}`, {
    headers,
    next: { revalidate: GALLERY_REVALIDATE_SECONDS },
  });

  if (!res.ok) {
    const text = await res.text();
    let parsed: { error?: { message?: string } } = {};
    try {
      parsed = JSON.parse(text) as { error?: { message?: string } };
    } catch {
      /* ignore */
    }
    const msg = parsed.error?.message ?? text;
    throw new Error(`Drive API ${res.status}: ${msg}`);
  }

  const data = (await res.json()) as { files?: DriveFile[]; nextPageToken?: string };
  const files = data.files ?? [];
  const nextPageToken = data.nextPageToken ?? null;
  recordDriveUsage("files.list", {
    source: "api/gallery-apiKey",
    count: files.length,
    hasNextPage: !!nextPageToken,
  });

  return { files, nextPageToken };
}

export async function GET(request: NextRequest) {
  const apiKey = process.env.GOOGLE_DRIVE_API_KEY;
  const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID;
  const resourceKey = process.env.GOOGLE_DRIVE_RESOURCE_KEY;
  const useServiceAccount = !!process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  const pageToken = request.nextUrl.searchParams.get("pageToken") ?? undefined;

  if (!folderId) {
    return NextResponse.json(
      {
        error:
          "GOOGLE_DRIVE_FOLDER_ID is required. Add it in Vercel: Project Settings → Environment Variables.",
      },
      { status: 500 }
    );
  }

  if (!useServiceAccount && !apiKey) {
    return NextResponse.json(
      {
        error:
          "Set either GOOGLE_DRIVE_API_KEY (for public folder) or GOOGLE_SERVICE_ACCOUNT_JSON (recommended).",
      },
      { status: 500 }
    );
  }

  try {
    let page: DriveListPage;
    if (useServiceAccount) {
      page = await fetchWithServiceAccount(folderId, pageToken);
    } else {
      if (!apiKey) {
        return NextResponse.json(
          {
            error:
              "Set either GOOGLE_DRIVE_API_KEY (for public folder) or GOOGLE_SERVICE_ACCOUNT_JSON (recommended).",
          },
          { status: 500 }
        );
      }
      page = await fetchWithApiKey(folderId, apiKey, resourceKey, pageToken);
    }

    const images = page.files.map((file) => ({
      id: file.id,
      src: `/api/gallery/image?id=${encodeURIComponent(file.id)}`,
      thumbnailSrc: file.thumbnailLink?.replace(/=s\d+$/, "=s640"),
      alt: file.name.replace(/\.[^/.]+$/, ""),
      title: file.name.replace(/\.[^/.]+$/, ""),
      createdTime: file.createdTime,
    }));

    return NextResponse.json({
      images,
      nextPageToken: page.nextPageToken,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to load gallery";
    console.error("Gallery API error:", err);
    return NextResponse.json(
      {
        error: "Unable to fetch gallery.",
        details: message,
      },
      { status: 500 }
    );
  }
}
