import type { StaticImageData } from 'next/image';

import { Photo } from '@/components/ui/Photo';

export type RackItem = {
  image: StaticImageData;
  /** Height in px; the rack looks better uneven. */
  height: number;
  /** A negative delay in seconds, so the pieces don't sway in step. */
  swayDelay: number;
};

/** Photos hanging from a rail, each swaying a little. Clipped at the sides on narrow screens. */
export function ClothesRack({ items }: { items: RackItem[] }) {
  return (
    <div aria-hidden="true" className="relative mb-20 flex items-start justify-center gap-3.5 overflow-hidden pt-3.5">
      <div className="absolute inset-x-0 top-3 h-0.5 bg-[linear-gradient(90deg,transparent,var(--color-steel)_15%,var(--color-steel)_85%,transparent)]" />
      {items.map((item, index) => (
        <div
          key={index}
          className="flex shrink-0 origin-top flex-col items-center motion-safe:animate-sway"
          style={{ animationDelay: `${item.swayDelay}s` }}
        >
          <span className="h-4 w-0.5 bg-steel" />
          <span className="relative w-28 overflow-hidden rounded-[18px] bg-graphite" style={{ height: item.height }}>
            <Photo src={item.image} sizes="112px" />
          </span>
        </div>
      ))}
    </div>
  );
}
