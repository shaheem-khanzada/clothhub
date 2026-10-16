'use client';

import { useState, type FormEvent } from 'react';

import { creamButton } from '@/components/ui/button';
import { cx } from '@/lib/cx';
import { joinWaitlist } from '@/lib/waitlist';

type Status = 'idle' | 'sending' | 'joined' | 'failed';

type WaitlistFormProps = {
  /** Makes the input's id unique when the form appears more than once. */
  id: string;
  /** Shown under the field until the visitor submits. */
  hint?: string;
  className?: string;
};

export function WaitlistForm({ id, hint, className }: WaitlistFormProps) {
  const [status, setStatus] = useState<Status>('idle');
  const inputId = `waitlist-email-${id}`;
  const busy = status === 'sending' || status === 'joined';

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const email = new FormData(event.currentTarget).get('email');

    if (typeof email !== 'string') {
      return;
    }

    setStatus('sending');

    try {
      await joinWaitlist(email);
      setStatus('joined');
    } catch {
      setStatus('failed');
    }
  }

  const message =
    status === 'joined'
      ? 'You’re on the list. We’ll email you when ClothHub launches.'
      : status === 'failed'
        ? 'We couldn’t add you just now. Please try again soon.'
        : hint;

  return (
    <form onSubmit={handleSubmit} className={cx('flex w-full flex-col gap-3', className)}>
      <label htmlFor={inputId} className="sr-only">
        Email address
      </label>

      <div className="flex items-center gap-2 rounded-full border border-hairline bg-graphite py-1.5 pr-1.5 pl-5.5 text-left transition-colors focus-within:border-smoke">
        <input
          id={inputId}
          name="email"
          type="email"
          required
          autoComplete="email"
          placeholder="Your email address"
          disabled={busy}
          className="h-11 min-w-0 flex-auto border-0 bg-transparent text-base text-white outline-none placeholder:text-mist"
        />
        <button type="submit" disabled={busy} className={cx(creamButton, 'h-12 cursor-pointer px-5.5 text-base disabled:cursor-default')}>
          {status === 'joined' ? 'You’re in' : 'Get early access'}
        </button>
      </div>

      {/* Always rendered, so screen readers announce the result when it appears. */}
      <p aria-live="polite" className={cx('pl-5.5 text-sm leading-5 text-mist', !message && 'sr-only')}>
        {message}
      </p>
    </form>
  );
}
