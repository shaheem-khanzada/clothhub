import type { ReactNode } from 'react';

import { FilterSheet } from '@/components/mockups/FilterSheet';
import { ShareThread } from '@/components/mockups/ShareThread';
import { Container } from '@/components/ui/Container';
import { Eyebrow } from '@/components/ui/typography';
import { products } from '@/content/products';

export function FeatureCards() {
  return (
    <section className="pt-10 pb-30 max-sm:py-20">
      <Container className="grid grid-cols-[repeat(auto-fit,minmax(min(480px,100%),1fr))] gap-6">
        <FeatureCard
          eyebrow="Filters"
          title="Filters that speak lawn."
          body="3 piece or 2 piece, your budget in rupees, only what’s in stock, only what’s on sale. Narrow a brand of thousands down to the dozen worth your evening."
          caption="The filter sheet: a price range, piece type, in-stock and on-sale switches, and an Apply button."
        >
          <FilterSheet />
        </FeatureCard>

        <FeatureCard
          eyebrow="Save & share"
          title="Save it with a heart. Settle it in the group chat."
          body="Tap the heart and the piece waits for you — no digging through screenshots. Share sends its name, brand, price and link, so everyone knows exactly which one you mean."
          caption={`${products.zeenat.name} by ${products.zeenat.brand}, shared in a group chat, with replies from family.`}
        >
          <ShareThread product={products.zeenat} />
        </FeatureCard>
      </Container>
    </section>
  );
}

type FeatureCardProps = {
  eyebrow: string;
  title: string;
  body: string;
  /** Describes the picture for screen readers. */
  caption: string;
  children: ReactNode;
};

function FeatureCard({ eyebrow, title, body, caption, children }: FeatureCardProps) {
  return (
    <article className="flex min-w-0 flex-col gap-10 overflow-hidden rounded-[36px] border border-card-border bg-card p-12 max-sm:px-5 max-sm:py-7">
      <div className="flex flex-col gap-4">
        <Eyebrow>{eyebrow}</Eyebrow>
        <h3 className="text-[clamp(30px,3vw,40px)] leading-[1.05] font-bold tracking-[-0.025em]">{title}</h3>
        <p className="text-[17px] leading-[1.6] text-fog">{body}</p>
      </div>
      <figure className="flex flex-1 items-end justify-center">
        <figcaption className="sr-only">{caption}</figcaption>
        {children}
      </figure>
    </article>
  );
}
