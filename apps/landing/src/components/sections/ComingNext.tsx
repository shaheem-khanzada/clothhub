import type { ReactNode } from 'react';

import { ChooseVote, CollectionStack, MostSavedList } from '@/components/mockups/upcoming';
import { Container } from '@/components/ui/Container';
import { Eyebrow, Lead, SectionTitle } from '@/components/ui/typography';
import { products } from '@/content/products';
import { cx } from '@/lib/cx';

export function ComingNext() {
  return (
    <section id="next" className="pt-35 pb-30 max-sm:py-20">
      <Container className="flex flex-col gap-14">
        <div className="flex max-w-[720px] flex-col gap-4">
          <Eyebrow>Coming next</Eyebrow>
          <SectionTitle>Browsing is just the beginning.</SectionTitle>
          <Lead>
            The first version is about discovering beautifully. Next, ClothHub helps you organise, decide and see
            what everyone else is loving.
          </Lead>
        </div>

        <div className="grid grid-cols-[repeat(auto-fit,minmax(min(320px,100%),1fr))] gap-6">
          <UpcomingCard
            title="Collections"
            body="Wedding Guest, Eid Shopping, Maybe Later. Group pieces from any brand into your own collections — private by default, public when you want."
            glow="rgb(126 31 60 / 0.30)"
          >
            <CollectionStack
              front={[products.shabnam, products.shahnoor, products.mehru, products.goharAra]}
              back={[products.hikari, products.yuhi, products.kinako, products.evora]}
            />
          </UpcomingCard>

          <UpcomingCard
            title="Help Me Choose"
            body="Pick two or three pieces and let your people vote. The “which one?” you used to ask in the family group, answered in one place."
            glow="rgb(199 136 46 / 0.22)"
          >
            <ChooseVote
              question="Which one for the mehndi?"
              options={[
                { product: products.mehru, percent: 58 },
                { product: products.gulrang, percent: 29 },
                { product: products.sherBano, percent: 13 },
              ]}
            />
          </UpcomingCard>

          <UpcomingCard
            title="Community picks"
            body="Most saved, most shared, trending this week. When lots of people love the same piece, it rises — so you don’t have to scroll through everything."
            glow="rgb(27 38 86 / 0.45)"
            visualClassName="px-7"
          >
            <MostSavedList products={[products.yume, products.mehtab, products.fervor]} />
          </UpcomingCard>
        </div>
      </Container>
    </section>
  );
}

type UpcomingCardProps = {
  title: string;
  body: string;
  /** The colour of the soft light behind the picture. */
  glow: string;
  visualClassName?: string;
  children: ReactNode;
};

function UpcomingCard({ title, body, glow, visualClassName, children }: UpcomingCardProps) {
  return (
    <article className="flex min-w-0 flex-col overflow-hidden rounded-[32px] border border-card-border bg-card">
      <div
        aria-hidden="true"
        className={cx('relative flex h-[300px] items-center justify-center', visualClassName)}
        style={{ background: `radial-gradient(circle at 50% 60%, ${glow}, transparent 65%)` }}
      >
        {children}
      </div>
      <div className="flex flex-col gap-3 px-8 pt-2 pb-9">
        <h3 className="text-2xl leading-[1.15] font-bold tracking-[-0.02em]">{title}</h3>
        <p className="text-base leading-[1.6] text-fog">{body}</p>
      </div>
    </article>
  );
}
