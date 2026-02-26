import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './translations/en.json';
import hi from './translations/hi.json';
import te from './translations/te.json';
import ta from './translations/ta.json';

const LANGUAGE_KEY = 'rice-mill-language';

i18n
    .use(initReactI18next)
    .init({
        resources: {
            english: { translation: en },
            hindi: { translation: hi },
            telugu: { translation: te },
            tamil: { translation: ta },
        },
        lng: localStorage.getItem(LANGUAGE_KEY) || 'english',
        fallbackLng: 'english',
        interpolation: {
            escapeValue: false,
        },
    });

export default i18n;
