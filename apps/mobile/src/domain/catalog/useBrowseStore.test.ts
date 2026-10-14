import { act, renderHook } from '@testing-library/react-native';

import { DEFAULT_FILTERS } from './filters';
import { useBrowseParams, useBrowseStore } from './useBrowseStore';

beforeEach(() => {
  useBrowseStore.setState({ byBrand: {} });
});

describe('useBrowseStore', () => {
  it('starts every brand from the default view', async () => {
    const { result } = await renderHook(() => useBrowseParams('brand-1'));

    expect(result.current).toEqual({ brandId: 'brand-1', sort: 'featured', filters: DEFAULT_FILTERS, search: '' });
  });

  it('remembers sort, filters and search per brand', async () => {
    const { result: first } = await renderHook(() => useBrowseParams('brand-1'));
    const { result: second } = await renderHook(() => useBrowseParams('brand-2'));

    await act(async () => {
      const store = useBrowseStore.getState();
      store.setSort('brand-1', 'priceAsc');
      store.setFilters('brand-1', { ...DEFAULT_FILTERS, onSaleOnly: true });
      store.setSearch('brand-1', 'lawn');
    });

    expect(first.current).toMatchObject({ sort: 'priceAsc', search: 'lawn', filters: { onSaleOnly: true } });
    expect(second.current).toMatchObject({ sort: 'featured', search: '', filters: DEFAULT_FILTERS });
  });
});
