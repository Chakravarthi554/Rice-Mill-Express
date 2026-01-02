import React, { createContext, useContext, useState, useEffect } from 'react';

const I18nContext = createContext();

export const useI18n = () => {
    const context = useContext(I18nContext);
    if (!context) {
        throw new Error('useI18n must be used within I18nProvider');
    }
    return context;
};

// Translation dictionaries
const translations = {
    english: {
        // Common
        welcome: 'Welcome',
        dashboard: 'Dashboard',
        myOrders: 'My Orders',
        wishlist: 'Wishlist',
        cart: 'Cart',
        profile: 'Profile',
        settings: 'Settings',
        logout: 'Logout',

        // Products
        products: 'Products',
        addToCart: 'Add to Cart',
        buyNow: 'Buy Now',
        price: 'Price',
        quantity: 'Quantity',

        // Orders
        orderPlaced: 'Order Placed',
        orderStatus: 'Order Status',
        trackOrder: 'Track Order',
        cancelOrder: 'Cancel Order',

        // Settings
        language: 'Language',
        theme: 'Theme',
        notifications: 'Notifications',
        privacy: 'Privacy',
        security: 'Security'
    },
    hindi: {
        welcome: 'स्वागत है',
        dashboard: 'डैशबोर्ड',
        myOrders: 'मेरे ऑर्डर',
        wishlist: 'इच्छा सूची',
        cart: 'कार्ट',
        profile: 'प्रोफ़ाइल',
        settings: 'सेटिंग्स',
        logout: 'लॉग आउट',

        products: 'उत्पाद',
        addToCart: 'कार्ट में जोड़ें',
        buyNow: 'अभी खरीदें',
        price: 'कीमत',
        quantity: 'मात्रा',

        orderPlaced: 'ऑर्डर दिया गया',
        orderStatus: 'ऑर्डर की स्थिति',
        trackOrder: 'ऑर्डर ट्रैक करें',
        cancelOrder: 'ऑर्डर रद्द करें',

        language: 'भाषा',
        theme: 'थीम',
        notifications: 'सूचनाएं',
        privacy: 'गोपनीयता',
        security: 'सुरक्षा'
    },
    tamil: {
        welcome: 'வரவேற்கிறோம்',
        dashboard: 'டாஷ்போர்டு',
        myOrders: 'என் ஆர்டர்கள்',
        wishlist: 'விருப்பப்பட்டியல்',
        cart: 'கார்ட்',
        profile: 'சுயவிவரம்',
        settings: 'அமைப்புகள்',
        logout: 'வெளியேறு',

        products: 'தயாரிப்புகள்',
        addToCart: 'கார்ட்டில் சேர்',
        buyNow: 'இப்போது வாங்கவும்',
        price: 'விலை',
        quantity: 'அளவு',

        orderPlaced: 'ஆர்டர் செய்யப்பட்டது',
        orderStatus: 'ஆர்டர் நிலை',
        trackOrder: 'ஆர்டரைக் கண்காணிக்கவும்',
        cancelOrder: 'ஆர்டரை ரத்து செய்',

        language: 'மொழி',
        theme: 'தீம்',
        notifications: 'அறிவிப்புகள்',
        privacy: 'தனியுரிமை',
        security: 'பாதுகாப்பு'
    },
    telugu: {
        welcome: 'స్వాగతం',
        dashboard: 'డాష్‌బోర్డ్',
        myOrders: 'నా ఆర్డర్లు',
        wishlist: 'కోరికల జాబితా',
        cart: 'కార్ట్',
        profile: 'ప్రొఫైల్',
        settings: 'సెట్టింగ్‌లు',
        logout: 'లాగ్ అవుట్',

        products: 'ఉత్పత్తులు',
        addToCart: 'కార్ట్‌కు జోడించండి',
        buyNow: 'ఇప్పుడే కొనండి',
        price: 'ధర',
        quantity: 'పరిమాణం',

        orderPlaced: 'ఆర్డర్ చేయబడింది',
        orderStatus: 'ఆర్డర్ స్థితి',
        trackOrder: 'ఆర్డర్‌ను ట్రాక్ చేయండి',
        cancelOrder: 'ఆర్డర్‌ను రద్దు చేయండి',

        language: 'భాష',
        theme: 'థీమ్',
        notifications: 'నోటిఫికేషన్‌లు',
        privacy: 'గోప్యత',
        security: 'భద్రత'
    }
};

export const I18nProvider = ({ children }) => {
    const [language, setLanguage] = useState(() => {
        const saved = localStorage.getItem('rice-mill-language');
        return saved || 'english';
    });

    const [region, setRegion] = useState(() => {
        const saved = localStorage.getItem('rice-mill-region');
        return saved || 'IN';
    });

    const [currency, setCurrency] = useState(() => {
        const saved = localStorage.getItem('rice-mill-currency');
        return saved || 'INR';
    });

    useEffect(() => {
        localStorage.setItem('rice-mill-language', language);
        localStorage.setItem('rice-mill-region', region);
        localStorage.setItem('rice-mill-currency', currency);

        // Update document language attribute
        document.documentElement.lang = language === 'english' ? 'en' :
            language === 'hindi' ? 'hi' :
                language === 'tamil' ? 'ta' : 'te';
    }, [language, region, currency]);

    const t = (key) => {
        return translations[language]?.[key] || translations.english[key] || key;
    };

    const changeLanguage = (newLanguage) => {
        if (translations[newLanguage]) {
            setLanguage(newLanguage);
        }
    };

    const changeRegion = (newRegion) => {
        setRegion(newRegion);
    };

    const changeCurrency = (newCurrency) => {
        setCurrency(newCurrency);
    };

    // Exchange rates (Base: INR)
    const exchangeRates = {
        INR: 1,
        USD: 0.012,
        GBP: 0.0095,
        EUR: 0.011,
        AUD: 0.018 // approx
    };

    const formatCurrency = (amount) => {
        const rate = exchangeRates[currency] || 1;
        const convertedAmount = amount * rate;

        return new Intl.NumberFormat(region === 'IN' ? 'en-IN' : 'en-US', {
            style: 'currency',
            currency: currency,
            maximumFractionDigits: 2
        }).format(convertedAmount);
    };

    const value = {
        language,
        region,
        currency,
        t,
        changeLanguage,
        changeRegion,
        changeCurrency,
        formatCurrency,
        availableLanguages: Object.keys(translations)
    };

    return (
        <I18nContext.Provider value={value}>
            {children}
        </I18nContext.Provider>
    );
};

export default I18nContext;
