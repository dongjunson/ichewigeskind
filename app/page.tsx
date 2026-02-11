import { Hero } from "@/components/hero";
import { Gallery } from "@/components/gallery";
import { Footer } from "@/components/footer";
import { getGalleryImages } from "@/lib/gallery";

export const dynamic = "force-dynamic";

export default async function Home() {
  const images = await getGalleryImages();
  const heroSrc =
    images.length > 0
      ? images[Math.floor(Math.random() * images.length)].src
      : null;

  return (
    <main>
      <Hero initialSrc={heroSrc} />
      <Gallery initialItems={images} />
      <Footer />
    </main>
  );
}
