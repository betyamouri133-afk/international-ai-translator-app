import React, { useState, useEffect, useRef } from 'react';
import {
  Volume2,
  Mic,
  MicOff,
  Copy,
  Check,
  Trash2,
  Camera,
  X,
  ArrowLeftRight,
  Menu,
  Sparkles,
  History,
  Settings,
  Globe
} from 'lucide-react';

const LANGUAGES = [
  { code: 'ar-MA', name: 'الدارجة المغربية', flag: '🇲🇦', speech: 'ar-MA', mm: 'ar-MA', tts: 'ar' },
  { code: 'ar', name: 'العربية الفصحى', flag: '🇸🇦', speech: 'ar-SA', mm: 'ar-SA', tts: 'ar' },
  { code: 'tr', name: 'التركية', flag: '🇹🇷', speech: 'tr-TR', mm: 'tr-TR', tts: 'tr' },
  { code: 'fr', name: 'الفرنسية', flag: '🇫🇷', speech: 'fr-FR', mm: 'fr-FR', tts: 'fr' },
  { code: 'en', name: 'الإنجليزية', flag: '🇬🇧', speech: 'en-US', mm: 'en-GB', tts: 'en' },
  { code: 'es', name: 'الإسبانية', flag: '🇪🇸', speech: 'es-ES', mm: 'es-ES', tts: 'es' },
  { code: 'de', name: 'الألمانية', flag: '🇩🇪', speech: 'de-DE', mm: 'de-DE', tts: 'de' },
  { code: 'it', name: 'الإيطالية', flag: '🇮🇹', speech: 'it-IT', mm: 'it-IT', tts: 'it' },
  { code: 'pt', name: 'البرتغالية', flag: '🇵🇹', speech: 'pt-PT', mm: 'pt-PT', tts: 'pt' },
  { code: 'ru', name: 'الروسية', flag: '🇷🇺', speech: 'ru-RU', mm: 'ru-RU', tts: 'ru' },
  { code: 'zh-CN', name: 'الصينية المبسطة', flag: '🇨🇳', speech: 'zh-CN', mm: 'zh-CN', tts: 'zh-CN' },
  { code: 'ja', name: 'اليابانية', flag: '🇯🇵', speech: 'ja-JP', mm: 'ja-JP', tts: 'ja' },
  { code: 'ko', name: 'الكورية', flag: '🇰🇷', speech: 'ko-KR', mm: 'ko-KR', tts: 'ko' },
  { code: 'nl', name: 'الهولندية', flag: '🇳🇱', speech: 'nl-NL', mm: 'nl-NL', tts: 'nl' },
  { code: 'sv', name: 'السويدية', flag: '🇸🇪', speech: 'sv-SE', mm: 'sv-SE', tts: 'sv' },
  { code: 'nb', name: 'النرويجية', flag: '🇳🇴', speech: 'nb-NO', mm: 'nb-NO', tts: 'no' },
  { code: 'da', name: 'الدنماركية', flag: '🇩🇰', speech: 'da-DK', mm: 'da-DK', tts: 'da' },
  { code: 'fi', name: 'الفنلندية', flag: '🇫🇮', speech: 'fi-FI', mm: 'fi-FI', tts: 'fi' },
  { code: 'pl', name: 'البولندية', flag: '🇵🇱', speech: 'pl-PL', mm: 'pl-PL', tts: 'pl' },
  { code: 'el', name: 'اليونانية', flag: '🇬🇷', speech: 'el-GR', mm: 'el-GR', tts: 'el' },
  { code: 'ro', name: 'الرومانية', flag: '🇷🇴', speech: 'ro-RO', mm: 'ro-RO', tts: 'ro' },
  { code: 'hu', name: 'المجرية', flag: '🇭🇺', speech: 'hu-HU', mm: 'hu-HU', tts: 'hu' },
  { code: 'cs', name: 'التشيكية', flag: '🇨🇿', speech: 'cs-CZ', mm: 'cs-CZ', tts: 'cs' },
  { code: 'uk', name: 'الأوكرانية', flag: '🇺🇦', speech: 'uk-UA', mm: 'uk-UA', tts: 'uk' },
  { code: 'hi', name: 'الهندية', flag: '🇮🇳', speech: 'hi-IN', mm: 'hi-IN', tts: 'hi' },
  { code: 'ur', name: 'الأردية', flag: '🇵🇰', speech: 'ur-PK', mm: 'ur-PK', tts: 'ur' },
  { code: 'id', name: 'الإندونيسية', flag: '🇮🇩', speech: 'id-ID', mm: 'id-ID', tts: 'id' },
  { code: 'ms', name: 'الملايوية', flag: '🇲🇾', speech: 'ms-MY', mm: 'ms-MY', tts: 'ms' },
  { code: 'th', name: 'التايلاندية', flag: '🇹🇭', speech: 'th-TH', mm: 'th-TH', tts: 'th' },
  { code: 'vi', name: 'الفيتنامية', flag: '🇻🇳', speech: 'vi-VN', mm: 'vi-VN', tts: 'vi' },
  { code: 'ar-EG', name: 'المصرية', flag: '🇪🇬', speech: 'ar-EG', mm: 'ar-EG', tts: 'ar' },
  { code: 'ar-AE', name: 'الخليجية', flag: '🇦🇪', speech: 'ar-AE', mm: 'ar-AE', tts: 'ar' },
  { code: 'ar-LB', name: 'اللبنانية', flag: '🇱🇧', speech: 'ar-LB', mm: 'ar-LB', tts: 'ar' },
  { code: 'ar-JO', name: 'الأردنية', flag: '🇯🇴', speech: 'ar-JO', mm: 'ar-JO', tts: 'ar' },
  { code: 'he', name: 'العبرية', flag: '🇮🇱', speech: 'he-IL', mm: 'he-IL', tts: 'iw' },
  { code: 'fa', name: 'الفارسية', flag: '🇮🇷', speech: 'fa-IR', mm: 'fa-IR', tts: 'fa' },
  { code: 'sw', name: 'السواحيلية', flag: '🇹🇿', speech: 'sw-KE', mm: 'sw-KE', tts: 'sw' },
  { code: 'am', name: 'الأمهرية', flag: '🇪🇹', speech: 'am-ET', mm: 'am-ET', tts: 'am' },
];

const API_BASE = 'https://app-ash.vercel.app';

interface HistoryItem {
  id: string;
  sourceText: string;
  translatedText: string;
  sourceLang: string;
  targetLang: string;
  timestamp: number;
}

export function App() {
  const [sourceLang, setSourceLang] = useState('ar-MA');
  const [targetLang, setTargetLang] = useState('fr');
  const [inputText, setInputText] = useState('');
  const [translatedText, setTranslatedText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [copied, setCopied] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recognitionRef = useRef<any>(null);

  const getLangObj = (code: string) =>
    LANGUAGES.find((l) => l.code === code) || LANGUAGES[0];

  const translateText = async (text: string, fromCode = sourceLang, toCode = targetLang) => {
    const clean = text.trim();
    if (!clean) {
      setTranslatedText('');
      return;
    }

    setIsLoading(true);
    setStatusMsg('');
    const fromObj = getLangObj(fromCode);
    const toObj = getLangObj(toCode);

    try {
      const res = await fetch(`${API_BASE}/api/translate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: clean,
          sourceLang: fromObj.mm,
          targetLang: toObj.mm,
          sourceName: fromObj.name,
          targetName: toObj.name,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const result = data.translatedText || data.result || data.text || clean;
        setTranslatedText(result);

        setHistory((prev) => [
          {
            id: `${Date.now()}`,
            sourceText: clean,
            translatedText: result,
            sourceLang: fromCode,
            targetLang: toCode,
            timestamp: Date.now(),
          },
          ...prev.slice(0, 29),
        ]);
      } else {
        setStatusMsg('تعذرت الترجمة من الخادم');
      }
    } catch {
      setStatusMsg('تحقق من الاتصال بالإنترنت');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      if (inputText.trim()) {
        translateText(inputText);
      } else {
        setTranslatedText('');
      }
    }, 450);

    return () => clearTimeout(timer);
  }, [inputText, sourceLang, targetLang]);

  const speakText = async (text: string, langCode: string) => {
    const clean = text.trim();
    if (!clean) return;

    const langObj = getLangObj(langCode);

    try {
      const res = await fetch(`${API_BASE}/api/tts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: clean,
          lang: langObj.tts,
          speechCode: langObj.speech,
        }),
      });

      if (res.ok) {
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const audio = new Audio(url);
        audio.onended = () => URL.revokeObjectURL(url);
        await audio.play();
        return;
      }
    } catch {
      // Fallback to speechSynthesis
    }

    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(clean);
      utterance.lang = langObj.speech;
      window.speechSynthesis.speak(utterance);
    }
  };

  const toggleMic = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setStatusMsg('الميكروفون غير مدعوم في هذا المتصفح');
      return;
    }

    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }

    const recognition = new SpeechRecognition();
    const langObj = getLangObj(sourceLang);
    recognition.lang = langObj.speech;
    recognition.interimResults = true;
    recognition.continuous = false;

    recognition.onresult = (event: any) => {
      let transcript = '';
      for (let i = 0; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript;
      }
      setInputText(transcript);
    };

    recognition.onerror = () => {
      setIsListening(false);
      setStatusMsg('خطأ في التقاط الصوت');
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);
  };

  const swapLanguages = () => {
    setSourceLang(targetLang);
    setTargetLang(sourceLang);
    setInputText(translatedText);
    setTranslatedText(inputText);
  };

  const copyResult = async () => {
    if (!translatedText) return;
    await navigator.clipboard.writeText(translatedText);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const openCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
      });
      streamRef.current = stream;
      setCameraOpen(true);
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      }, 100);
    } catch {
      setStatusMsg('تعذر تشغيل الكاميرا');
    }
  };

  const closeCamera = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setCameraOpen(false);
  };

  const srcObj = getLangObj(sourceLang);
  const tgtObj = getLangObj(targetLang);

  return (
    <div className="min-h-screen bg-slate-950 text-white flex relative">
      {sidebarOpen && (
        <aside className="fixed inset-y-0 left-0 z-40 w-72 bg-slate-900 border-r border-slate-800 p-4 flex flex-col justify-between">
          <div className="space-y-4 overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2 font-bold text-emerald-400">
                <Globe className="w-5 h-5" />
                <span>المترجم الذكي</span>
              </div>
              <button
                type="button"
                onClick={() => setSidebarOpen(false)}
                className="p-1.5 rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-slate-400">
                <History className="w-4 h-4" />
                <span>السجل الأخير</span>
              </div>

              {history.length === 0 ? (
                <p className="text-xs text-slate-500 py-4 text-center">
                  لا توجد ترجمات محفوظة بعد
                </p>
              ) : (
                history.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setSourceLang(item.sourceLang);
                      setTargetLang(item.targetLang);
                      setInputText(item.sourceText);
                      setTranslatedText(item.translatedText);
                      setSidebarOpen(false);
                    }}
                    className="w-full text-right p-2.5 rounded-xl bg-slate-800/70 hover:bg-slate-800 transition space-y-1"
                  >
                    <div className="text-xs text-slate-400 truncate">
                      {item.sourceText}
                    </div>
                    <div className="text-sm text-emerald-300 font-medium truncate">
                      {item.translatedText}
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>

          <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
            <span className="flex items-center gap-1.5">
              <Settings className="w-4 h-4 text-emerald-400" />
              {LANGUAGES.length} لغة ولهجة
            </span>
            <span>app-ash.vercel.app</span>
          </div>
        </aside>
      )}

      <div className="flex-1 flex flex-col">
        <header className="h-14 px-4 border-b border-slate-800/80 flex items-center justify-between bg-slate-950/90 backdrop-blur">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setSidebarOpen((v) => !v)}
              className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800"
              aria-label="القائمة"
            >
              <Menu className="w-5 h-5" />
            </button>
            <span className="font-bold text-sm sm:text-base flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              مترجم اللغات واللهجات
            </span>
          </div>

          <button
            type="button"
            onClick={openCamera}
            className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-emerald-400"
            aria-label="الكاميرا"
          >
            <Camera className="w-5 h-5" />
          </button>
        </header>

        <main className="flex-1 w-full max-w-2xl mx-auto p-4 space-y-4">
          <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 bg-slate-900 p-2 rounded-2xl border border-slate-800">
            <select
              value={sourceLang}
              onChange={(e) => setSourceLang(e.target.value)}
              className="bg-slate-800 text-white text-sm rounded-xl px-3 py-2.5 focus:outline-none"
            >
              {LANGUAGES.map((lang) => (
                <option key={lang.code} value={lang.code}>
                  {lang.flag} {lang.name}
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={swapLanguages}
              className="p-2.5 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400"
              aria-label="تبديل اللغات"
            >
              <ArrowLeftRight className="w-4 h-4" />
            </button>

            <select
              value={targetLang}
              onChange={(e) => setTargetLang(e.target.value)}
              className="bg-slate-800 text-white text-sm rounded-xl px-3 py-2.5 focus:outline-none"
            >
              {LANGUAGES.map((lang) => (
                <option key={lang.code} value={lang.code}>
                  {lang.flag} {lang.name}
                </option>
              ))}
            </select>
          </div>

          <div className="bg-slate-900 rounded-2xl border border-slate-800 p-4 space-y-3">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>
                {srcObj.flag} {srcObj.name}
              </span>
              {inputText && (
                <button
                  type="button"
                  onClick={() => {
                    setInputText('');
                    setTranslatedText('');
                  }}
                  className="text-rose-400 hover:text-rose-300 flex items-center gap-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  مسح
                </button>
              )}
            </div>

            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="اكتب أو تحدث للترجمة الفورية..."
              rows={4}
              className="w-full bg-transparent text-base text-white placeholder-slate-500 resize-none focus:outline-none"
            />

            <div className="flex items-center justify-between pt-2 border-t border-slate-800/70">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={toggleMic}
                  className={`p-2.5 rounded-xl border transition ${
                    isListening
                      ? 'bg-rose-600 border-rose-500 text-white animate-pulse'
                      : 'bg-slate-800 border-slate-700 text-emerald-400 hover:bg-slate-700'
                  }`}
                  aria-label="الميكروفون"
                >
                  {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                </button>

                <button
                  type="button"
                  onClick={() => speakText(inputText, sourceLang)}
                  className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-sky-400"
                  aria-label="نطق النص الأصلي"
                >
                  <Volume2 className="w-5 h-5" />
                </button>
              </div>

              <button
                type="button"
                onClick={() => translateText(inputText)}
                disabled={isLoading}
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 font-semibold text-sm transition"
              >
                {isLoading ? 'جاري الترجمة...' : 'ترجمة'}
              </button>
            </div>
          </div>

          <div className="bg-slate-900 rounded-2xl border border-slate-800 p-4 space-y-3 min-h-40 flex flex-col justify-between">
            <div className="space-y-2">
              <div className="text-xs text-emerald-400 font-medium">
                {tgtObj.flag} {tgtObj.name}
              </div>

              <div className="text-base text-slate-100 whitespace-pre-wrap leading-relaxed">
                {isLoading
                  ? 'جاري معالجة الترجمة...'
                  : translatedText || 'الترجمة غادي تظهر هنا...'}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800/70">
              <button
                type="button"
                onClick={() => speakText(translatedText, targetLang)}
                className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-sky-400"
                aria-label="نطق الترجمة"
              >
                <Volume2 className="w-5 h-5" />
              </button>

              <button
                type="button"
                onClick={copyResult}
                className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-emerald-400"
                aria-label="نسخ الترجمة"
              >
                {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {statusMsg && (
            <div className="text-center text-xs text-amber-400 bg-amber-950/40 border border-amber-800/50 rounded-xl py-2 px-3">
              {statusMsg}
            </div>
          )}
        </main>
      </div>

      {cameraOpen && (
        <div className="fixed inset-0 z-50 bg-black/95 flex flex-col items-center justify-center p-4">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            className="w-full max-w-md rounded-2xl border border-slate-700"
          />
          <button
            type="button"
            onClick={closeCamera}
            className="mt-4 px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-semibold"
          >
            إغلاق الكاميرا
          </button>
        </div>
      )}
    </div>
  );
}

export default App;
