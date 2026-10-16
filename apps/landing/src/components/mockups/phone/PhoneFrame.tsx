import type { ReactNode } from 'react';

import { cx } from '@/lib/cx';

type PhoneFrameProps = {
  /** Darkens the screen, for phones behind another one. */
  dimmed?: boolean;
  className?: string;
  screenClassName?: string;
  /** Laid out on a 282 × 622 screen — an iPhone at about 72%. */
  children: ReactNode;
};

/**
 * A 300 × 640 phone with its screen. No status bar: the screens start below
 * where it would be, as they do in the app.
 */
export function PhoneFrame({ dimmed = false, className, screenClassName, children }: PhoneFrameProps) {
  return (
    <div className={cx('phone-bezel relative h-[640px] w-[300px] shrink-0 rounded-[52px] p-[9px]', className)}>
      <div className={cx('relative isolate size-full overflow-hidden rounded-[43px] bg-ink', screenClassName)}>
        {/* Dynamic Island */}
        <div className="absolute top-2.5 left-1/2 z-30 h-[25px] w-[86px] -translate-x-1/2 rounded-[20px] bg-black" />
        {children}
        {dimmed ? <div className="absolute inset-0 z-40 bg-black/22" /> : null}
      </div>
    </div>
  );
}
