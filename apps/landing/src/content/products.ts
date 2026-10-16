import evora from '@/assets/products/evora.jpg';
import fervor from '@/assets/products/fervor.jpg';
import goharAra from '@/assets/products/gohar-ara.jpg';
import gulrang from '@/assets/products/gulrang.jpg';
import gulrukh from '@/assets/products/gulrukh.jpg';
import hikari from '@/assets/products/hikari.jpg';
import kinako from '@/assets/products/kinako.jpg';
import mehru from '@/assets/products/mehru.jpg';
import mehtab from '@/assets/products/mehtab.jpg';
import neelum from '@/assets/products/neelum.jpg';
import rin from '@/assets/products/rin.jpg';
import sakura from '@/assets/products/sakura.jpg';
import shabnam from '@/assets/products/shabnam.jpg';
import shahnoor from '@/assets/products/shahnoor.jpg';
import sherBano from '@/assets/products/sher-bano.jpg';
import yuhi from '@/assets/products/yuhi.jpg';
import yuki from '@/assets/products/yuki.jpg';
import yume from '@/assets/products/yume.jpg';
import zeenat from '@/assets/products/zeenat.jpg';

import type { Product } from './types';

const HUSSAIN_REHAR = 'Hussain Rehar';

/**
 * Real pieces from the catalogue (the API's Hussain Rehar product list, 16 Oct
 * 2026). Photos are the first image of each, resized to 800px wide.
 *
 * To feature another piece: add its photo under src/assets/products, add an
 * entry here, and use it in a section.
 */
export const products = {
  neelum: {
    name: 'Neelum',
    brand: HUSSAIN_REHAR,
    price: 45_900,
    image: neelum,
    url: 'https://hussainrehar.com/products/neelum',
    colour: 'Midnight Blue',
  },
  sherBano: {
    name: 'Sher Bano',
    brand: HUSSAIN_REHAR,
    price: 33_900,
    image: sherBano,
    url: 'https://hussainrehar.com/products/sher-bano',
    colour: 'Fuchsia Pink',
  },
  mehtab: {
    name: 'Mehtab',
    brand: HUSSAIN_REHAR,
    price: 49_900,
    image: mehtab,
    url: 'https://hussainrehar.com/products/mehtab',
    colour: 'Ice Blue',
  },
  sakura: {
    name: 'Sakura',
    brand: HUSSAIN_REHAR,
    price: 147_900,
    image: sakura,
    url: 'https://hussainrehar.com/products/sakura-1',
    colour: 'Hot Pink',
  },
  rin: {
    name: 'Rin',
    brand: HUSSAIN_REHAR,
    price: 155_000,
    image: rin,
    url: 'https://hussainrehar.com/products/rin',
    colour: 'Emerald Green',
    fabric: 'Raw Silk',
    sizes: [
      { label: 'XS', inStock: true },
      { label: 'S', inStock: true },
      { label: 'M', inStock: true },
      { label: 'L', inStock: true },
    ],
    description:
      'Emerald green raw silk panelled shirt with a corner-drop silhouette and hand embellishment.',
  },
  yume: {
    name: 'Yume',
    brand: HUSSAIN_REHAR,
    price: 149_000,
    image: yume,
    url: 'https://hussainrehar.com/products/yume',
    colour: 'Rose Gold',
  },
  evora: {
    name: 'Evora',
    brand: HUSSAIN_REHAR,
    price: 20_900,
    image: evora,
    url: 'https://hussainrehar.com/products/evora',
    colour: 'Ivory, Royal Blue and Red',
  },
  zeenat: {
    name: 'Zeenat',
    brand: HUSSAIN_REHAR,
    price: 44_900,
    image: zeenat,
    url: 'https://hussainrehar.com/products/zeenat-1',
    colour: 'Aqua Green',
  },
  mehru: {
    name: 'Mehru',
    brand: HUSSAIN_REHAR,
    price: 45_900,
    image: mehru,
    url: 'https://hussainrehar.com/products/mehru',
    colour: 'Mustard',
  },
  gulrang: {
    name: 'Gulrang',
    brand: HUSSAIN_REHAR,
    price: 34_900,
    image: gulrang,
    url: 'https://hussainrehar.com/products/gulrang',
    colour: 'Lilac',
  },
  shabnam: {
    name: 'Shabnam',
    brand: HUSSAIN_REHAR,
    price: 43_900,
    image: shabnam,
    url: 'https://hussainrehar.com/products/shabnam',
    colour: 'Plum',
  },
  shahnoor: {
    name: 'Shahnoor',
    brand: HUSSAIN_REHAR,
    price: 44_900,
    image: shahnoor,
    url: 'https://hussainrehar.com/products/shahnoor',
    colour: 'Black',
  },
  goharAra: {
    name: 'Gohar-Ara',
    brand: HUSSAIN_REHAR,
    price: 39_900,
    image: goharAra,
    url: 'https://hussainrehar.com/products/gohar-ara',
    colour: 'Powder Peach',
  },
  hikari: {
    name: 'Hikari',
    brand: HUSSAIN_REHAR,
    price: 160_000,
    image: hikari,
    url: 'https://hussainrehar.com/products/hikari',
    colour: 'Sunny Lime Green',
  },
  yuhi: {
    name: 'Yuhi',
    brand: HUSSAIN_REHAR,
    price: 145_000,
    image: yuhi,
    url: 'https://hussainrehar.com/products/yuhi',
    colour: 'Rust',
  },
  kinako: {
    name: 'Kinako',
    brand: HUSSAIN_REHAR,
    price: 162_900,
    image: kinako,
    url: 'https://hussainrehar.com/products/kinako',
    colour: 'Beige',
  },
  fervor: {
    name: 'Fervor',
    brand: HUSSAIN_REHAR,
    price: 21_900,
    image: fervor,
    url: 'https://hussainrehar.com/products/fervor',
    colour: 'Fuchsia Pink',
  },
  yuki: {
    name: 'Yuki',
    brand: HUSSAIN_REHAR,
    price: 115_000,
    image: yuki,
    url: 'https://hussainrehar.com/products/yuki-1',
    colour: 'Ivory',
  },
  gulrukh: {
    name: 'Gulrukh',
    brand: HUSSAIN_REHAR,
    price: 36_900,
    image: gulrukh,
    url: 'https://hussainrehar.com/products/gulrukh-1',
    colour: 'Powder Pink',
  },
} satisfies Record<string, Product>;
