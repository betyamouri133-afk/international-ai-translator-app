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
    if (!translatedText) return;
    navigator.clipboard.writeText(translatedText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSpeak = (text: string, lang: string) => {
    if (!text || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang.startsWith('ar') ? 'ar-SA' : lang;
    window.speechSynthesis.speak(utterance);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 text-slate-800 flex flex-col">
      <header className="bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="bg-blue-600 text-white p-2 rounded-xl shadow-sm">
              <Languages className="w-6 h-6" />
            </div>
            <div>
              <h1 className="font-bold text-lg text-slate-900 leading-tight">المترجم الذكي الدولي</h1>
              <p className="text-xs text-slate-500">ترجمة فورية بالذكاء الاصطناعي والدارجة</p>
            </div>
          </div>

          <button
            onClick={() => setShowSettings(!showSettings)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
          >
            <Settings className="w-4 h-4" />
            <span>الإعدادات</span>
          </button>
        </div>

        {showSettings && (
          <div className="bg-slate-900 text-white px-4 py-3 border-t border-slate-800">
            <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <div className="flex items-center gap-2 text-xs text-slate-300 shrink-0">
                <Key className="w-4 h-4 text-amber-400" />
                <span>مفتاح OpenAI API:</span>
              </div>
              <input
                type="password"
                value={apiKey}
                onChange={(e) => handleSaveKey(e.target.value)}
                placeholder="sk-..."
                dir="ltr"
                className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />
              <span className="text-[11px] text-slate-400">يُحفظ محلياً في جهازك فقط</span>
            </div>
          </div>
        )}
      </header>

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-6 flex flex-col gap-4">
        <div className="bg-white p-2 rounded-2xl shadow-sm border border-slate-200 flex items-center justify-between gap-2">
          <select
            value={sourceLang}
            onChange={(e) => setSourceLang(e.target.value)}
            className="flex-1 bg-transparent font-semibold text-slate-800 px-3 py-2 rounded-xl focus:outline-none focus:bg-slate-50 cursor-pointer"
          >
            {LANGUAGES.map((lang) => (
              <option key={lang.code} value={lang.code}>
                {lang.name}
              </option>
            ))}
          </select>

          <button
            onClick={handleSwapLanguages}
            title="تبديل اللغات"
            className="p-2.5 rounded-xl bg-blue-50 text-blue-600 hover:bg-blue-100 transition shrink-0"
          >
            <ArrowLeftRight className="w-5 h-5" />
          </button>

          <select
            value={targetLang}
            onChange={(e) => setTargetLang(e.target.value)}
            className="flex-1 bg-transparent font-semibold text-blue-700 px-3 py-2 rounded-xl focus:outline-none focus:bg-slate-50 cursor-pointer"
          >
            {LANGUAGES.map((lang) => (
              <option key={lang.code} value={lang.code}>
                {lang.name}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 flex flex-col justify-between min-h-[220px]">
            <textarea
              value={sourceText}
              onChange={(e) => setSourceText(e.target.value)}
              placeholder="اكتب هنا النص اللي بغيتي تترجمو..."
              className="w-full flex-1 resize-none border-0 focus:outline-none text-base leading-relaxed text-slate-800 placeholder-slate-400"
            />
            <div className="flex items-center justify-between pt-3 border-t border-slate-100 mt-2">
              <button
                onClick={() => handleSpeak(sourceText, sourceLang)}
                disabled={!sourceText}
                className="p-2 text-slate-400 hover:text-blue-600 disabled:opacity-40 transition"
                title="استماع"
              >
                <Volume2 className="w-5 h-5" />
              </button>
              <span className="text-xs text-slate-400">{sourceText.length} حرف</span>
            </div>
          </div>

          <div className="bg-blue-600 text-white rounded-2xl shadow-md p-4 flex flex-col justify-between min-h-[220px]">
            <div className="flex-1 text-base leading-relaxed whitespace-pre-wrap">
              {isLoading ? (
                <div className="flex items-center gap-2 text-blue-200 animate-pulse">
                  <Sparkles className="w-5 h-5" />
                  <span>جاري الترجمة بالذكاء الاصطناعي...</span>
                </div>
              ) : translatedText ? (
                translatedText
              ) : (
                <span className="text-blue-200/70">ستظهر الترجمة هنا...</span>
              )}
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-blue-500/50 mt-2">
              <button
                onClick={() => handleSpeak(translatedText, targetLang)}
                disabled={!translatedText}
                className="p-2 text-blue-200 hover:text-white disabled:opacity-40 transition"
                title="استماع للترجمة"
              >
                <Volume2 className="w-5 h-5" />
              </button>

              <button
                onClick={handleCopy}
                disabled={!translatedText}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-700/70 hover:bg-blue-700 text-xs font-medium disabled:opacity-40 transition"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
                <span>{copied ? 'تم النسخ' : 'نسخ الترجمة'}</span>
              </button>
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
            {error}
          </div>
        )}

        <button
          onClick={handleTranslate}
          disabled={isLoading || !sourceText.trim()}
          className="w-full py-3.5 px-6 rounded-2xl bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white font-bold text-base shadow-md shadow-blue-600/20 flex items-center justify-center gap-2 transition cursor-pointer"
        >
          <Sparkles className="w-5 h-5" />
          <span>{isLoading ? 'جاري الترجمة...' : 'ترجم الآن'}</span>
        </button>
      </main>
    </div>
  );
}
