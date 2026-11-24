import React, { useState } from 'react';
import { Languages, Copy, Check, Volume2, Sparkles, ArrowLeftRight, Key, Settings } from 'lucide-react';

const API_BASE_URL = 'https://app-ash.vercel.app';

const LANGUAGES = [
  { code: 'ar-MA', name: 'الدارجة المغربية' },
  { code: 'ar', name: 'العربية الفصحى' },
  { code: 'fr', name: 'الفرنسية (Français)' },
  { code: 'en', name: 'الإنجليزية (English)' },
  { code: 'es', name: 'الإسبانية (Español)' },
  { code: 'de', name: 'الألمانية (Deutsch)' },
  { code: 'it', name: 'الإيطالية (Italiano)' },
  { code: 'tr', name: 'التركية (Türkçe)' },
];

export default function App() {
  const [sourceText, setSourceText] = useState('');
  const [translatedText, setTranslatedText] = useState('');
  const [sourceLang, setSourceLang] = useState('ar-MA');
  const [targetLang, setTargetLang] = useState('fr');
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [apiKey, setApiKey] = useState(() => localStorage.getItem('openai_api_key') || '');
  const [showSettings, setShowSettings] = useState(false);
  const [error, setError] = useState('');

  const handleSaveKey = (val: string) => {
    setApiKey(val);
    localStorage.setItem('openai_api_key', val);
  };

  const handleSwapLanguages = () => {
    setSourceLang(targetLang);
    setTargetLang(sourceLang);
    setSourceText(translatedText);
    setTranslatedText(sourceText);
  };

  const handleTranslate = async () => {
    if (!sourceText.trim()) return;
    setError('');
    setIsLoading(true);

    const srcName = LANGUAGES.find((l) => l.code === sourceLang)?.name || sourceLang;
    const tgtName = LANGUAGES.find((l) => l.code === targetLang)?.name || targetLang;

    try {
      const response = await fetch(`${API_BASE_URL}/api/translate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(apiKey.trim() ? { Authorization: `Bearer ${apiKey.trim()}` } : {}),
        },
        body: JSON.stringify({
          text: sourceText,
          sourceLang,
          targetLang,
          srcName,
          tgtName,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error?.message || data.message || 'تعذر الاتصال بالخادم.');
      }

      const result = data.translatedText || data.result || data.choices?.[0]?.message?.content || '';
      setTranslatedText(String(result).trim());
    } catch (err: any) {
      setError(err?.message || 'تعذر الاتصال بالخادم.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = () => {
    if (!
