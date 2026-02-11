import { unstable_cache } from "next/cache";
import { google } from "googleapis";

const SUPPORTED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
];

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

  const res = await drive.files.list({
    q,
    fields: "files(id,name,mimeType)",
    orderBy: "createdTime asc",
    pageSize: 100,
    supportsAllDrives: true,
    includeItemsFromAllDrives: true,
  });
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
    fields: "files(id,name,mimeType)",
    orderBy: "createdTime asc",
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

  const data = (await res.json()) as { files?: DriveFile[] };
  return data.files ?? [];
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
