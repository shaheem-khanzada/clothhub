import { GlassCircle } from '@/components/ui/GlassCircle';
import { Icon } from '@/components/ui/Icon';
import { Photo } from '@/components/ui/Photo';
import type { Brand, Product } from '@/content/types';
import { cx } from '@/lib/cx';
import { formatPrice, formatProductCount } from '@/lib/format';

import { MockChip, MockSearch } from './parts';

type ProductGridScreenProps = {
  brand: Brand;
  products: Product[];
  /** The one product shown as saved. */
  saved?: Product;
};

/** A brand's products in two columns (ProductListView). */
export function ProductGridScreen({ brand, products, saved }: ProductGridScreenProps) {
  return (
    <div className="absolute inset-0 flex flex-col px-3 pt-[46px]">
      <div className="flex items-center justify-between gap-2">
        <GlassCircle size={29}>
          <Icon name="chevronLeft" size={13} strokeWidth={2} />
        </GlassCircle>
        <div className="flex flex-col items-center">
          <div className="text-[12.5px] leading-4 font-semibold">{brand.name}</div>
          <div className="text-[9px] leading-3 text-fog">{formatProductCount(brand.productCount)}</div>
        </div>
        <div className="size-[29px]" />
      </div>

      <MockSearch placeholder={`Search ${brand.name}`} className="mt-2.5" />

      <div className="mt-2.5 flex gap-1.5">
        <MockChip icon="sort" label="Sort" />
        <MockChip icon="filter" label="Filters" />
      </div>

      <div className="mt-3 grid grid-cols-2 gap-x-2 gap-y-3">
        {products.map((product) => (
          <ProductCard key={product.name} product={product} saved={product === saved} />
        ))}
      </div>
    </div>
  );
}

function ProductCard({ product, saved }: { product: Product; saved: boolean }) {
  return (
    <div className="flex min-w-0 flex-col gap-1.5">
      <div className="relative aspect-3/4 overflow-hidden rounded-[10px] bg-graphite">
        <Photo src={product.image} sizes="125px" eager />
        <GlassCircle size={23} className={cx('absolute top-1.5 right-1.5 z-2', saved && 'text-rose')}>
          <Icon name={saved ? 'heartFill' : 'heart'} size={11} strokeWidth={2} />
        </GlassCircle>
      </div>
      <div className="flex flex-col gap-[3px] px-px">
        <div className="text-[9.5px] leading-[13px] font-medium">{product.name}</div>
        <div className="text-[11px] leading-3.5 font-bold">{formatPrice(product.price)}</div>
      </div>
    </div>
  );
}
