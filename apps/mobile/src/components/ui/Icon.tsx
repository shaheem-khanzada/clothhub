import type { SvgProps } from 'react-native-svg';

import CheckOutline from '@/assets/icons/check.outline.svg';
import ChevronDownOutline from '@/assets/icons/chevron.down.outline.svg';
import ChevronLeftOutline from '@/assets/icons/chevron.left.outline.svg';
import ChevronRightOutline from '@/assets/icons/chevron.right.outline.svg';
import CloseOutline from '@/assets/icons/close.outline.svg';
import DetailsOutline from '@/assets/icons/details.outline.svg';
import FilterOutline from '@/assets/icons/filter.outline.svg';
import HeartFill from '@/assets/icons/heart.fill.svg';
import HeartOutline from '@/assets/icons/heart.outline.svg';
import MoreOutline from '@/assets/icons/more.outline.svg';
import OpenFill from '@/assets/icons/open.fill.svg';
import OpenOutline from '@/assets/icons/open.outline.svg';
import SearchOutline from '@/assets/icons/search.outline.svg';
import ShareFill from '@/assets/icons/share.fill.svg';
import ShareOutline from '@/assets/icons/share.outline.svg';
import SortOutline from '@/assets/icons/sort.outline.svg';
import SwipeDownOutline from '@/assets/icons/swipe.down.outline.svg';
import SwipeHorizontalOutline from '@/assets/icons/swipe.horizontal.outline.svg';
import SwipeUpOutline from '@/assets/icons/swipe.up.outline.svg';
import TagOutline from '@/assets/icons/tag.outline.svg';

export const icons = {
  'check.outline': CheckOutline,

  'chevron.down.outline': ChevronDownOutline,
  'chevron.left.outline': ChevronLeftOutline,
  'chevron.right.outline': ChevronRightOutline,

  'close.outline': CloseOutline,
  'details.outline': DetailsOutline,
  'filter.outline': FilterOutline,
  'heart.fill': HeartFill,
  'heart.outline': HeartOutline,
  'more.outline': MoreOutline,
  'open.fill': OpenFill,
  'open.outline': OpenOutline,
  'search.outline': SearchOutline,
  'share.fill': ShareFill,
  'share.outline': ShareOutline,
  'sort.outline': SortOutline,

  'swipe.down.outline': SwipeDownOutline,
  'swipe.horizontal.outline': SwipeHorizontalOutline,
  'swipe.up.outline': SwipeUpOutline,

  'tag.outline': TagOutline,
} as const;

export type IconName = keyof typeof icons;

type IconProps = Omit<SvgProps, 'width' | 'height'> & {
  name: IconName;
  size?: number;
};

export function Icon({
  name,
  size = 24,
  color,
  ...props
}: IconProps) {
  const SvgIcon = icons[name];

  return (
    <SvgIcon
      width={size}
      height={size}
      color={color}
      {...props}
    />
  );
}
