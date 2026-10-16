import type { ReactNode } from 'react';

import { cx } from '@/lib/cx';

type TextProps = {
  className?: string;
  children: ReactNode;
};

/** The small cream label above a section title: "The reel", "Brands". */
export function Eyebrow({ className, children }: TextProps) {
  return <p className={cx('text-sm leading-5 font-semibold text-cream', className)}>{children}</p>;
}

export function SectionTitle({ className, children }: TextProps) {
  return (
    <h2 className={cx('text-[clamp(36px,4.4vw,60px)] leading-[1.02] font-bold tracking-[-0.03em]', className)}>
      {children}
    </h2>
  );
}

/** The paragraph under a section title. */
export function Lead({ className, children }: TextProps) {
  return <p className={cx('text-lg leading-[1.6] text-fog', className)}>{children}</p>;
}
