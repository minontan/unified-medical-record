import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import en from '../locales/en.json';
import ms from '../locales/ms.json';
import id from '../locales/id.json';
import th from '../locales/th.json';
import vi from '../locales/vi.json';
import km from '../locales/km.json';
import my from '../locales/my.json';
import zhHans from '../locales/zh-Hans.json';
import zhHant from '../locales/zh-Hant.json';
import ja from '../locales/ja.json';
import ko from '../locales/ko.json';

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en:       { translation: en },
      ms:       { translation: ms },
      id:       { translation: id },
      th:       { translation: th },
      vi:       { translation: vi },
      km:       { translation: km },
      my:       { translation: my },
      'zh-Hans':{ translation: zhHans },
      'zh-Hant':{ translation: zhHant },
      ja:       { translation: ja },
      ko:       { translation: ko },
    },
    fallbackLng: 'en',
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
    },
    interpolation: { escapeValue: false },
  });

export default i18n;