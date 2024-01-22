import en from './languages/en.json';
import { createInstance } from 'i18next';
import { initReactI18next } from 'react-i18next';

const resources = {
  en: {
    translation: { ...en }
  }
};

const i18n = createInstance({
  fallbackLng: 'en',
  debug: process.env.NODE_ENV === 'development',
  interpolation: {
    escapeValue: false
  },
  resources
});

i18n.use(initReactI18next).init();

export default i18n;
