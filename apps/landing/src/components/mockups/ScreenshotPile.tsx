import { ChatBubble } from '@/components/ui/ChatBubble';
import { Photo } from '@/components/ui/Photo';
import { brands } from '@/content/brands';
import type { Brand } from '@/content/types';
import { cx } from '@/lib/cx';

type Screenshot = {
  brand: Brand;
  /** Where it lies in the pile. */
  placement: string;
  /**
   * The light page under the photo, imitating each brand's website — so these
   * colours deliberately don't come from ClothHub's palette.
   */
  site: {
    page: string;
    title: string;
    subtitle: string;
    button: string;
    roundButton?: boolean;
    /** Widths of the two grey lines standing in for the product title and price. */
    lines: [string, string];
  };
};

const screenshots: Screenshot[] = [
  {
    brand: brands.almirah,
    placement: 'left-0 top-[70px] -rotate-10',
    site: { page: '#f7f4ee', title: '#2a2a2d', subtitle: '#b9b4aa', button: '#1a1a1c', lines: ['82%', '44%'] },
  },
  {
    brand: brands.dhanak,
    placement: 'left-[21%] top-4 rotate-4',
    site: { page: '#ffffff', title: '#2a2a2d', subtitle: '#c9c4ba', button: '#b3263a', lines: ['70%', '36%'] },
  },
  {
    brand: brands.akbarAslam,
    placement: 'left-[42%] top-[92px] -rotate-3',
    site: { page: '#f2f2f2', title: '#2a2a2d', subtitle: '#bdbdbd', button: '#0e4a3a', roundButton: true, lines: ['88%', '50%'] },
  },
  {
    brand: brands.diners,
    placement: 'right-0 top-[30px] rotate-9',
    site: { page: '#faf7f2', title: '#2a2a2d', subtitle: '#c9c4ba', button: '#151414', lines: ['76%', '40%'] },
  },
  {
    brand: brands.oaks,
    placement: 'left-[14%] top-[214px] -rotate-5',
    site: { page: '#ffffff', title: '#2a2a2d', subtitle: '#c9c4ba', button: '#1d2b5c', lines: ['64%', '48%'] },
  },
];

/** Screenshots from five brand websites and the "which one?" chat that follows. */
export function ScreenshotPile() {
  return (
    <figure>
      <figcaption className="sr-only">
        A pile of product screenshots from different brand websites, and a chat asking which one to buy.
      </figcaption>

      <div aria-hidden="true" className="relative mx-auto h-[500px] w-full max-w-[520px]">
        {screenshots.map(({ brand, placement, site }) => (
          <div
            key={brand.name}
            className={cx(
              'absolute h-[264px] w-[150px] overflow-hidden rounded-[18px] border border-white/10 bg-graphite shadow-[0_30px_60px_-20px_rgb(0_0_0/0.9)]',
              placement,
            )}
          >
            <div className="absolute inset-x-0 top-0 h-[74%]">
              <Photo src={brand.cover} sizes="150px" />
            </div>
            <div
              className="absolute inset-x-0 bottom-0 z-2 flex flex-col gap-1.5 px-3 py-3.5"
              style={{ backgroundColor: site.page }}
            >
              <Line width={site.lines[0]} color={site.title} />
              <Line width={site.lines[1]} color={site.subtitle} />
              <span
                className={cx('mt-1 h-4 w-full', site.roundButton ? 'rounded-full' : 'rounded-sm')}
                style={{ backgroundColor: site.button }}
              />
            </div>
          </div>
        ))}

        <div className="absolute right-0 bottom-2 z-10 flex w-[270px] max-w-[78%] flex-col gap-2">
          <ChatBubble from="me" className={pileBubble.me}>
            Which one should I get??
          </ChatBubble>
          <ChatBubble from="them" className={pileBubble.them}>
            The blue one! Which brand is it?
          </ChatBubble>
          <ChatBubble from="me" className={pileBubble.me}>
            …I don’t remember
          </ChatBubble>
        </div>
      </div>
    </figure>
  );
}

const bubbleShadow = 'shadow-[0_16px_40px_-12px_rgb(0_0_0/0.8)]';
const pileBubble = {
  me: cx('max-w-[220px] rounded-[20px_20px_6px_20px] px-4 py-[11px]', bubbleShadow),
  them: cx('max-w-[230px] rounded-[20px_20px_20px_6px] px-4 py-[11px]', bubbleShadow),
};

function Line({ width, color }: { width: string; color: string }) {
  return <span className="h-1.5 rounded-[3px]" style={{ width, backgroundColor: color }} />;
}
