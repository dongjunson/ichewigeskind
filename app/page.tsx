import { unstable_cache } from "next/cache";
import { Footer } from "@/components/footer";
import { Gallery } from "@/components/gallery";
import { Hero } from "@/components/hero";
import { Marquee } from "@/components/marquee";
import { PhotoJourney } from "@/components/photo-journey";
import { SectionHashSync } from "@/components/section-hash";
import { getInitialGalleryPage } from "@/lib/gallery";

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
      <Hero initialSrc={heroSrc} />
      <PhotoJourney items={images} />
      <Marquee />
      <Gallery initialItems={images} initialNextPageToken={nextPageToken} />
      <SectionHashSync ids={["timeline", "frames"]} />
      <Footer />
    </main>
  );
}
