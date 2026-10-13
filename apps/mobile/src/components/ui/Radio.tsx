import { StyleSheet, View } from 'react-native';

import { useTheme } from '@/hooks/useTheme';

type RadioProps = {
  selected: boolean;
};

export function Radio({ selected }: RadioProps) {
  const theme = useTheme();

  return (
    <View
      style={[
        styles.outer,
        { borderColor: selected ? theme.text : theme.textTertiary },
      ]}
    >
      {selected ? (
        <View style={[styles.inner, { backgroundColor: theme.text }]} />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  outer: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },

  inner: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
});
