import type { ReactNode } from 'react';

import { GlassCircle } from '@/components/ui/GlassCircle';
import { Icon } from '@/components/ui/Icon';
import { cx } from '@/lib/cx';
import { formatPrice } from '@/lib/format';

const pieceTypes = ['All', '3 Piece', '2 Piece', 'Separates'];

/** The product list's filter sheet, drawn with a few filters set (ProductListView/FilterSheet). */
export function FilterSheet() {
  return (
    <div
      aria-hidden="true"
      className="flex w-full max-w-[400px] flex-col gap-5 rounded-[28px] border border-hairline bg-sheet px-5 pt-2.5 pb-5 shadow-[0_40px_80px_-30px_rgb(0_0_0/0.8)]"
    >
      <div className="h-[5px] w-9 self-center rounded-[3px] bg-white/25" />

      <div className="flex items-center justify-between">
        <span className="w-11 text-[15px] text-fog">Reset</span>
        <span className="text-[17px] font-semibold">Filters</span>
        <GlassCircle size={32} className="ml-3">
          <Icon name="close" size={13} strokeWidth={2} />
        </GlassCircle>
      </div>

      <FilterGroup title="Price Range">
        <PriceRange from={0.1} to={0.58} />
        <div className="grid grid-cols-2 gap-2.5">
          <PriceField label="Minimum" value={2_490} />
          <PriceField label="Maximum" value={7_990} />
        </div>
      </FilterGroup>

      <FilterGroup title="Type / Category">
        <div className="flex flex-wrap gap-2">
          {pieceTypes.map((type) => (
            <span
              key={type}
              className={cx(
                'flex h-9 items-center rounded-full px-4 text-sm font-semibold',
                type === '3 Piece' ? 'bg-white text-ink' : 'bg-white/14',
              )}
            >
              {type}
            </span>
          ))}
        </div>
      </FilterGroup>

      <div className="flex flex-col rounded-2xl bg-white/8 px-4">
        <SwitchRow label="In Stock Only" on />
        <SwitchRow label="Show Sale Items Only" />
      </div>

      <div className="flex h-[50px] items-center justify-center rounded-full bg-cream text-base font-semibold text-on-cream">
        Apply (3)
      </div>
    </div>
  );
}

function FilterGroup({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-3">
      <div className="text-[15px] font-semibold">{title}</div>
      {children}
    </div>
  );
}

/** A two-thumb slider; `from` and `to` are fractions of the track. */
function PriceRange({ from, to }: { from: number; to: number }) {
  const thumb = 'absolute top-px size-[26px] -translate-x-1/2 rounded-full bg-white shadow-[0_4px_12px_rgb(0_0_0/0.5)]';

  return (
    <div className="relative h-7">
      <div className="absolute inset-x-0 top-3 h-1 rounded-xs bg-white/14" />
      <div
        className="absolute top-3 h-1 rounded-xs bg-cream"
        style={{ left: `${from * 100}%`, width: `${(to - from) * 100}%` }}
      />
      <div className={thumb} style={{ left: `${from * 100}%` }} />
      <div className={thumb} style={{ left: `${to * 100}%` }} />
    </div>
  );
}

function PriceField({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex flex-col gap-0.5 rounded-[14px] bg-white/8 px-3.5 py-2.5">
      <span className="text-xs text-fog">{label}</span>
      <span className="text-[15px] font-semibold">{formatPrice(value)}</span>
    </div>
  );
}

function SwitchRow({ label, on = false }: { label: string; on?: boolean }) {
  return (
    <div className="flex h-[52px] items-center justify-between border-b border-white/8 last:border-b-0">
      <span className="text-[15px]">{label}</span>
      <span className={cx('relative h-7 w-[46px] rounded-full', on ? 'bg-green' : 'bg-steel')}>
        <span
          className={cx(
            'absolute top-0.5 size-6 rounded-full bg-white shadow-[0_2px_6px_rgb(0_0_0/0.3)]',
            on ? 'right-0.5' : 'left-0.5',
          )}
        />
      </span>
    </div>
  );
}
