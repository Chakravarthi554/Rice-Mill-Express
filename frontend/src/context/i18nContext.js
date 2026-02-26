import React, { createContext, useContext, useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import i18n from '../i18n';

const I18nContext = createContext();

export const useI18n = () => {
    const context = useContext(I18nContext);
    if (!context) {
        throw new Error('useI18n must be used within I18nProvider');
    }
    return context;
};


// Translation logic handled by i18next
export const I18nProvider = ({ children }) => {
    const { t } = useTranslation();
    const [language, setLanguage] = useState(i18n.language || 'english');

    useEffect(() => {
        const handleLanguageChange = (lng) => {
            setLanguage(lng);
            localStorage.setItem('rice-mill-language', lng);
            document.documentElement.lang = lng === 'english' ? 'en' :
                lng === 'hindi' ? 'hi' :
                    lng === 'tamil' ? 'ta' : 'te';
        };

        i18n.on('languageChanged', handleLanguageChange);
        return () => {
            i18n.off('languageChanged', handleLanguageChange);
        };
    }, []);

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 2
        }).format(amount);
    };

    const changeLanguage = (newLanguage) => {
        i18n.changeLanguage(newLanguage);
    };

    const value = {
        language,
        t,
        changeLanguage,
        formatCurrency,
        availableLanguages: ['english', 'hindi', 'tamil', 'telugu']
    };

    return (
        <I18nContext.Provider value={value}>
            {children}
        </I18nContext.Provider>
    );
};

export default I18nContext;
