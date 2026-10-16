import { PhoneFrame } from '@/components/mockups/phone/PhoneFrame';
import { ProductDetailScreen } from '@/components/mockups/phone/ProductDetailScreen';
import { Container } from '@/components/ui/Container';
import { GlassCircle } from '@/components/ui/GlassCircle';
import { Icon, type IconName } from '@/components/ui/Icon';
import { Eyebrow, Lead, SectionTitle } from '@/components/ui/typography';
import { products } from '@/content/products';

// The app's gesture guide (ProductReelView/GestureGuide), plus where buying happens.
const gestures: Array<{ icon: IconName; title: string; detail: string }> = [
  { icon: 'swipeUp', title: 'Swipe up', detail: 'The next piece' },
  { icon: 'swipeHorizontal', title: 'Swipe left or right', detail: 'Every photo of it' },
  { icon: 'details', title: 'Drag the card up', detail: 'Sizes in stock, fabric and colour' },
  { icon: 'openFill', title: 'Visit Brand', detail: 'Buy it on the brand’s own site' },
];

export function ReelShowcase() {
  return (
    <section id="reel" className="pt-15 pb-30 max-sm:py-20">
      <Container className="grid grid-cols-[repeat(auto-fit,minmax(min(460px,100%),1fr))] items-center gap-16">
        <figure className="relative flex min-h-[760px] items-center justify-center overflow-hidden rounded-[40px] border border-divider bg-panel">
          <figcaption className="sr-only">
            The product reel with Rin’s detail card opened: sizes, fabric, colour and a Visit Brand button.
          </figcaption>
          <div
            aria-hidden="true"
            className="absolute top-1/2 left-1/2 size-[520px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgb(14_90_60/0.55),transparent_62%)] blur-[30px]"
          />
          <div aria-hidden="true" className="relative z-1">
            <PhoneFrame screenClassName="bg-black">
              <ProductDetailScreen product={products.rin} />
            </PhoneFrame>
          </div>
        </figure>

        <div className="flex min-w-0 flex-col gap-5.5">
          <Eyebrow>The reel</Eyebrow>
          <SectionTitle>One piece at a time, edge to edge.</SectionTitle>
          <Lead>
            Every piece fills the screen, the way it was shot. Swipe through a brand like you scroll your feed —
            and when it’s the one, Visit Brand opens it on the brand’s own website to buy.
          </Lead>

          <ul className="mt-2 flex flex-col">
            {gestures.map((gesture) => (
              <li key={gesture.title} className="flex items-center gap-4 border-t border-hairline py-4 last:border-b">
                <GlassCircle size={44}>
                  <Icon name={gesture.icon} size={20} />
                </GlassCircle>
                <span className="flex flex-col gap-0.5">
                  <span className="text-[17px] leading-[22px] font-semibold">{gesture.title}</span>
                  <span className="text-[15px] leading-5 text-fog">{gesture.detail}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      </Container>
    </section>
  );
}
