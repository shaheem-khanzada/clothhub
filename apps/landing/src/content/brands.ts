import akbarAslam from '@/assets/brands/akbar-aslam.jpg';
import almirah from '@/assets/brands/almirah.jpg';
import amnaIsmail from '@/assets/brands/amna-ismail.jpg';
import dhanak from '@/assets/brands/dhanak.jpg';
import diners from '@/assets/brands/diners.jpg';
import elan from '@/assets/brands/elan.jpg';
import emaanAdeel from '@/assets/brands/emaan-adeel.jpg';
import faizaFaisal from '@/assets/brands/faiza-faisal.jpg';
import generation from '@/assets/brands/generation.jpg';
import gulaal from '@/assets/brands/gulaal.jpg';
import jazmin from '@/assets/brands/jazmin.jpg';
import motifz from '@/assets/brands/motifz.jpg';
import oaks from '@/assets/brands/oaks.jpg';
import rajbari from '@/assets/brands/rajbari.jpg';
import republicWomenswear from '@/assets/brands/republic-womenswear.jpg';
import sanaSafinaz from '@/assets/brands/sana-safinaz.jpg';
import tenaDurrani from '@/assets/brands/tena-durrani.jpg';
import neelum from '@/assets/products/neelum.jpg';

import type { Brand } from './types';

/**
 * Brands with their cover photos and product counts, from the API's
 * /v1/brands (16 Oct 2026).
 */
export const brands = {
  elan: { name: 'Élan', productCount: 1_044, cover: elan },
  // The API uses Neelum as Hussain Rehar's cover photo.
  hussainRehar: {
    name: 'Hussain Rehar',
    productCount: 1_941,
    cover: neelum,
    coverPosition: '50% 15%',
  },
  amnaIsmail: { name: 'Amna Ismail', productCount: 219, cover: amnaIsmail },
  tenaDurrani: { name: 'Tena Durrani', productCount: 90, cover: tenaDurrani },
  sanaSafinaz: { name: 'Sana Safinaz', productCount: 1_799, cover: sanaSafinaz },
  emaanAdeel: { name: 'Emaan Adeel', productCount: 426, cover: emaanAdeel },
  rajbari: { name: 'Rajbari', productCount: 260, cover: rajbari },
  faizaFaisal: { name: 'Faiza Faisal', productCount: 334, cover: faizaFaisal },
  generation: { name: 'Generation', productCount: 7_179, cover: generation },
  gulaal: { name: 'Gulaal', productCount: 382, cover: gulaal },
  motifz: { name: 'Motifz', productCount: 4_151, cover: motifz },
  jazmin: { name: 'Jazmin', productCount: 598, cover: jazmin },
  republicWomenswear: { name: 'Republic Womenswear', productCount: 1_331, cover: republicWomenswear },
  almirah: { name: 'Almirah', productCount: 5_145, cover: almirah },
  dhanak: { name: 'Dhanak', productCount: 1_364, cover: dhanak },
  diners: { name: 'Diners', productCount: 951, cover: diners },
  akbarAslam: { name: 'Akbar Aslam', productCount: 345, cover: akbarAslam },
  oaks: { name: 'Oaks', productCount: 954, cover: oaks },
} satisfies Record<string, Brand>;

/** The scrolling row of brand cards, in order. */
export const featuredBrands: Brand[] = [
  brands.elan,
  brands.hussainRehar,
  brands.amnaIsmail,
  brands.tenaDurrani,
  brands.sanaSafinaz,
  brands.emaanAdeel,
  brands.rajbari,
  brands.faizaFaisal,
  brands.generation,
  brands.gulaal,
  brands.motifz,
  brands.jazmin,
  brands.republicWomenswear,
];
