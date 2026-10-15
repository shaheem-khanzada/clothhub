import { NetworkStateType } from 'expo-network';

import { prefetchBudgetFor } from './usePrefetchBudget';

describe('prefetchBudgetFor', () => {
  it('reaches far ahead on Wi-Fi', () => {
    expect(prefetchBudgetFor({ type: NetworkStateType.WIFI, isConnected: true, isInternetReachable: true })).toEqual({
      productsAhead: 3,
      photosPerProduct: 3,
      nextPageCovers: true,
    });
  });

  it('stays close on mobile data, where photos cost the user money', () => {
    expect(
      prefetchBudgetFor({ type: NetworkStateType.CELLULAR, isConnected: true, isInternetReachable: true }),
    ).toEqual({ productsAhead: 1, photosPerProduct: 2, nextPageCovers: false });
  });

  it('treats a connection it does not know yet as mobile data', () => {
    expect(prefetchBudgetFor({})).toMatchObject({ nextPageCovers: false, productsAhead: 1 });
  });

  it('prefetches nothing offline', () => {
    expect(prefetchBudgetFor({ type: NetworkStateType.WIFI, isConnected: true, isInternetReachable: false })).toEqual({
      productsAhead: 0,
      photosPerProduct: 0,
      nextPageCovers: false,
    });
  });
});
