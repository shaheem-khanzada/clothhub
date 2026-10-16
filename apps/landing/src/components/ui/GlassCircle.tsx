import type { ReactNode } from 'react';

import { cx } from '@/lib/cx';

type GlassCircleProps = {
  /** Diameter in px. */
  size: number;
  className?: string;
  children: ReactNode;
};

/** A round frosted disc — the app's GlassIconButton, drawn (it isn't clickable here). */
export function GlassCircle({ size, className, children }: GlassCircleProps) {
  return (
    <span className={cx('glass', className)} style={{ width: size, height: size }}>
      {children}
    </span>
  );
}
