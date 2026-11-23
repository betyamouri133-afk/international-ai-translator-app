import React, { useState, useRef, useEffect } from 'react';

interface TranslationResult {
  detectedLang?: string;
  translation: string;
  alternatives?: string[];
  notes?: string;
}

interface HistoryItem {
  id: string;
  sourceText: string;
  translatedText: string;
  sourceLang: string;
  targetLang: string;
  timestamp: string;
}

const LANGUAGES = [
  { code: 'auto', name: 'اكتشاف تلقائي', speechCode: 'ar-SA' },
  { code: 'العربية', name: 'العربية', speechCode: 'ar-SA' },
  { code: 'الإنجليزية', name: 'الإنجليزية (English)', speechCode: 'en-US' },
  { code: 'الفرنسية', name: 'الفرنسية (Français)', speechCode: 'fr-FR' },
  { code: 'الإسبانية', name: 'الإسبانية (Español)', speechCode: 'es-ES' },
  { code: 'الألمانية', name: 'الألمانية (Deutsch)', speechCode: 'de-DE' },
  { code: 'الإيطالية', name: 'الإيطالية (Italiano)', speechCode: 'it-IT' },
  { code: 'البرتغالية', name: 'البرتغالية (Português)', speechCode: 'pt-PT' },
  { code: 'الروسية', name: 'الروسية (Русский)', speechCode: 'ru-RU' },
  { code: 'التركية', name: 'التركية (Türkçe)', speechCode: 'tr-TR' },
  { code: 'اليابانية', name: 'اليابانية (日本語)', speechCode: 'ja-JP' },
  { code: 'الكورية', name: 'الكورية (한국어)', speechCode: 'ko-KR' },
  { code: 'الصينية', name: 'الصينية (中文)', speechCode: 'zh-CN' },
  { code: 'الهندية', name: 'الهندية (हिन्दी)', speechCode: 'hi-IN' },
];

const TONES = [
  { id: 'standard', label: 'قياسي' },
  { id: 'formal', label: 'رسمي' },
  { id: 'casual', label: 'ودي' },
  { id: 'technical', label: 'تقني' },
  { id: 'creative', label: 'إبداعي' },
];

export default function App() {
  const [sourceText, setSourceText] = useState('');
  const [sourceLang, setSourceLang] = useState('auto');
  const [targetLang, setTargetLang] = useState('الإنجليزية');
  const [tone, setTone] = useState('standard');
  const [result, setResult] = useState<TranslationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [fileName, setFileName] = useState('');
  const [history, setHistory] = useState<HistoryItem[]>([]);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    const saved = localStorage.getItem('ai_translator_history');
    if (saved) {
      try {
        setHistory(JSON.parse(saved));
      } catch {}
    }
  }, []);

  const saveToHistory = (src: string, trans: string, sLang: string, tLang: string) => {
    const newItem: HistoryItem = {
      id: Date.now().toString(),
      sourceText: src.slice(0, 120),
      translatedText: trans.slice(0, 120),
      sourceLang: sLang,
      targetLang: tLang,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    const updated = [newItem, ...history.slice(0, 9)];
    setHistory(updated);
    localStorage.setItem('ai_translator_history', JSON.stringify(updated));
  };

  const handleTranslate = async (textToTranslate = sourceText) => {
    if (!textToTranslate.trim()) {
      setResult(null);
      setError('');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: textToTranslate,
          sourceLang,
          targetLang,
          tone,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'فشل الاتصال بخادم الترجمة');
      }

      setResult(data);
      saveToHistory(textToTranslate, data.translation, data.detectedLang || sourceLang, targetLang);
    } catch (err: any) {
      setError(err.message || 'حدث خطأ غير متوقع أثناء الترجمة');
    } finally {
      setLoading(false);
    }
  };

  const handleSwapLanguages = () => {
    if (sourceLang === 'auto') {
      if (result?.detectedLang) {
        const matched = LANGUAGES.find((l) => result.detectedLang?.includes(l.code));
        setSourceLang(targetLang);
        setTargetLang(matched ? matched.code : 'العربية');
      } else {
        setSourceLang(targetLang);
        setTargetLang('العربية');
      }
    } else {
      const temp = sourceLang;
      setSourceLang(targetLang);
      setTargetLang(temp);
    }

    if (result?.translation) {
      setSourceText(result.translation);
      setResult(null);
    }
  };

  const handleSpeak = (text: string, langCode: string) => {
    if (!text || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    const langObj = LANGUAGES.find((l) => l.code === langCode);
    utterance.lang = langObj ? langObj.speechCode : 'en-US';
    window.speechSynthesis.speak(utterance);
  };

  const toggleListening = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setError('متصفحك الحالي لا يدعم الإدخال الصوتي المباشر');
      return;
    }

    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }

    const recognition = new SpeechRecognition();
    const langObj = LANGUAGES.find((l) => l.code === sourceLang);
    recognition.lang = sourceLang === 'auto' ? 'ar-SA' : langObj?.speechCode || 'ar-SA';
    recognition.interimResults = false;

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onerror = () => setIsListening(false);
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      const updatedText = sourceText ? `${sourceText} ${transcript}` : transcript;
      setSourceText(updatedText);
      handleTranslate(updatedText);
    };

    recognitionRef.current = recognition;
    recognition.start();
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        const trimmed = content.slice(0, 8000);
        setSourceText(trimmed);
        handleTranslate(trimmed);
      }
    };
    reader.readAsText(file);
  };

  const handleDownloadTranslation = () => {
    if (!result?.translation) return;
    const blob = new Blob([result.translation], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName ? `translated_${fileName}` : 'translation.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCopy = (text: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div dir="rtl" className="min-h-screen bg-slate-50 text-slate-900 font-sans">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-4 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white font-bold text-xl shadow-sm">
              AI
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-900 leading-tight">
                المترجم الذكي الاحترافي
              </h1>
              <p className="text-xs text-slate-500">مدعوم بتقنية Gemini 2.5 للترجمة السياقية</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept=".txt,.md,.csv,.json"
              onChange={handleFileUpload}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition"
            >
              <span>📄</span>
              <span>ترجمة ملف</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-semibold text-slate-500 px-2">أسلوب الترجمة:</span>
            {TONES.map((t) => (
              <button
                key={t.id}
                onClick={() => setTone(t.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                  tone === t.id
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {fileName && (
            <div className="text-xs bg-blue-50 text-blue-700 px-3 py-1 rounded-full font-medium">
              الملف المحمّل: {fileName}
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="grid grid-cols-11 items-center border-b border-slate-200 bg-slate-50/70 px-3 py-2.5">
            <div className="col-span-5">
              <select
                value={sourceLang}
                onChange={(e) => setSourceLang(e.target.value)}
                className="w-full bg-transparent text-sm font-bold text-slate-800 focus:outline-none cursor-pointer"
              >
                {LANGUAGES.map((lang) => (
                  <option key={lang.code} value={lang.code}>
                    {lang.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="col-span-1 flex justify-center">
              <button
                onClick={handleSwapLanguages}
                title="تبديل اللغتين"
                className="p-2 rounded-full hover:bg-slate-200 text-slate-600 transition font-bold"
              >
                ⇄
              </button>
            </div>

            <div className="col-span-5">
              <select
                value={targetLang}
                onChange={(e) => setTargetLang(e.target.value)}
                className="w-full bg-transparent text-sm font-bold text-blue-700 focus:outline-none cursor-pointer"
              >
                {LANGUAGES.filter((l) => l.code !== 'auto').map((lang) => (
                  <option key={lang.code} value={lang.code}>
                    {lang.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x md:divide-x-reverse divide-slate-200">
            <div className="p-4 flex flex-col justify-between min-h-[260px]">
              <div className="relative flex-1">
                <textarea
                  value={sourceText}
                  onChange={(e) => setSourceText(e.target.value)}
                  placeholder="اكتب النص هنا أو تحدث عبر الميكروفون أو ارفع ملفاً..."
                  className="w-full h-48 resize-none border-0 focus:outline-none text-base text-slate-800 placeholder-slate-400 leading-relaxed bg-transparent"
                />
                {sourceText && (
                  <button
                    onClick={() => {
                      setSourceText('');
                      setResult(null);
                      setFileName('');
                    }}
                    className="absolute top-0 left-0 text-slate-400 hover:text-slate-600 text-sm px-2 py-1"
                  >
                    ✕
                  </button>
                )}
              </div>

              {result?.detectedLang && sourceLang === 'auto' && (
                <div className="text-xs text-blue-600 font-medium mb-2">
                  اللغة المكتشفة: {result.detectedLang}
                </div>
              )}

              <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                <div className="flex items-center gap-2">
                  <button
                    onClick={toggleListening}
                    className={`p-2 rounded-lg text-sm font-medium transition ${
                      isListening
                        ? 'bg-red-100 text-red-600 animate-pulse'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                    title="إدخال صوتي"
                  >
                    {isListening ? '⏹️ جاري الاستماع...' : '🎤 صوت'}
                  </button>
                  <button
                    onClick={() => handleSpeak(sourceText, sourceLang)}
                    disabled={!sourceText}
                    className="p-2 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 disabled:opacity-40 text-sm"
                    title="استماع للنص الأصلي"
                  >
                    🔊
                  </button>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-xs text-slate-400">{sourceText.length} حرف</span>
                  <button
                    onClick={() => handleTranslate()}
                    disabled={loading || !sourceText.trim()}
                    className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-semibold text-sm shadow-sm transition"
                  >
                    {loading ? 'جاري الترجمة...' : 'ترجم الآن'}
                  </button>
                </div>
              </div>
            </div>

            <div className="p-4 flex flex-col justify-between min-h-[260px] bg-slate-50/40">
              <div className="flex-1">
                {error ? (
                  <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
                    ⚠️ {error}
                  </div>
                ) : loading ? (
                  <div className="space-y-3 animate-pulse pt-2">
                    <div className="h-4 bg-slate-200 rounded w-3/4"></div>
                    <div className="h-4 bg-slate-200 rounded w-1/2"></div>
                    <div className="h-4 bg-slate-200 rounded w-5/6"></div>
                  </div>
                ) : result?.translation ? (
                  <div className="space-y-4">
                    <p className="text-base text-slate-900 leading-relaxed whitespace-pre-wrap font-medium">
                      {result.translation}
                    </p>

                    {result.alternatives && result.alternatives.length > 0 && (
                      <div className="pt-3 border-t border-slate-200/70">
                        <p className="text-xs font-semibold text-slate-500 mb-1.5">
                          صياغات بديلة مقترحة:
                        </p>
                        <ul className="space-y-1.5">
                          {result.alternatives.map((alt, idx) => (
                            <li
                              key={idx}
                              onClick={() => handleCopy(alt)}
                              className="text-xs text-slate-700 bg-white px-3 py-2 rounded-lg border border-slate-200/80 hover:border-blue-300 cursor-pointer transition"
                            >
                              {alt}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {result.notes && (
                      <div className="text-xs text-indigo-700 bg-indigo-50/80 px-3 py-2 rounded-lg">
                        💡 {result.notes}
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-slate-400 text-base">ستظهر الترجمة الاحترافية هنا...</p>
                )}
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-slate-200/60 mt-4">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleSpeak(result?.translation || '', targetLang)}
                    disabled={!result?.translation}
                    className="p-2 rounded-lg bg-white border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-40 text-sm"
                    title="استماع للترجمة"
                  >
                    🔊 نطق
                  </button>
                  <button
                    onClick={handleDownloadTranslation}
                    disabled={!result?.translation}
                    className="p-2 rounded-lg bg-white border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-40 text-sm"
                    title="تحميل كملف نصي"
                  >
                    ⬇️ تحميل
                  </button>
                </div>

                <button
                  onClick={() => handleCopy(result?.translation || '')}
                  disabled={!result?.translation}
                  className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:bg-slate-300 text-white text-xs font-semibold transition"
                >
                  {copied ? '✓ تم النسخ!' : '📋 نسخ الترجمة'}
                </button>
              </div>
            </div>
          </div>
        </div>

        {history.length > 0 && (
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-bold text-slate-700">سجل الترجمات الأخيرة</h2>
              <button
                onClick={() => {
                  setHistory([]);
                  localStorage.removeItem('ai_translator_history');
                }}
                className="text-xs text-slate-400 hover:text-red-500"
              >
                مسح السجل
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
              {history.map((item) => (
                <div
                  key={item.id}
                  onClick={() => {
                    setSourceText(item.sourceText);
                    setTargetLang(item.targetLang);
                  }}
                  className="p-3 rounded-xl border border-slate-100 hover:border-blue-200 bg-slate-50/50 cursor-pointer transition"
                >
                  <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                    <span>
                      {item.sourceLang} ← {item.targetLang}
                    </span>
                    <span>{item.timestamp}</span>
                  </div>
                  <p className="text-xs text-slate-700 truncate font-medium">{item.sourceText}</p>
                  <p className="text-xs text-blue-700 truncate mt-0.5">{item.translatedText}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
