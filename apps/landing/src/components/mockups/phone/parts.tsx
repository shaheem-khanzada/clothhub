import { GlassCircle } from '@/components/ui/GlassCircle';
import { Icon, type IconName } from '@/components/ui/Icon';
import { Photo } from '@/components/ui/Photo';
import type { Product } from '@/content/types';
import { cx } from '@/lib/cx';
import { formatPrice } from '@/lib/format';

/*
 * Small pieces of the app's screens, scaled to the 282px-wide mockup screen.
 * Each mirrors a component in apps/mobile/src.
 */

/** The search field at the top of the brand list and a brand's products. */
export function MockSearch({ placeholder, className }: { placeholder: string; className?: string }) {
  return (
    <div className={cx('flex h-[30px] items-center gap-1.5 rounded-[10px] bg-graphite px-2.5 text-[11px] text-mist', className)}>
      <Icon name="search" size={12} strokeWidth={2} />
      <span>{placeholder}</span>
    </div>
  );
}

/** Sort / Filters pills in the product list toolbar. */
export function MockChip({ icon, label }: { icon: IconName; label: string }) {
  return (
    <div className="flex h-[26px] items-center gap-[5px] rounded-full bg-white/10 px-2.5 text-[10px] font-semibold">
      <Icon name={icon} size={11} strokeWidth={2} />
      <span>{label}</span>
    </div>
  );
}

/** The sheet's drag handle. */
export function Grabber() {
  return <div className="absolute top-1.5 left-1/2 h-1 w-[30px] -translate-x-1/2 rounded-xs bg-white/30" />;
}

/** Close and More over the reel's photo (ProductReelView/TopBar). */
export function ReelTopBar() {
  return (
    <div className="absolute inset-x-3 top-[46px] z-5 flex justify-between">
      <GlassCircle size={32}>
        <Icon name="close" size={13} strokeWidth={2} />
      </GlassCircle>
      <GlassCircle size={32}>
        <Icon name="ellipsis" size={14} />
      </GlassCircle>
    </div>
  );
}

/** Save, share and Visit Brand on the reel's right edge (ProductReelView/ActionRail). */
export function ActionRail({ className }: { className?: string }) {
  return (
    <div className={cx('flex flex-col items-center gap-[11px]', className)}>
      <GlassCircle size={38} className="text-rose">
        <span className="flex motion-safe:animate-beat">
          <Icon name="heartFill" size={17} />
        </span>
      </GlassCircle>
      <GlassCircle size={38}>
        <Icon name="shareFill" size={17} />
      </GlassCircle>
      <GlassCircle size={38}>
        <Icon name="openFill" size={17} />
      </GlassCircle>
    </div>
  );
}

/** Which photo of the product is showing (ProductReelView/ImageProgress). */
export function PageDots({ count, active = 0, className }: { count: number; active?: number; className?: string }) {
  return (
    <div className={cx('flex justify-center gap-1', className)}>
      {Array.from({ length: count }, (_, index) => (
        <span
          key={index}
          className={cx('h-[5px] rounded-[3px]', index === active ? 'w-3.5 bg-white' : 'w-[5px] bg-white/45')}
        />
      ))}
    </div>
  );
}

/**
 * Brand, name and price beside a round crop of the outfit — the collapsed
 * card and the top of the opened sheet (ProductReelView/ProductSummary).
 */
export function ProductSummary({ product }: { product: Product }) {
  return (
    <div className="flex items-center gap-3">
      <div className="relative size-12 shrink-0 overflow-hidden rounded-full border border-hairline bg-graphite">
        <Photo src={product.image} sizes="48px" position="50% 25%" />
      </div>
      <div className="flex min-w-0 flex-col">
        <div className="text-[9px] leading-3 font-semibold whitespace-nowrap text-fog">{product.brand}</div>
        <div className="mt-[3px] mb-1.5 text-[12.5px] leading-4 font-semibold">{product.name}</div>
        <div className="text-[11px] font-bold">{formatPrice(product.price)}</div>
      </div>
    </div>
  );
}
