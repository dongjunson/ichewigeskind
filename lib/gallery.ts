import { unstable_cache } from "next/cache";
import { google } from "googleapis";
import { recordDriveUsage } from "./drive-monitor";

const SUPPORTED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
];
const DRIVE_PAGE_SIZE = 30;

export interface GalleryImage {
  id: string;
  src: string;
  alt: string;
  title: string;
}

interface DriveFile {
  id: string;
  name: string;
  mimeType?: string;
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
  const files: DriveFile[] = [];
  let pageToken: string | undefined;

  do {
    const res = await drive.files.list({
      q,
      fields: "nextPageToken,files(id,name,mimeType)",
      orderBy: "createdTime desc",
      pageSize: DRIVE_PAGE_SIZE,
      pageToken,
      supportsAllDrives: true,
      includeItemsFromAllDrives: true,
    });
    const pageFiles = (res.data.files ?? []) as DriveFile[];
    files.push(...pageFiles);
    pageToken = res.data.nextPageToken ?? undefined;
    recordDriveUsage("files.list", {
      source: "lib/gallery",
      count: pageFiles.length,
      hasNextPage: !!pageToken,
    });
  } while (pageToken);

  return files;
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

  const headers: HeadersInit = {};
  if (resourceKey) {
    headers["X-Goog-Drive-Resource-Keys"] = `${folderId}/${resourceKey}`;
  }
  const files: DriveFile[] = [];
  let pageToken: string | undefined;

  do {
    const params = new URLSearchParams({
      q,
      key: apiKey,
      fields: "nextPageToken,files(id,name,mimeType)",
      orderBy: "createdTime desc",
      pageSize: String(DRIVE_PAGE_SIZE),
      supportsAllDrives: "true",
      includeItemsFromAllDrives: "true",
    });
    if (pageToken) params.set("pageToken", pageToken);

    const res = await fetch(
      `https://www.googleapis.com/drive/v3/files?${params}`,
      { headers }
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

    const data = (await res.json()) as { files?: DriveFile[]; nextPageToken?: string };
    const pageFiles = data.files ?? [];
    files.push(...pageFiles);
    pageToken = data.nextPageToken ?? undefined;
    recordDriveUsage("files.list", {
      source: "lib/gallery-apiKey",
      count: pageFiles.length,
      hasNextPage: !!pageToken,
    });
  } while (pageToken);

  return files;
}

async function fetchGalleryImages(): Promise<GalleryImage[]> {
  const apiKey = process.env.GOOGLE_DRIVE_API_KEY;
  const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID;
  const resourceKey = process.env.GOOGLE_DRIVE_RESOURCE_KEY;
  const useServiceAccount = !!process.env.GOOGLE_SERVICE_ACCOUNT_JSON;

  if (!folderId) return [];
  if (!useServiceAccount && !apiKey) return [];

  const files = useServiceAccount
    ? await fetchWithServiceAccount(folderId)
    : await fetchWithApiKey(folderId, apiKey!, resourceKey);

  return files.map((file) => ({
    id: file.id,
    src: `/api/gallery/image?id=${encodeURIComponent(file.id)}`,
    alt: file.name.replace(/\.[^/.]+$/, ""),
    title: file.name.replace(/\.[^/.]+$/, ""),
  }));
}

export const getGalleryImages = unstable_cache(
  fetchGalleryImages,
  ["gallery-images"],
  { revalidate: 300 }
);
