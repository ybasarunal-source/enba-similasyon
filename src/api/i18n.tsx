import React, { createContext, useContext, useState, useEffect } from 'react';

// Types for the translation data
type TranslationData = {
  [lang: string]: {
    [key: string]: any;
  };
};

import { LANG_DATA } from './translations';

interface I18nContextType {
  t: (key: string) => string;
  language: 'TR' | 'EN';
  setLanguage: (lang: 'TR' | 'EN') => void;
  isLoading: boolean;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

export const I18nProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<'TR' | 'EN'>(() => {
    return (localStorage.getItem('enba_language') as 'TR' | 'EN') || 'TR';
  });
  const [langData, setLangData] = useState<any>(LANG_DATA);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    localStorage.setItem('enba_language', language);
  }, [language]);

  const t = (path: string): string => {
    if (!langData) return path;

    const keys = path.split('.');
    let result = langData[language];

    for (const key of keys) {
      if (result && result[key]) {
        result = result[key];
      } else {
        console.warn(`Translation key not found: ${path} for language: ${language}`);
        return path;
      }
    }

    return typeof result === 'string' ? result : path;
  };

  return (
    <I18nContext.Provider value={{ t, language, setLanguage, isLoading }}>
      {children}
    </I18nContext.Provider>
  );
};

export const useTranslation = () => {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useTranslation must be used within an I18nProvider');
  }
  return context;
};
