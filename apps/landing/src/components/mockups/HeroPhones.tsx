import { brands } from '@/content/brands';
import { products } from '@/content/products';

import { BrandListScreen } from './phone/BrandListScreen';
import { PhoneFrame } from './phone/PhoneFrame';
import { ProductGridScreen } from './phone/ProductGridScreen';
import { ReelScreen } from './phone/ReelScreen';

/**
 * Three phones fanned out: the brand list, the reel (front, gently floating)
 * and a brand's products. Drawn on a fixed 600 × 690 stage that scales down on
 * phones.
 */
export function HeroPhones() {
  return (
    <figure>
      <figcaption className="sr-only">
        Three ClothHub screens: the brand list, the full-screen product reel, and Hussain Rehar’s product grid.
      </figcaption>

      <div
        aria-hidden="true"
        className="flex h-[690px] justify-center max-sm:h-[440px] max-sm:overflow-hidden max-[420px]:h-[390px]"
      >
        <div className="relative h-[690px] w-[600px] shrink-0 origin-top max-sm:scale-62 max-[420px]:scale-54">
          <div className="absolute top-[46%] left-1/2 size-[560px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle_at_34%_40%,rgb(32_48_110/0.55),transparent_60%),radial-gradient(circle_at_70%_62%,rgb(150_30_90/0.42),transparent_60%)] blur-[40px]" />

          <div className="absolute top-[70px] -left-2.5 z-1 -rotate-8 scale-88">
            <PhoneFrame dimmed>
              <BrandListScreen brands={[brands.elan, brands.hussainRehar, brands.amnaIsmail]} />
            </PhoneFrame>
          </div>

          <div className="absolute top-[70px] -right-2.5 z-1 rotate-8 scale-88">
            <PhoneFrame dimmed>
              <ProductGridScreen
                brand={brands.hussainRehar}
                products={[products.sakura, products.rin, products.yume, products.evora]}
                saved={products.rin}
              />
            </PhoneFrame>
          </div>

          <div className="absolute top-1.5 left-[150px] z-3">
            <div className="motion-safe:animate-float">
              <PhoneFrame screenClassName="bg-black">
                <ReelScreen products={[products.neelum, products.sherBano, products.mehtab]} />
              </PhoneFrame>
            </div>
          </div>
        </div>
      </div>
    </figure>
  );
}
