import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { storage } from '../utils/storage';
import en from '../i18n/locales/en';
import es from '../i18n/locales/es';
import pt from '../i18n/locales/pt';
import zh from '../i18n/locales/zh';

export type LangCode = 'en' | 'es' | 'pt' | 'zh';
type TranslationKeys = keyof typeof en;
type Translations = Record<TranslationKeys, string>;

const LOCALES: Record<LangCode, Translations> = { en, es, pt, zh } as any;
const STORAGE_KEY = 'app_language';

interface LanguageContextType {
  language: LangCode;
  setLanguage: (lang: LangCode) => void;
  t: (key: TranslationKeys, params?: Record<string, string | number>) => string;
}

const LanguageContext = createContext<LanguageContextType | null>(null);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLangState] = useState<LangCode>('en');

  useEffect(() => {
    storage.get(STORAGE_KEY).then((saved) => {
      if (saved && saved in LOCALES) setLangState(saved as LangCode);
    });
  }, []);

  const setLanguage = useCallback((lang: LangCode) => {
    setLangState(lang);
    storage.set(STORAGE_KEY, lang);
  }, []);

  const t = useCallback(
    (key: keyof Translations, params?: Record<string, string | number>): string => {
      let text = (LOCALES[language]?.[key] ?? LOCALES.en[key] ?? key) as string;
      if (params) {
        Object.entries(params).forEach(([k, v]) => {
          text = text.replace(`{{${k}}}`, String(v));
        });
      }
      return text;
    },
    [language],
  );

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage(): LanguageContextType {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used within LanguageProvider');
  return ctx;
}
