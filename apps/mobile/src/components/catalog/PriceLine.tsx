import { StyleSheet } from 'react-native';

import { HStack } from '@/components/ui/HStack';
import { Text } from '@/components/ui/Text';
import { Typography, type TypographyToken } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import { formatPrice } from '@/lib/formatters';

type PriceLineProps = {
  price: number;
  compareAtPrice: number | null;
  /** The current price's text style; the struck-through price scales down from it. */
  size?: Extract<TypographyToken, 'subhead_15_bold' | 'title_20_semibold'>;
};

/** "Rs 5,620  ~~Rs 7,490~~" */
export function PriceLine({
  price,
  compareAtPrice,
  size = 'subhead_15_bold',
}: PriceLineProps) {
  const theme = useTheme();
  const isLarge = size === 'title_20_semibold';

  return (
    <HStack alignItems="baseline" space="two">
      <Text style={Typography[size]}>
        {formatPrice(price)}
      </Text>

      {compareAtPrice ? (
        <Text
          style={[
            isLarge ? Typography.subhead_15_regular : Typography.footnote_13_regular,
            styles.struck,
            { color: theme.textTertiary },
          ]}
        >
          {formatPrice(compareAtPrice)}
        </Text>
      ) : null}
    </HStack>
  );
}

const styles = StyleSheet.create({
  struck: {
    textDecorationLine: 'line-through',
  },
});
