import { NetworkStateType, useNetworkState, type NetworkState } from 'expo-network';

/**
 * How much to download before the user asks for it. Prefetching makes
 * scrolling feel instant, but on mobile data every photo is the user's money,
 * so the app only reaches far ahead on Wi-Fi.
 */
export type PrefetchBudget = {
  /** Products ahead in the reel whose cover is downloaded early. */
  productsAhead: number;
  /** How many of the current reel product's photos are loaded, counting the one on screen. */
  photosPerProduct: number;
  /** Download the next grid page's covers as soon as the page arrives. */
  nextPageCovers: boolean;
};

const GENEROUS: PrefetchBudget = { productsAhead: 3, photosPerProduct: 3, nextPageCovers: true };
const LEAN: PrefetchBudget = { productsAhead: 1, photosPerProduct: 2, nextPageCovers: false };
const NONE: PrefetchBudget = { productsAhead: 0, photosPerProduct: 0, nextPageCovers: false };

export function prefetchBudgetFor(state: NetworkState): PrefetchBudget {
  if (state.isConnected === false || state.isInternetReachable === false) {
    return NONE;
  }

  if (state.type === NetworkStateType.WIFI || state.type === NetworkStateType.ETHERNET) {
    return GENEROUS;
  }

  // Cellular, or not known yet: assume the user pays for data.
  return LEAN;
}

export function usePrefetchBudget(): PrefetchBudget {
  return prefetchBudgetFor(useNetworkState());
}
