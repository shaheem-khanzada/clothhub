import { ClothesRack, type RackItem } from '@/components/mockups/ClothesRack';
import { Container } from '@/components/ui/Container';
import { WaitlistForm } from '@/components/WaitlistForm';
import { brands } from '@/content/brands';
import { products } from '@/content/products';

const rack: RackItem[] = [
  { image: products.sakura.image, height: 220, swayDelay: 0 },
  { image: brands.elan.cover, height: 262, swayDelay: -1 },
  { image: products.mehtab.image, height: 236, swayDelay: -2.5 },
  { image: brands.rajbari.cover, height: 284, swayDelay: -0.5 },
  { image: products.yuki.image, height: 246, swayDelay: -3 },
  { image: brands.amnaIsmail.cover, height: 300, swayDelay: -1.8 },
  { image: products.rin.image, height: 254, swayDelay: -4 },
  { image: brands.tenaDurrani.cover, height: 226, swayDelay: -2 },
  { image: products.gulrukh.image, height: 272, swayDelay: -3.4 },
  { image: brands.faizaFaisal.cover, height: 240, swayDelay: -0.8 },
  { image: products.hikari.image, height: 258, swayDelay: -2.8 },
];

export function JoinWaitlist() {
  return (
    <section id="join" className="relative overflow-hidden pt-10 pb-35 max-sm:py-20">
      <ClothesRack items={rack} />

      <Container className="flex flex-col items-center gap-7 text-center">
        <h2 className="max-w-[960px] text-[clamp(40px,5.6vw,80px)] leading-[0.98] font-bold tracking-[-0.035em]">
          <span className="block">Your next outfit is already out there.</span>
          <span className="block text-mist">Let’s find it.</span>
        </h2>
        <p className="max-w-[520px] text-lg leading-[1.6] text-fog">
          ClothHub is coming to iPhone and Android. Leave your email and you’ll be one of the first in.
        </p>
        <WaitlistForm id="join" className="max-w-[520px]" />
      </Container>
    </section>
  );
}
