import { ScreenshotPile } from '@/components/mockups/ScreenshotPile';
import { Container } from '@/components/ui/Container';
import { Icon } from '@/components/ui/Icon';
import { Eyebrow, Lead, SectionTitle } from '@/components/ui/typography';

const beforeAndAfter = [
  { before: 'Ten brand tabs', after: 'One feed' },
  { before: 'Screenshots in your gallery', after: 'Saved with a heart' },
  { before: '“Which brand was this?”', after: 'Brand, price and link, attached' },
];

export function WhyClothHub() {
  return (
    <section className="pt-35 pb-30 max-sm:py-20">
      <Container className="grid grid-cols-[repeat(auto-fit,minmax(min(460px,100%),1fr))] items-center gap-16">
        <ScreenshotPile />

        <div className="flex min-w-0 flex-col gap-5.5">
          <Eyebrow>Why ClothHub</Eyebrow>
          <SectionTitle>Your camera roll was never meant to be a wishlist.</SectionTitle>
          <Lead>
            Ten brand websites, two hundred screenshots, and a family group asking which brand the blue one was
            from. ClothHub keeps every piece tied to its brand, its price and its page — so getting back to it
            takes a tap, not an evening.
          </Lead>

          <ul className="mt-2 flex flex-col">
            {beforeAndAfter.map((row) => (
              <li
                key={row.after}
                className="grid grid-cols-[minmax(0,1fr)_24px_minmax(0,1fr)] items-center gap-4 border-t border-hairline py-[18px] last:border-b"
              >
                <span className="text-base leading-[22px] text-mist line-through">{row.before}</span>
                <Icon name="arrowRight" size={20} className="text-smoke" />
                <span className="text-base leading-[22px] font-semibold">{row.after}</span>
              </li>
            ))}
          </ul>
        </div>
      </Container>
    </section>
  );
}
