import * as WebBrowser from 'expo-web-browser';
import { Share } from 'react-native';

import type { Product } from '@/domain/catalog/types';
import { formatPrice } from '@/lib/formatters';

type Translate = (key: string, options?: Record<string, string | number>) => string;

/**
 * Opens the system share sheet — WhatsApp, Messages, Instagram, Save Image —
 * with a message that still makes sense where the app is not installed.
 */
export async function shareProduct(product: Product, t: Translate) {
  const message = t('catalog.reel.shareMessage', {
    name: product.name,
    brand: product.brandName,
    price: formatPrice(product.price),
    link: product.link,
  });

  try {
    await Share.share({ message });
  } catch (error) {
    console.warn('[reel] share failed', error);
  }
}

/** The brand's own page for the product, in an in-app browser. */
export async function openInBrowser(url: string) {
  try {
    await WebBrowser.openBrowserAsync(url, {
      presentationStyle: WebBrowser.WebBrowserPresentationStyle.PAGE_SHEET,
      controlsColor: '#FFFFFF',
      toolbarColor: '#0B0B0C',
    });
  } catch (error) {
    console.warn('[reel] could not open the brand website', error);
  }
}
