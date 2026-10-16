import type { ReactNode } from 'react';

import { cx } from '@/lib/cx';

type ChatBubbleProps = {
  /** "me" sits on the right in cream; "them" on the left in graphite. */
  from: 'me' | 'them';
  /** The sender's name, shown above a "them" message. */
  name?: string;
  nameClassName?: string;
  /** Shape and padding differ between the two chats, so the caller sets them. */
  className?: string;
  children: ReactNode;
};

export function ChatBubble({ from, name, nameClassName, className, children }: ChatBubbleProps) {
  return (
    <div
      className={cx(
        'flex flex-col gap-0.5 text-[15px] leading-5',
        from === 'me' ? 'self-end bg-cream font-medium text-on-cream' : 'self-start bg-graphite-raised',
        className,
      )}
    >
      {name ? <span className={cx('text-xs leading-4 font-semibold', nameClassName)}>{name}</span> : null}
      <span>{children}</span>
    </div>
  );
}
