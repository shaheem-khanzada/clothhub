import { HeroPhones } from '@/components/mockups/HeroPhones';
import { Container } from '@/components/ui/Container';
import { WaitlistForm } from '@/components/WaitlistForm';
import { catalogue } from '@/content/site';

export function Hero() {
  return (
    <section id="top" className="relative">
      <Container className="relative flex flex-wrap items-center gap-10 pt-8 pb-16 max-sm:pt-4">
        <div className="relative z-2 flex min-w-0 flex-[1_1_420px] flex-col items-start gap-7">
          <p className="glass gap-2 py-2 pr-3.5 pl-3 text-[13px] leading-4 font-medium text-cream">
            <span className="size-2 rounded-full bg-green shadow-[0_0_0_4px_rgb(74_222_128/0.16)]" />
            Coming soon to iPhone and Android
          </p>

          <h1 className="text-[clamp(46px,6.2vw,88px)] leading-[0.96] font-bold tracking-[-0.035em]">
            <span className="block text-mist">Every brand you love.</span>
            <span className="block text-white">One feed.</span>
          </h1>

          <p className="max-w-[500px] text-[19px] leading-[1.55] text-fog">
            ClothHub brings Pakistan’s women’s fashion — lawn, pret, unstitched and couture from{' '}
            {catalogue.brandCount} brands — into one beautiful scroll. Save what you love, share it with your
            people, and buy it straight from the brand.
          </p>

          <WaitlistForm
            id="hero"
            hint="Join the waitlist and we’ll send your invite when ClothHub launches."
            className="max-w-[500px]"
          />
        </div>

        <div className="min-w-0 flex-[1_1_600px]">
          <HeroPhones />
        </div>
      </Container>
    </section>
  );
}
