import { ref } from 'vue';
import i18next from 'i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import { createI18n } from 'i18next-vue';
import en from '../locales/en.json';
import fr from '../locales/fr.json';
import es from '../locales/es.json';
import enLocale from 'element-plus/es/locale/lang/en';
import frLocale from 'element-plus/es/locale/lang/fr';
import esLocale from 'element-plus/es/locale/lang/es';

const elementLocales = { en: enLocale, fr: frLocale, es: esLocale };
export const elementLocale = ref(enLocale);

i18next
  .use(LanguageDetector)
  .init({
    resources: {
      en: { translation: en },
      fr: { translation: fr },
      es: { translation: es }
    },
    fallbackLng: 'en',
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage']
    }
  });

elementLocale.value = elementLocales[i18next.language] || enLocale;

i18next.on('languageChanged', (lng) => {
  elementLocale.value = elementLocales[lng] || enLocale;
  if (window?.electronAPI?.sendLanguage) {
    window.electronAPI.sendLanguage(lng);
  }
});

export function setupI18n(app) {
  app.use(createI18n(i18next));
}

export function formatDate(date) {
  return new Intl.DateTimeFormat(i18next.language).format(date);
}

export function formatNumber(number) {
  return new Intl.NumberFormat(i18next.language).format(number);
}
