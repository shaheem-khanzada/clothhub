import { GlassCircle } from '@/components/ui/GlassCircle';
import { Icon } from '@/components/ui/Icon';
import { Photo } from '@/components/ui/Photo';
import type { Brand } from '@/content/types';
import { formatProductCount } from '@/lib/format';

import { MockSearch } from './parts';

/** The app's first screen: Brands (BrandListView). */
export function BrandListScreen({ brands }: { brands: Brand[] }) {
  return (
    <div className="absolute inset-0 flex flex-col px-3 pt-[50px]">
      <div className="text-[25px] leading-[30px] font-bold tracking-[-0.4px]">Brands</div>
      <div className="mt-0.5 text-[11px] leading-[15px] text-fog">Discover Pakistani women’s fashion</div>
      <MockSearch placeholder="Search brands" className="mt-3" />

      <div className="mt-3.5 flex flex-col gap-3">
        {brands.map((brand) => (
          <BrandCard key={brand.name} brand={brand} />
        ))}
      </div>
    </div>
  );
}

function BrandCard({ brand }: { brand: Brand }) {
  return (
    <div className="relative flex h-[156px] items-end overflow-hidden rounded-[18px] bg-graphite">
      <Photo src={brand.cover} sizes="258px" position={brand.coverPosition ?? '50% 8%'} eager />
      <div className="absolute inset-0 z-1 bg-[linear-gradient(180deg,transparent_35%,rgb(0_0_0/0.55)_75%,rgb(0_0_0/0.85)_100%)]" />

      <div className="relative z-2 flex w-full items-end justify-between gap-2.5 p-3.5">
        <div className="flex min-w-0 flex-col gap-px">
          <div className="text-xl leading-6 font-bold tracking-[-0.3px]">{brand.name}</div>
          <div className="text-[11px] leading-3.5 text-silver">{formatProductCount(brand.productCount)}</div>
        </div>
        <GlassCircle size={29}>
          <Icon name="chevronRight" size={13} strokeWidth={2} />
        </GlassCircle>
      </div>
    </div>
  );
}
