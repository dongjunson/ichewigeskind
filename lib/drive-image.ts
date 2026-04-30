import { google } from "googleapis";

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

export async function fetchDriveImage(id: string) {
  return (await fetchDriveImageWithServiceAccount(id)) ?? (await fetchDriveImageWithApiKey(id));
}
