import { Icon } from '@/components/ui/Icon';
import { Photo } from '@/components/ui/Photo';
import type { Product } from '@/content/types';
import { cx } from '@/lib/cx';

import { Grabber, ProductSummary, ReelTopBar } from './parts';

/** The reel with the product sheet dragged up: sizes, fabric, colour, Visit Brand (ProductSheet). */
export function ProductDetailScreen({ product }: { product: Product }) {
  return (
    <>
      <div className="absolute inset-x-0 top-0 h-[250px]">
        <Photo src={product.image} sizes="282px" position="50% 16%" />
      </div>

      <ReelTopBar />

      <div className="absolute inset-x-0 top-[214px] bottom-0 z-3 flex flex-col gap-[13px] rounded-t-[26px] border-t border-white/8 bg-[rgb(20_20_22/0.96)] px-3.5 pt-5 backdrop-blur-[24px]">
        <Grabber />
        <ProductSummary product={product} />
        <div className="h-px bg-hairline" />
        <div className="text-[12.5px] leading-4 font-semibold">Product Details</div>

        {product.sizes ? (
          <div className="flex flex-col gap-1.5">
            <div className="text-[9.5px] leading-3 text-fog">Available Sizes</div>
            <div className="flex gap-[5px]">
              {product.sizes.map((size) => (
                <span
                  key={size.label}
                  className={cx(
                    'flex h-6 items-center rounded-full px-2.5 text-[10px] font-semibold',
                    size.inStock ? 'bg-white/14' : 'bg-white/6 text-smoke line-through',
                  )}
                >
                  {size.label}
                </span>
              ))}
            </div>
          </div>
        ) : null}

        <div className="flex flex-col rounded-xl bg-white/8 px-3">
          {product.fabric ? <DetailRow label="Fabric" value={product.fabric} /> : null}
          <DetailRow label="Colour" value={product.colour} />
        </div>

        {product.description ? (
          <p className="text-[10.5px] leading-[15px] text-fog">
            {product.description} <span className="font-semibold text-cream">Show more</span>
          </p>
        ) : null}

        <div className="absolute inset-x-3.5 bottom-5 flex h-10 items-center justify-center gap-1.5 rounded-full bg-cream text-xs font-semibold text-on-cream">
          <span>Visit Brand</span>
          <Icon name="openFill" size={13} />
        </div>
      </div>
    </>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex h-8 items-center justify-between border-b border-white/8 text-[10.5px] last:border-b-0">
      <span className="text-fog">{label}</span>
      <span className="font-semibold">{value}</span>
    </div>
  );
}
