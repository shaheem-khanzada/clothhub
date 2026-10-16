import { Photo } from '@/components/ui/Photo';
import type { Brand } from '@/content/types';
import { formatProductCount } from '@/lib/format';

/** A row of brand cards scrolling sideways forever; hovering pauses it. */
export function BrandMarquee({ brands }: { brands: Brand[] }) {
  return (
    <div className="fade-edges overflow-hidden">
      <div className="flex w-max hover:[animation-play-state:paused] motion-safe:animate-marquee">
        <BrandRow brands={brands} />
        {/* The second copy makes the loop seamless; screen readers only need one. */}
        <BrandRow brands={brands} hidden />
      </div>
    </div>
  );
}

function BrandRow({ brands, hidden = false }: { brands: Brand[]; hidden?: boolean }) {
  return (
    <ul aria-hidden={hidden || undefined} className="flex gap-[18px] pr-[18px]">
      {brands.map((brand) => (
        <li key={brand.name} className="relative h-[300px] w-[220px] shrink-0 overflow-hidden rounded-3xl bg-graphite">
          <Photo src={brand.cover} sizes="220px" position={brand.coverPosition ?? '50% 10%'} />
          <span className="absolute inset-0 bg-linear-to-b from-transparent from-50% to-black/80" />
          <span className="absolute inset-x-[18px] bottom-4 flex flex-col gap-0.5">
            <span className="text-[22px] leading-[26px] font-bold tracking-[-0.02em]">{brand.name}</span>
            <span className="text-[13px] text-silver">{formatProductCount(brand.productCount)}</span>
          </span>
        </li>
      ))}
    </ul>
  );
}
