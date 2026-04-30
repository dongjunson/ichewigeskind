import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Footer } from "@/components/footer";
import { Gallery } from "@/components/gallery";
import { Hero } from "@/components/hero";
import { LatestShowcase } from "@/components/latest-showcase";
import { getGalleryImageById, getInitialGalleryPage } from "@/lib/gallery";
import { unstable_cache } from "next/cache";

export const dynamic = "force-dynamic";

type PhotoPageProps = {
  params: Promise<{ id: string }>;
};

function getSiteUrl() {
  const configuredUrl = process.env.NEXT_PUBLIC_SITE_URL ?? process.env.SITE_URL;
  const vercelUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL ?? process.env.VERCEL_URL;
  const url = configuredUrl ?? (vercelUrl ? `https://${vercelUrl}` : "http://localhost:3000");

  return new URL(url.startsWith("http") ? url : `https://${url}`);
}

function getPhotoPath(id: string) {
  return `/photos/${encodeURIComponent(id)}`;
}

const getCachedHeroSrc = unstable_cache(
  async () => {
    const { images } = await getInitialGalleryPage();
    return images.length > 0 ? images[Math.floor(Math.random() * images.length)].src : null;
  },
  ["random-hero-src"],
  { revalidate: 300 }
);

export async function generateMetadata({ params }: PhotoPageProps): Promise<Metadata> {
  const { id } = await params;
  const siteUrl = getSiteUrl();
  const pageUrl = new URL(getPhotoPath(id), siteUrl);
  const imageUrl = new URL(`${getPhotoPath(id)}/opengraph-image`, siteUrl);
  const title = "ichewigeskind — Film Photography Journal";
  const description =
    "A quiet journal dedicated to the art of analog photography. Stories told through grain, light, and patience.";

  return {
    title,
    description,
    alternates: {
      canonical: pageUrl,
    },
    openGraph: {
      title,
      description,
      url: pageUrl,
      type: "article",
      siteName: "ichewigeskind",
      images: [
        {
          url: imageUrl,
          alt: "ichewigeskind photo",
          width: 1200,
          height: 630,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [imageUrl],
    },
  };
}

export default async function PhotoPage({ params }: PhotoPageProps) {
  const { id } = await params;
  const [{ images, nextPageToken }, selectedImage, heroSrc] = await Promise.all([
    getInitialGalleryPage(),
    getGalleryImageById(id),
    getCachedHeroSrc(),
  ]);
  const initialSelectedImage = selectedImage ?? images.find((image) => image.id === id);

  if (initialSelectedImage) {
    console.info("Gallery photo route loaded:", {
      id,
      source: selectedImage ? "metadata" : "initial-page",
    });
  } else {
    console.info("Gallery photo route not found:", { id });
    notFound();
  }

  return (
    <main>
      <Hero initialSrc={heroSrc}>
        <LatestShowcase items={images.slice(0, 5)} />
      </Hero>
      <Gallery
        initialItems={images}
        initialNextPageToken={nextPageToken}
        initialSelectedImage={initialSelectedImage}
      />
      <Footer />
    </main>
  );
}
