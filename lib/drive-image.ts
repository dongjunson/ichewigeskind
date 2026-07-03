import { google } from "googleapis";

const BROWSER_SAFE_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);
const CONVERTED_THUMBNAIL_SIZE = "=s2048";

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

async function fetchThumbnailLinkWithServiceAccount(id: string) {
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

  const params = new URLSearchParams({ fields: "thumbnailLink", supportsAllDrives: "true" });
  const res = await fetch(`https://www.googleapis.com/drive/v3/files/${id}?${params}`, {
    headers: {
      Authorization: `Bearer ${token.token}`,
    },
  });
  if (!res.ok) return null;
  const data = (await res.json()) as { thumbnailLink?: string };
  return data.thumbnailLink ?? null;
}

async function fetchThumbnailLinkWithApiKey(id: string) {
  const apiKey = process.env.GOOGLE_DRIVE_API_KEY;
  if (!apiKey) return null;

  const resourceKey = process.env.GOOGLE_DRIVE_RESOURCE_KEY;
  const headers: HeadersInit = {};
  if (resourceKey) {
    headers["X-Goog-Drive-Resource-Keys"] = `${id}/${resourceKey}`;
  }
  const params = new URLSearchParams({
    key: apiKey,
    fields: "thumbnailLink",
    supportsAllDrives: "true",
  });
  const res = await fetch(`https://www.googleapis.com/drive/v3/files/${id}?${params}`, { headers });
  if (!res.ok) return null;
  const data = (await res.json()) as { thumbnailLink?: string };
  return data.thumbnailLink ?? null;
}

async function fetchConvertedThumbnail(id: string) {
  const link =
    (await fetchThumbnailLinkWithServiceAccount(id)) ?? (await fetchThumbnailLinkWithApiKey(id));
  if (!link) return null;

  const res = await fetch(link.replace(/=s\d+$/, CONVERTED_THUMBNAIL_SIZE));
  return res.ok ? res : null;
}

function getContentType(res: Response) {
  return res.headers.get("content-type")?.split(";")[0]?.trim().toLowerCase() ?? "";
}

export async function fetchDriveImage(id: string) {
  const res =
    (await fetchDriveImageWithServiceAccount(id)) ?? (await fetchDriveImageWithApiKey(id));
  if (!res?.ok) return res;
  if (BROWSER_SAFE_IMAGE_TYPES.has(getContentType(res))) return res;

  // Browsers cannot decode formats like HEIC; serve Drive's JPEG thumbnail instead.
  const converted = await fetchConvertedThumbnail(id);
  if (!converted) return res;
  void res.body?.cancel();
  return converted;
}
