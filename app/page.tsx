import { Footer } from "@/components/footer";
import { Gallery } from "@/components/gallery";
import { Hero } from "@/components/hero";
import { LatestShowcase } from "@/components/latest-showcase";
import { getInitialGalleryPage } from "@/lib/gallery";
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

export default async function Home() {
  const [{ images, nextPageToken }, heroSrc] = await Promise.all([
    getInitialGalleryPage(),
    getCachedHeroSrc(),
  ]);

  return (
    <main>
      <Hero initialSrc={heroSrc}>
        <LatestShowcase items={images.slice(0, 5)} />
      </Hero>
      <Gallery initialItems={images} initialNextPageToken={nextPageToken} />
      <Footer />
    </main>
  );
}
