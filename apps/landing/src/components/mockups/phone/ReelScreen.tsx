import { Photo } from '@/components/ui/Photo';
import type { Product } from '@/content/types';

import { ActionRail, Grabber, PageDots, ProductSummary, ReelTopBar } from './parts';

type ReelScreenProps = {
  /**
   * Exactly three: the `reel` animation in globals.css steps through four
   * slides — these three, then the first again so the loop restarts unseen.
   */
  products: [Product, Product, Product];
};

/** The full-screen reel, swiping up to the next product every few seconds (ProductReelView). */
export function ReelScreen({ products }: ReelScreenProps) {
  const slides = [...products, products[0]];

  return (
    <>
      <div className="absolute top-0 left-0 h-[400%] w-full motion-safe:animate-reel">
        {slides.map((product, index) => (
          <div key={`${product.name}-${index}`} className="relative h-1/4 overflow-hidden">
            <Photo src={product.image} sizes="282px" position="50% 30%" eager={index === 0} />
            <div className="absolute inset-x-0 bottom-0 z-1 h-[220px] bg-linear-to-b from-transparent to-black/50" />

            {/* The collapsed product sheet */}
            <div className="absolute inset-x-0 bottom-0 z-3 rounded-t-[26px] border-t border-white/8 bg-[rgb(22_22_24/0.86)] px-3.5 pt-[18px] pb-[22px] backdrop-blur-[20px]">
              <Grabber />
              <ProductSummary product={product} />
            </div>
          </div>
        ))}
      </div>

      <ReelTopBar />
      <ActionRail className="absolute right-2.5 bottom-[124px] z-5" />
      <PageDots count={5} className="absolute inset-x-0 bottom-[104px] z-4" />
    </>
  );
}
