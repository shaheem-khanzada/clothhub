import type { BrandAudience } from '../../db/schema/index.js';

/*
 * Brand curation. The scraper names brands after their domain
 * ("Junaidjamshed", "Pk" for Ethnc), so ClothHub keeps its own names here,
 * keyed by the shop's host name — stable even if the scraper re-adds a brand
 * under a new id.
 *
 * - `audience` overrides the audience measured from the brand's products,
 *   for brands whose products rarely say who they are for.
 * - `currency` marks shops priced in something other than PKR. Those brands
 *   are hidden until the app can show other currencies.
 */

export type BrandCuration = {
  name: string;
  audience?: BrandAudience;
  currency?: string;
};

export const BRAND_CURATION: Record<string, BrandCuration> = {
  'aabyaan.com': { name: 'Aabyaan' },
  'afrozeh.com': { name: 'Afrozeh' },
  'aik.store': { name: 'AIK' },
  'akbaraslam.com': { name: 'Akbar Aslam' },
  'alayajunior.com': { name: 'Alaya Junior', audience: 'kids' },
  'alkaramstudio.com': { name: 'Alkaram Studio' },
  'almirah.com.pk': { name: 'Almirah' },
  'alzohaibstore.com': { name: 'Al Zohaib' },
  'amiradnan.com': { name: 'Amir Adnan', audience: 'men' },
  'ammarakhan.com': { name: 'Ammara Khan' },
  'amnaismail.com': { name: 'Amna Ismail' },
  'asifaandnabeel.com': { name: 'Asifa & Nabeel' },
  'asimjofa.com': { name: 'Asim Jofa' },
  'azure.pk': { name: 'Azure' },
  'baroque.pk': { name: 'Baroque' },
  'beechtree.pk': { name: 'Beechtree' },
  'binilyas.com': { name: 'Bin Ilyas' },
  'bonanzasatrangi.com': { name: 'Bonanza Satrangi' },
  'breakout.com.pk': { name: 'Breakout' },
  'charcoal.com.pk': { name: 'Charcoal', audience: 'men' },
  'cherryberry.com.pk': { name: 'Cherry Berry', audience: 'kids' },
  'cocobee.com.pk': { name: 'Cocobee', audience: 'kids' },
  'crimson.com.pk': { name: 'Crimson' },
  'crossstitch.pk': { name: 'Cross Stitch' },
  'dhanak.com.pk': { name: 'Dhanak' },
  'diners.com.pk': { name: 'Diners' },
  'edenrobe.com': { name: 'Edenrobe' },
  'elan.pk': { name: 'Élan' },
  'emaanadeel.com': { name: 'Emaan Adeel' },
  'engine.com.pk': { name: 'Engine' },
  'equatorstores.com': { name: 'Equator', audience: 'men' },
  'faizafaisal.com': { name: 'Faiza Faisal' },
  'faizasaqlain.pk': { name: 'Faiza Saqlain' },
  'furorjeans.com': { name: 'Furor', audience: 'men' },
  'generation.com.pk': { name: 'Generation' },
  'gulaal.pk': { name: 'Gulaal' },
  'gulahmedshop.com': { name: 'Gul Ahmed' },
  'hijahwear.com': { name: 'Hijah Wear' },
  'houseofcharizma.com': { name: 'Charizma' },
  'hussainrehar.com': { name: 'Hussain Rehar' },
  'iznikfashions.com': { name: 'Iznik' },
  'jazmin.pk': { name: 'Jazmin' },
  'junaidjamshed.com': { name: 'J.' },
  'kanwalmalik.com': { name: 'Kanwal Malik' },
  'khasstores.com': { name: 'Khas' },
  'krosskulture.com': { name: 'Kross Kulture' },
  'lakhanyonline.com': { name: 'Lakhany' },
  'laylachatoor.com': { name: 'Layla Chatoor' },
  'limelight.pk': { name: 'Limelight' },
  'lulusar.com': { name: 'Lulusar' },
  'manara.pk': { name: 'Manara' },
  'mariab.pk': { name: 'Maria.B' },
  'mausummery.com': { name: 'Mausummery' },
  'minnieminors.com': { name: 'Minnie Minors', audience: 'kids' },
  'mishalakhani.com': { name: 'Misha Lakhani', currency: 'USD' },
  'mohagni.com': { name: 'Mohagni' },
  'monark.com.pk': { name: 'Monark' },
  'motifz.com.pk': { name: 'Motifz' },
  'natashakamal.com': { name: 'Natasha Kamal' },
  'nidaazwer.com': { name: 'Nida Azwer', currency: 'USD' },
  'nilofershahidofficial.com': { name: 'Nilofer Shahid' },
  'nishatlinen.com': { name: 'Nishat Linen' },
  'nureh.pk': { name: 'Nureh' },
  'oaks.pk': { name: 'Oaks' },
  'outfitters.com.pk': { name: 'Outfitters' },
  'panacheapparels.com': { name: 'Panache', currency: 'USD' },
  'pk.ethnc.com': { name: 'Ethnc' },
  'qalamkar.com.pk': { name: 'Qalamkar' },
  'rajbari.pk': { name: 'Rajbari' },
  'ramsha.pk': { name: 'Ramsha' },
  'rangrasiya.com.pk': { name: 'Rang Rasiya', currency: 'USD' },
  'rastah.co': { name: 'Rastah', currency: 'USD' },
  'republicwomenswear.com': { name: 'Republic Womenswear', audience: 'women' },
  'riwajmenswear.com': { name: 'Riwaj', audience: 'men' },
  'rollover.com.pk': { name: 'Rollover', audience: 'kids' },
  'royaltag.com.pk': { name: 'Royal Tag', audience: 'men' },
  'saadiaasad.com': { name: 'Saadia Asad' },
  'salitexonline.com': { name: 'Salitex' },
  'sanasafinaz.com': { name: 'Sana Safinaz' },
  'saniamaskatiya.com': { name: 'Sania Maskatiya', currency: 'USD' },
  'saya.pk': { name: 'Saya' },
  'sefam.com': { name: 'Sefam' },
  'seran.com.pk': { name: 'Seran' },
  'shahzebsaeed.com': { name: 'Shahzeb Saeed', audience: 'men' },
  'shizahassan.com': { name: 'Shiza Hassan' },
  'sitarastudio.pk': { name: 'Sitara Studio' },
  'sobianazir.net': { name: 'Sobia Nazir' },
  'sokamal.com': { name: 'So Kamal' },
  'suffuse.pk': { name: 'Suffuse', currency: 'USD' },
  'tenadurrani.com': { name: 'Tena Durrani' },
  'thecambridgeshop.com': { name: 'Cambridge', audience: 'men' },
  'uniworthshop.com': { name: 'Uniworth', audience: 'men' },
  'waniya.pk': { name: 'Waniya' },
  'zaaviay.com': { name: 'Zaaviay', currency: 'USD' },
  'zainabchottani.com': { name: 'Zainab Chottani', currency: 'USD' },
  'zarashahjahan.com': { name: 'Zara Shahjahan' },
  'zarif.pk': { name: 'Zarif' },
  'zeenwoman.com': { name: 'Zeen' },
  'zellbury.com': { name: 'Zellbury' },
};

/** "https://www.Saya.pk/" → "saya.pk". */
export function hostOf(url: string): string {
  try {
    return new URL(url).hostname.toLowerCase().replace(/^www\./, '');
  } catch {
    return url.toLowerCase().replace(/^https?:\/\//, '').replace(/^www\./, '').replace(/\/.*$/, '');
  }
}

/** "Sana Safinaz" → "sana-safinaz", "Maria.B" → "maria-b", "Élan" → "elan". */
export function slugify(value: string): string {
  return value
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/** A readable name for a brand we have not curated yet: "zeenwoman.com" → "Zeenwoman". */
export function fallbackName(scraperName: string, host: string): string {
  const base = scraperName.trim() || host.split('.')[0] || host;

  return base.charAt(0).toUpperCase() + base.slice(1);
}
