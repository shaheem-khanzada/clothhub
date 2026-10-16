import { BrandMarquee } from '@/components/mockups/BrandMarquee';
import { Container } from '@/components/ui/Container';
import { Eyebrow, SectionTitle } from '@/components/ui/typography';
import { featuredBrands } from '@/content/brands';
import { catalogue } from '@/content/site';

export function BrandsBand() {
  const otherBrands = catalogue.brandCount - featuredBrands.length;

  return (
    <section id="brands" className="border-y border-divider bg-night py-25 max-sm:py-20">
      <Container className="mb-14 flex flex-wrap items-end justify-between gap-x-12 gap-y-6">
        <div className="flex max-w-[640px] flex-col gap-4">
          <Eyebrow>Brands</Eyebrow>
          <SectionTitle>From everyday lawn to bridal couture.</SectionTitle>
        </div>
        <p className="max-w-[400px] text-[17px] leading-[1.6] text-fog">
          ClothHub follows each brand’s own catalogue, so new arrivals, prices and what’s in stock show up without
          you checking twenty websites.
        </p>
      </Container>

      <BrandMarquee brands={featuredBrands} />

      <Container className="mt-12 flex flex-wrap justify-between gap-3">
        <p className="text-[15px] leading-[22px] text-fog">…and {otherBrands} more, from Saya to Zara Shahjahan.</p>
        <p className="text-[13px] leading-5 text-mist">ClothHub is independent and not affiliated with the brands shown.</p>
      </Container>
    </section>
  );
}
