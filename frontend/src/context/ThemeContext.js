import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error('useTheme must be used within ThemeProvider');
    }
    return context;
};

export const ThemeProvider = ({ children }) => {
    // Load saved preferences from localStorage
    const [theme, setTheme] = useState(() => {
        const saved = localStorage.getItem('rice-mill-theme');
        return saved || 'light';
    });

    const [highContrast, setHighContrast] = useState(() => {
        const saved = localStorage.getItem('rice-mill-high-contrast');
        return saved ? parseInt(saved) : 0;
    });

    const [textSize, setTextSize] = useState(() => {
        const saved = localStorage.getItem('rice-mill-text-size');
        return saved ? parseInt(saved) : 16;
    });

    // Apply theme to document root
    useEffect(() => {
        const root = document.documentElement;

        // Theme mode
        if (theme === 'dark') {
            root.classList.add('dark-mode');
            root.classList.remove('light-mode');
        } else if (theme === 'light') {
            root.classList.add('light-mode');
            root.classList.remove('dark-mode');
        } else {
            // System preference
            const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            root.classList.toggle('dark-mode', prefersDark);
            root.classList.toggle('light-mode', !prefersDark);
        }

        // High contrast
        root.style.setProperty('--contrast-level', highContrast);
        if (highContrast > 50) {
            root.classList.add('high-contrast');
        } else {
            root.classList.remove('high-contrast');
        }

        // Text size
        root.style.setProperty('--base-font-size', `${textSize}px`);
        root.style.fontSize = `${textSize}px`;

        // Save to localStorage
        localStorage.setItem('rice-mill-theme', theme);
        localStorage.setItem('rice-mill-high-contrast', highContrast.toString());
        localStorage.setItem('rice-mill-text-size', textSize.toString());
    }, [theme, highContrast, textSize]);

    const toggleTheme = () => {
        setTheme(prev => prev === 'light' ? 'dark' : 'light');
    };

    const setThemeMode = (mode) => {
        if (['light', 'dark', 'system'].includes(mode)) {
            setTheme(mode);
        }
    };

    const adjustHighContrast = (value) => {
        const newValue = Math.max(0, Math.min(100, value));
        setHighContrast(newValue);
    };

    const adjustTextSize = (value) => {
        const newValue = Math.max(12, Math.min(24, value));
        setTextSize(newValue);
    };

    const resetToDefaults = () => {
        setTheme('light');
        setHighContrast(0);
        setTextSize(16);
    };

    const value = {
        theme,
        highContrast,
        textSize,
        toggleTheme,
        setThemeMode,
        adjustHighContrast,
        adjustTextSize,
        resetToDefaults
    };

    return (
        <ThemeContext.Provider value={value}>
            {children}
        </ThemeContext.Provider>
    );
};

export default ThemeContext;
