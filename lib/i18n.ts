import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import case_01 from '../public/locales/en/case_01.json';

i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: {
        case_01: case_01
      }
    },
    lng: 'en', // default language
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false // react already safes from xss
    }
  });

export default i18n;
