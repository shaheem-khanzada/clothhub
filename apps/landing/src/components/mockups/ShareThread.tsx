import { ChatBubble } from '@/components/ui/ChatBubble';
import { GlassCircle } from '@/components/ui/GlassCircle';
import { Icon } from '@/components/ui/Icon';
import { Photo } from '@/components/ui/Photo';
import type { Product } from '@/content/types';
import { displayUrl, formatPrice } from '@/lib/format';

const theirBubble = 'max-w-[80%] rounded-[22px_22px_22px_8px] px-4 pt-2.5 pb-3';
const myBubble = 'max-w-[80%] rounded-[22px_22px_8px_22px] px-4 py-2.5';

/**
 * A piece shared from the app into a family group chat. The message matches
 * the app's share text: "{name} by {brand} — {price}" and the link.
 */
export function ShareThread({ product }: { product: Product }) {
  return (
    <div aria-hidden="true" className="flex w-full max-w-[420px] flex-col gap-2.5">
      <div className="flex w-[280px] max-w-[88%] flex-col gap-2.5 self-end rounded-[24px_24px_8px_24px] bg-cream px-2 pt-2 pb-3 text-on-cream shadow-[0_30px_60px_-24px_rgb(0_0_0/0.9)]">
        <div className="relative h-[300px] overflow-hidden rounded-[17px] bg-graphite">
          <Photo src={product.image} sizes="264px" position="50% 20%" />
          <GlassCircle size={38} className="absolute top-2.5 right-2.5 z-2 text-rose">
            <span className="flex motion-safe:animate-beat">
              <Icon name="heartFill" size={18} />
            </span>
          </GlassCircle>
        </div>
        <div className="flex flex-col gap-1 px-2">
          <span className="text-[15px] leading-5 font-semibold">
            {product.name} by {product.brand} — {formatPrice(product.price)}
          </span>
          <span className="text-[13px] leading-[18px] text-link-on-cream underline">{displayUrl(product.url)}</span>
        </div>
      </div>

      <ChatBubble from="them" name="Apa" nameClassName="text-rose-light" className={theirBubble}>
        The aqua one. No question.
      </ChatBubble>
      <ChatBubble from="them" name="Sana" nameClassName="text-sky" className={theirBubble}>
        Saving it too. For the mehndi?
      </ChatBubble>
      <ChatBubble from="me" className={myBubble}>
        Yes! Ordering tonight.
      </ChatBubble>
    </div>
  );
}
