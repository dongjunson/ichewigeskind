import { ImageResponse } from "next/og";

export const alt = "ichewigeskind photo";
export const contentType = "image/png";
export const size = {
  width: 1200,
  height: 630,
};

type OpenGraphImageProps = {
  params: Promise<{ id: string }>;
};

function getSiteUrl() {
  const configuredUrl = process.env.NEXT_PUBLIC_SITE_URL ?? process.env.SITE_URL;
  const vercelUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL ?? process.env.VERCEL_URL;
  const url = configuredUrl ?? (vercelUrl ? `https://${vercelUrl}` : "http://localhost:3000");

  return new URL(url.startsWith("http") ? url : `https://${url}`);
}

function getPhotoImageUrl(id: string) {
  const params = new URLSearchParams({ id });
  return new URL(`/api/gallery/image?${params.toString()}`, getSiteUrl()).toString();
}

export default async function OpenGraphImage({ params }: OpenGraphImageProps) {
  const { id } = await params;

  return new ImageResponse(
    (
      <div
        style={{
          alignItems: "center",
          background: "#050505",
          display: "flex",
          height: "100%",
          justifyContent: "center",
          overflow: "hidden",
          width: "100%",
        }}
      >
        {/* biome-ignore lint/performance/noImgElement: ImageResponse renders raw image elements. */}
        <img
          alt=""
          src={getPhotoImageUrl(id)}
          style={{
            height: "100%",
            objectFit: "cover",
            width: "100%",
          }}
        />
      </div>
    ),
    size
  );
}
