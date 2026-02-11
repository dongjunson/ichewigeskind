import { NextResponse } from "next/server";
import { google } from "googleapis";
import { recordDriveUsage } from "@/lib/drive-monitor";

const SUPPORTED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
];

interface DriveFile {
  id: string;
  name: string;
  mimeType?: string;
  thumbnailLink?: string;
  webContentLink?: string;
}

async function fetchWithServiceAccount(folderId: string): Promise<DriveFile[]> {
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
    fields: "files(id,name,mimeType,thumbnailLink,webContentLink)",
    orderBy: "createdTime desc",
    pageSize: 100,
    supportsAllDrives: true,
    includeItemsFromAllDrives: true,
  });
  recordDriveUsage("files.list", { source: "api/gallery", count: res.data.files?.length ?? 0 });
  return (res.data.files ?? []) as DriveFile[];
}

async function fetchWithApiKey(
  folderId: string,
  apiKey: string,
  resourceKey?: string
): Promise<DriveFile[]> {
  const mimeQuery = SUPPORTED_IMAGE_TYPES
    .map((t) => `mimeType='${t}'`)
    .join(" or ");
  const q = `'${folderId}' in parents and (${mimeQuery}) and trashed=false`;
  const params = new URLSearchParams({
    q,
    key: apiKey,
    fields: "files(id,name,mimeType,thumbnailLink,webContentLink)",
    orderBy: "createdTime desc",
    pageSize: "100",
    supportsAllDrives: "true",
    includeItemsFromAllDrives: "true",
  });

  const headers: HeadersInit = {};
  if (resourceKey) {
    headers["X-Goog-Drive-Resource-Keys"] = `${folderId}/${resourceKey}`;
  }

  const res = await fetch(
    `https://www.googleapis.com/drive/v3/files?${params}`,
    { headers, next: { revalidate: 3600 } }
  );

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

  const data = (await res.json()) as { files?: DriveFile[] };
  recordDriveUsage("files.list", { source: "api/gallery-apiKey", count: data.files?.length ?? 0 });
  return data.files ?? [];
}

export async function GET() {
  const apiKey = process.env.GOOGLE_DRIVE_API_KEY;
  const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID;
  const resourceKey = process.env.GOOGLE_DRIVE_RESOURCE_KEY;
  const useServiceAccount = !!process.env.GOOGLE_SERVICE_ACCOUNT_JSON;

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
    const files = useServiceAccount
      ? await fetchWithServiceAccount(folderId)
      : await fetchWithApiKey(folderId, apiKey!, resourceKey);

    const images = files.map((file) => ({
      id: file.id,
      src: `https://drive.google.com/uc?export=view&id=${file.id}`,
      alt: file.name.replace(/\.[^/.]+$/, ""),
      title: file.name.replace(/\.[^/.]+$/, ""),
    }));

    return NextResponse.json({ images });
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
