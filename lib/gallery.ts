import { google } from "googleapis";
import { unstable_cache } from "next/cache";
import { recordDriveUsage } from "./drive-monitor";

const SUPPORTED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const DRIVE_PAGE_SIZE = 30;
const GALLERY_REVALIDATE_SECONDS = 60;

export interface GalleryImage {
  id: string;
  src: string;
  alt: string;
  title: string;
  createdTime?: string;
}

interface DriveFile {
  id: string;
  name: string;
  mimeType?: string;
  createdTime?: string;
  parents?: string[];
}

interface DriveListPage {
  files: DriveFile[];
  nextPageToken: string | null;
}

export interface GalleryPage {
  images: GalleryImage[];
  nextPageToken: string | null;
}

function toGalleryImage(file: DriveFile): GalleryImage {
  return {
    id: file.id,
    src: `/api/gallery/image?id=${encodeURIComponent(file.id)}`,
    alt: file.name.replace(/\.[^/.]+$/, ""),
    title: file.name.replace(/\.[^/.]+$/, ""),
    createdTime: file.createdTime,
  };
}

function getErrorStatus(error: unknown) {
  if (typeof error !== "object" || error === null) return null;
  if ("code" in error && typeof error.code === "number") return error.code;
  if ("status" in error && typeof error.status === "number") return error.status;
  return null;
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
    fields: "nextPageToken,files(id,name,mimeType,createdTime)",
    orderBy: "createdTime desc",
    pageSize: DRIVE_PAGE_SIZE,
    pageToken,
    supportsAllDrives: true,
    includeItemsFromAllDrives: true,
  });
  const files = (res.data.files ?? []) as DriveFile[];
  const nextPageToken = res.data.nextPageToken ?? null;
  recordDriveUsage("files.list", {
    source: "lib/gallery",
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
    fields: "nextPageToken,files(id,name,mimeType,createdTime)",
    orderBy: "createdTime desc",
    pageSize: String(DRIVE_PAGE_SIZE),
    supportsAllDrives: "true",
    includeItemsFromAllDrives: "true",
  });
  if (pageToken) params.set("pageToken", pageToken);

  const res = await fetch(`https://www.googleapis.com/drive/v3/files?${params}`, { headers });

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
    source: "lib/gallery-apiKey",
    count: files.length,
    hasNextPage: !!nextPageToken,
  });

  return { files, nextPageToken };
}

async function fetchGalleryPage(pageToken?: string): Promise<GalleryPage> {
  const apiKey = process.env.GOOGLE_DRIVE_API_KEY;
  const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID;
  const resourceKey = process.env.GOOGLE_DRIVE_RESOURCE_KEY;
  const useServiceAccount = !!process.env.GOOGLE_SERVICE_ACCOUNT_JSON;

  if (!folderId) {
    return { images: [], nextPageToken: null };
  }
  if (!useServiceAccount && !apiKey) {
    return { images: [], nextPageToken: null };
  }

  let page: DriveListPage;
  if (useServiceAccount) {
    page = await fetchWithServiceAccount(folderId, pageToken);
  } else {
    if (!apiKey) {
      return { images: [], nextPageToken: null };
    }
    page = await fetchWithApiKey(folderId, apiKey, resourceKey, pageToken);
  }

  return {
    images: page.files.map(toGalleryImage),
    nextPageToken: page.nextPageToken,
  };
}

async function fetchGalleryImageById(id: string): Promise<GalleryImage | null> {
  const apiKey = process.env.GOOGLE_DRIVE_API_KEY;
  const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID;
  const resourceKey = process.env.GOOGLE_DRIVE_RESOURCE_KEY;
  const useServiceAccount = !!process.env.GOOGLE_SERVICE_ACCOUNT_JSON;

  if (!folderId) return null;
  if (!useServiceAccount && !apiKey) return null;

  let file: DriveFile | null = null;

  if (useServiceAccount) {
    const credentialsJson = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
    if (!credentialsJson) return null;

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
    try {
      const res = await drive.files.get({
        fileId: id,
        fields: "id,name,mimeType,createdTime,parents",
        supportsAllDrives: true,
      });
      file = res.data as DriveFile;
    } catch (error) {
      if (getErrorStatus(error) === 404) {
        console.info("Gallery image lookup not found:", { id });
        return null;
      }
      throw error;
    }
    recordDriveUsage("files.get", { source: "lib/gallery-metadata", fileId: id });
  } else {
    if (!apiKey) return null;

    const headers: HeadersInit = {};
    if (resourceKey) {
      headers["X-Goog-Drive-Resource-Keys"] = `${id}/${resourceKey}`;
    }
    const params = new URLSearchParams({
      key: apiKey,
      fields: "id,name,mimeType,createdTime,parents",
      supportsAllDrives: "true",
    });
    const res = await fetch(`https://www.googleapis.com/drive/v3/files/${id}?${params}`, {
      headers,
      next: { revalidate: GALLERY_REVALIDATE_SECONDS },
    });

    if (res.status === 404) {
      console.info("Gallery image lookup not found:", { id });
      return null;
    }
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Drive API ${res.status}: ${text}`);
    }
    file = (await res.json()) as DriveFile;
    recordDriveUsage("files.get", { source: "lib/gallery-apiKey-metadata", fileId: id });
  }

  if (!file?.id || !file.name) {
    console.info("Gallery image lookup missing metadata:", { id });
    return null;
  }
  if (!file.mimeType || !SUPPORTED_IMAGE_TYPES.includes(file.mimeType)) {
    console.info("Gallery image lookup rejected unsupported type:", {
      id,
      mimeType: file.mimeType,
    });
    return null;
  }
  if (file.parents && !file.parents.includes(folderId)) {
    console.info("Gallery image lookup rejected outside folder:", { id });
    return null;
  }

  return toGalleryImage(file);
}

export const getInitialGalleryPage = unstable_cache(
  () => fetchGalleryPage(),
  ["gallery-images-initial-page-with-created-time-v2"],
  { revalidate: GALLERY_REVALIDATE_SECONDS }
);

export async function getGalleryImages(): Promise<GalleryImage[]> {
  const { images } = await getInitialGalleryPage();
  return images;
}

export const getGalleryImageById = unstable_cache(
  (id: string) => fetchGalleryImageById(id),
  ["gallery-image-by-id-v1"],
  { revalidate: GALLERY_REVALIDATE_SECONDS }
);
