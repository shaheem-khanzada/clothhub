import { render, screen } from '@testing-library/react-native';

import { DiscountBadge } from './DiscountBadge';
import { PriceLine } from './PriceLine';

describe('PriceLine', () => {
  it('shows the price the way Pakistani shops print it', async () => {
    await render(<PriceLine price={5620} compareAtPrice={null} />);

    expect(screen.getByText('Rs 5,620')).toBeOnTheScreen();
  });

  it('shows the pre-sale price next to a discounted one', async () => {
    await render(<PriceLine price={4490} compareAtPrice={8990} />);

    expect(screen.getByText('Rs 4,490')).toBeOnTheScreen();
    expect(screen.getByText('Rs 8,990')).toBeOnTheScreen();
  });
});

describe('DiscountBadge', () => {
  it('shows the percentage off', async () => {
    await render(<DiscountBadge percent={25} />);

    expect(screen.getByText('25% OFF')).toBeOnTheScreen();
  });
});
