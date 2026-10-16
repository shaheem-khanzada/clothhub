import { Icon } from '@/components/ui/Icon';
import { Photo } from '@/components/ui/Photo';
import type { Product } from '@/content/types';
import { cx } from '@/lib/cx';

/*
 * Pictures of features that aren't built yet: collections, Help Me Choose and
 * community picks. The votes and rankings are illustrative.
 */

type CollectionCoverProps = {
  title: string;
  /** Four products for the 2 × 2 cover. */
  products: Product[];
  meta?: string;
  className?: string;
};

function CollectionCover({ title, products, meta, className }: CollectionCoverProps) {
  return (
    <div className={cx('w-[170px] rounded-[20px] border border-hairline bg-sheet px-1.5 pt-1.5 pb-3', className)}>
      <div className="grid grid-cols-2 gap-[3px] overflow-hidden rounded-[15px]">
        {products.map((product) => (
          <span key={product.name} className="relative aspect-3/4 overflow-hidden bg-graphite">
            <Photo src={product.image} sizes="80px" />
          </span>
        ))}
      </div>
      <div className="flex flex-col gap-0.5 px-1.5 pt-2">
        <span className="text-[13px] font-semibold">{title}</span>
        {meta ? (
          <span className="flex items-center gap-1 text-[11px] text-fog">
            <Icon name="lock" size={11} strokeWidth={2} />
            {meta}
          </span>
        ) : null}
      </div>
    </div>
  );
}

/** Two collections, one tucked behind the other. */
export function CollectionStack({ front, back }: { front: Product[]; back: Product[] }) {
  return (
    <>
      <CollectionCover
        title="Eid Shopping"
        products={back}
        className="absolute top-1/2 left-1/2 -mt-[126px] -ml-[118px] -rotate-8 opacity-70"
      />
      <CollectionCover
        title="Wedding Guest"
        products={front}
        meta={`${front.length} pieces · Private`}
        className="relative translate-x-[22px] translate-y-2 rotate-4 shadow-[0_30px_60px_-20px_rgb(0_0_0/0.9)]"
      />
    </>
  );
}

export type VoteOption = {
  product: Product;
  /** Share of the votes, 0–100. */
  percent: number;
};

/** A Help Me Choose post; the first option is the winner. */
export function ChooseVote({ question, options }: { question: string; options: VoteOption[] }) {
  return (
    <div className="flex flex-col items-center gap-4">
      <div className="text-[15px] font-semibold">{question}</div>
      <div className="flex gap-2.5">
        {options.map(({ product, percent }, index) => {
          const winner = index === 0;

          return (
            <div key={product.name} className="flex w-[78px] flex-col gap-2">
              <div
                className={cx(
                  'relative h-[112px] overflow-hidden rounded-[14px] bg-graphite',
                  winner && 'shadow-[0_0_0_2px_var(--color-cream)]',
                )}
              >
                <Photo src={product.image} sizes="78px" position="50% 20%" />
                {winner ? (
                  <span className="absolute top-1.5 right-1.5 z-2 flex size-5 items-center justify-center rounded-full bg-cream text-on-cream">
                    <Icon name="check" size={12} strokeWidth={2.6} />
                  </span>
                ) : null}
              </div>
              <div className="h-1.5 overflow-hidden rounded-[3px] bg-white/10">
                <div className={cx('h-full', winner ? 'bg-cream' : 'bg-mist')} style={{ width: `${percent}%` }} />
              </div>
              <div className={cx('text-xs', winner ? 'font-semibold' : 'text-fog')}>{percent}%</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/** "Most saved this week": a ranked list. */
export function MostSavedList({ products }: { products: Product[] }) {
  return (
    <div className="flex w-full max-w-[280px] flex-col gap-2.5">
      <div className="text-xs font-semibold text-fog">Most saved this week</div>
      {products.map((product, index) => (
        <div key={product.name} className="flex items-center gap-3 rounded-2xl bg-sheet p-2">
          <span className={cx('w-[22px] text-center text-[13px] font-bold', index === 0 ? 'text-cream' : 'text-fog')}>
            {index + 1}
          </span>
          <span className="relative h-[52px] w-10 shrink-0 overflow-hidden rounded-[10px] bg-graphite">
            <Photo src={product.image} sizes="40px" />
          </span>
          <span className="flex min-w-0 flex-1 flex-col">
            <span className="truncate text-[13px] font-semibold">{product.name}</span>
            <span className="text-[11px] text-fog">{product.brand}</span>
          </span>
          <Icon name="heartFill" size={16} className="shrink-0 text-rose" />
        </div>
      ))}
    </div>
  );
}
