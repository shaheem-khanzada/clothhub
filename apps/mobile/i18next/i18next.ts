import { getLocales } from 'expo-localization';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import en from './locales/en';

export const lng = getLocales()[0]?.languageCode ?? 'en';

i18n
  .use(initReactI18next)
  .init({
    resources: {
      en,
    },
    lng,
    fallbackLng: 'en',

    interpolation: {
      // React already escapes rendered strings.
      escapeValue: false,
    },
  });

export default i18n;
