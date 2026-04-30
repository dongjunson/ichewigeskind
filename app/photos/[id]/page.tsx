import { notFound } from "next/navigation";
import { Footer } from "@/components/footer";
import { Gallery } from "@/components/gallery";
import { Hero } from "@/components/hero";
import { LatestShowcase } from "@/components/latest-showcase";
import { getGalleryImageById, getInitialGalleryPage } from "@/lib/gallery";
import { unstable_cache } from "next/cache";

export const dynamic = "force-dynamic";

const getCachedHeroSrc = unstable_cache(
  async () => {
    const { images } = await getInitialGalleryPage();
    return images.length > 0 ? images[Math.floor(Math.random() * images.length)].src : null;
  },
  ["random-hero-src"],
  { revalidate: 300 }
);

export default async function PhotoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
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
