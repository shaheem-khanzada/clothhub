import { BrandsBand } from '@/components/sections/BrandsBand';
import { CatalogueStats } from '@/components/sections/CatalogueStats';
import { ComingNext } from '@/components/sections/ComingNext';
import { FeatureCards } from '@/components/sections/FeatureCards';
import { Hero } from '@/components/sections/Hero';
import { JoinWaitlist } from '@/components/sections/JoinWaitlist';
import { ReelShowcase } from '@/components/sections/ReelShowcase';
import { SiteFooter } from '@/components/sections/SiteFooter';
import { SiteHeader } from '@/components/sections/SiteHeader';
import { WhyClothHub } from '@/components/sections/WhyClothHub';

export default function HomePage() {
  return (
    <>
      <SiteHeader />
      <main>
        <Hero />
        <CatalogueStats />
        <WhyClothHub />
        <ReelShowcase />
        <FeatureCards />
        <BrandsBand />
        <ComingNext />
        <JoinWaitlist />
      </main>
      <SiteFooter />
    </>
  );
}
