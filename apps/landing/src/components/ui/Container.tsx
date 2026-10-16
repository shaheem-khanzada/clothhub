import type { ReactNode } from 'react';

import { cx } from '@/lib/cx';

type ContainerProps = {
  className?: string;
  children: ReactNode;
};

/** The page column: 1200px wide at most, with a 32px gutter (16px on phones). */
export function Container({ className, children }: ContainerProps) {
  return <div className={cx('mx-auto w-full max-w-[1200px] px-8 max-sm:px-4', className)}>{children}</div>;
}
