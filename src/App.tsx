import React, { useState } from 'react';
import { Camera, History, Eraser, Volume2, Mic, ChevronDown, Copy, Check } from 'lucide-react';

const API_BASE_URL = 'https://app-ash.vercel.app';

const LANGUAGES = [
  { code: 'ar-MA', name: 'الدارجة المغربية', flag: '🇲🇦', speech: 'ar-MA', mm: 'ar-MA' },
  { code: 'ar', name: 'العربية الفصحى', flag: '🇸🇦', speech: 'ar-SA', mm: 'ar-SA' },
  { code: 'tr', name: 'التركية', flag: '🇹🇷', speech: 'tr-TR', mm: 'tr-TR' },
  { code: 'fr', name: 'الفرنسية', flag: '🇫🇷', speech: 'fr-FR', mm: 'fr-FR' },
  { code: 'en', name: 'الإنجليزية', flag: '🇬🇧', speech: 'en-US', mm: 'en-GB' },
  { code: 'es', name: 'الإسبانية', flag: '🇪🇸', speech: 'es-ES', mm: 'es-ES' },
  { code: 'de', name: 'الألمانية', flag: '🇩🇪', speech: 'de-DE', mm: 'de-DE' },
  { code: 'it', name: 'الإيطالية', flag: '🇮🇹', speech: 'it-IT', mm: 'it-IT' },
  { code: 'pt', name: 'البرتغالية', flag: '🇵🇹', speech: 'pt-PT', mm: 'pt-PT' },
  { code: 'ru', name: 'الروسية', flag: '🇷🇺', speech: 'ru-RU', mm: 'ru-RU' },
  { code: 'zh-CN', name: 'الصينية المبسطة', flag: '🇨🇳', speech: 'zh-CN', mm: 'zh-CN' },
  { code: 'ja', name: 'اليابانية', flag: '🇯🇵', speech: 'ja-JP', mm: 'ja-JP' },
  { code: 'ko', name: 'الكورية', flag: '🇰🇷', speech: 'ko-KR', mm: 'ko-KR' },
  { code: 'nl', name: 'الهولندية', flag: '🇳🇱', speech: 'nl-NL', mm: 'nl-NL' },
  { code: 'sv', name: 'السويدية', flag: '🇸🇪', speech: 'sv-SE', mm: 'sv-SE' },
  { code: 'nb', name: 'النرويجية', flag: '🇳🇴', speech: 'nb-NO', mm: 'nb-NO' },
  { code: 'da', name: 'الدنماركية', flag: '🇩🇰', speech: 'da-DK', mm: 'da-DK' },
  { code: 'fi', name: 'الفنلندية', flag: '🇫🇮', speech: 'fi-FI', mm: 'fi-FI' },
  { code: 'pl', name: 'البولندية', flag: '🇵🇱', speech: 'pl-PL', mm: 'pl-PL' },
  { code: 'el', name: 'اليونانية', flag: '🇬🇷', speech: 'el-GR', mm: 'el-GR' },
  { code: 'ro', name: 'الرومانية', flag: '🇷🇴', speech: 'ro-RO', mm: 'ro-RO' },
  { code: 'hu', name: 'المجرية', flag: '🇭🇺', speech: 'hu-HU', mm: 'hu-HU' },
  { code: 'cs', name: 'التشيكية', flag: '🇨🇿', speech: 'cs-CZ', mm: 'cs-CZ' },
  { code: 'uk', name: 'الأوكرانية', flag: '🇺🇦', speech: 'uk-UA', mm: 'uk-UA' },
  { code: 'hi', name: 'الهندية', flag: '🇮🇳', speech: 'hi-IN', mm: 'hi-IN' },
  { code: 'ur', name: 'الأردية', flag: '🇵🇰', speech: 'ur-PK', mm: 'ur-PK' },
  { code: 'id', name: 'الإندونيسية', flag: '🇮🇩', speech: 'id-ID', mm: 'id-ID' },
  { code: 'ms', name: 'الملايوية', flag: '🇲🇾', speech: 'ms-MY', mm: 'ms-MY' },
  { code: 'th', name: 'التايلاندية', flag: '🇹🇭', speech: 'th-TH', mm: 'th-TH' },
  { code: 'vi', name: 'الفيتنامية', flag: '🇻🇳', speech: 'vi-VN', mm: 'vi-VN' },
  { code: 'ar-EG', name: 'المصرية', flag: '🇪🇬', speech: 'ar-EG', mm: 'ar-EG' },
  { code: 'ar-AE', name: 'الخليجية', flag: '🇦🇪', speech: 'ar-AE', mm: 'ar-AE' },
  { code: 'ar-LB', name: 'اللبنانية', flag: '🇱🇧', speech: 'ar-LB', mm: 'ar-LB' },
  { code: 'ar-JO', name: 'الأردنية', flag: '🇯🇴', speech: 'ar-JO', mm: 'ar-JO' },
  { code: 'he', name: 'العبرية', flag: '🇮🇱', speech: 'he-IL', mm: 'he-IL' },
  { code: 'fa', name: 'الفارسية', flag: '🇮🇷', speech: 'fa-IR', mm: 'fa-IR' },
  { code: 'sw', name: 'السواحيلية', flag: '🇹🇿', speech: 'sw-KE', mm: 'sw-KE' },
  { code: 'am', name: 'الأمهرية', flag: '🇪🇹', speech: 'am-ET', mm: 'am-ET' },
];

interface MessageItem {
  id: number;
  time: string;
  speaker: 'me' | 'guest';
  sourceText: string;
  translatedText: string;
  sourceLang: string;
  targetLang: string;
}

export default function App() {
  const [myLang, setMyLang] = useState('ar-MA');
  const [guestLang, setGuestLang] = useState('de');
  const [messages, setMessages] = useState<MessageItem[]>([
    {
      id: 1,
      time: '06:48',
      speaker: 'me',
      sourceText: 'اهلا وسهلا',
      translatedText: 'Willkommen',
      sourceLang: 'ar-MA',
      targetLang: 'de',
    },
  ]);
  const [isListening, setIsListening] = useState<'me' | 'guest' | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [statusNote, setStatusNote] = useState<string>('');

  const getNowTime = () => {
    const now = new Date();
    return now.toTimeString().slice(0, 5);
  };

  const getLangLabel = (code: string) => {
    const found = LANGUAGES.find((l) => l.code === code);
    return found ? `${found.flag} ${found.name}` : code;
  };

  const handleSpeak = (text: string, langCode: string) => {
    if (!text) return;
    if (!('speechSynthesis' in window)) {
      setStatusNote('النطق الصوتي غير مدعوم في هذا الجهاز.');
      return;
    }
    try {
      const langObj = LANGUAGES.find((l) => l.code === langCode);
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = langObj?.speech || langCode;
      utterance.onerror = () => {
        setStatusNote('تأكد من توفر حزمة الصوت للغة المختارة في إعدادات الهاتف.');
      };
      window.speechSynthesis.speak(utterance);
      setStatusNote('');
    } catch {
      setStatusNote('تعذر تشغيل النطق الصوتي.');
    }
  };

  const handleCopy = (id: number, text: string) => {
    if (!text || !navigator.clipboard) return;
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1800);
  };

  const translateText = async (text: string, fromCode: string, toCode: string) => {
    const time = getNowTime();
    const speaker: 'me' | 'guest' = fromCode === myLang ? 'me' : 'guest';
    const newId = Date.now();
    setShowHistory(false);
    setStatusNote('');

    setMessages((prev) => [
      ...prev,
      {
        id: newId,
        time,
        speaker,
        sourceText: text,
        translatedText: 'جاري الترجمة...',
        sourceLang: fromCode,
        targetLang: toCode,
      },
    ]);

    try {
      const res = await fetch(`${API_BASE_URL}/api/translate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text,
          sourceLang: fromCode,
          targetLang: toCode,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const out =
          data.translatedText ||
          data.result ||
          data.choices?.[0]?.message?.content;
        if (out && String(out).trim()) {
          setMessages((prev) =>
            prev.map((m) => (m.id === newId ? { ...m, translatedText: String(out).trim() } : m))
          );
          return;
        }
      }
      throw new Error('Primary API failed');
    } catch {
      try {
        const fromObj = LANGUAGES.find((l) => l.code === fromCode);
        const toObj = LANGUAGES.find((l) => l.code === toCode);
        const src = (fromObj?.mm || 'ar').split('-')[0];
        const tgt = (toObj?.mm || 'en').split('-')[0];
        const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(
          text
        )}&langpair=${encodeURIComponent(`${src}|${tgt}`)}`;
        const fallbackRes = await fetch(url);
        const fallbackData = await fallbackRes.json();
        const fallbackOut = fallbackData?.responseData?.translatedText;

        if (fallbackOut && String(fallbackOut).trim()) {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === newId ? { ...m, translatedText: String(fallbackOut).trim() } : m
            )
          );
          return;
        }
        throw new Error('Fallback API failed');
      } catch {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === newId ? { ...m, translatedText: 'تعذر الاتصال بالخادم.' } : m
          )
        );
        setStatusNote('تحقق من الاتصال بالإنترنت أو من إعدادات الخادم.');
      }
    }
  };

  const handleVoiceInput = (speaker: 'me' | 'guest') => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    const fromCode = speaker === 'me' ? myLang : guestLang;
    const toCode = speaker === 'me' ? guestLang : myLang;

    if (!SpeechRecognition) {
      const sample = prompt('اكتب النص المراد ترجمته:');
      if (sample && sample.trim()) {
        translateText(sample.trim(), fromCode, toCode);
      }
      return;
    }

    const recognition = new SpeechRecognition();
    const langObj = LANGUAGES.find((l) => l.code === fromCode);
    recognition.lang = langObj?.speech || 'ar-MA';
    recognition.interimResults = false;

    setIsListening(speaker);
    setStatusNote('');

    recognition.onresult = (event: any) => {
      const transcript = event.results?.[0]?.[0]?.transcript || '';
      if (transcript.trim()) {
        translateText(transcript.trim(), fromCode, toCode);
      }
    };

    recognition.onerror = () => {
      setIsListening(null);
      setStatusNote('تعذر التقاط الصوت؛ تأكد من إذن الميكروفون أو جرب الكتابة.');
    };

    recognition.onend = () => {
      setIsListening(null);
    };

    recognition.start();
  };

  const handleClearAndSave = () => {
    try {
      localStorage.setItem('translator_history', JSON.stringify(messages));
    } catch {
      // تجاهل أخطاء التخزين المحلي
    }
    setMessages([]);
  };

  const handleCameraClick = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.capture = 'environment';
    input.onchange = () => {
      const sample = prompt('أدخل النص الظاهر في الصورة لترجمته:');
      if (sample && sample.trim()) {
        translateText(sample.trim(), myLang, guestLang);
      }
    };
    input.click();
  };

  const latestMessage = messages[messages.length - 1];

  return (
    <div className="min-h-screen bg-[#070b0a] text-white flex flex-col justify-between select-none">
      {/* الشريط العلوي */}
      <header className="px-3 pt-3 pb-2 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <button
            onClick={handleCameraClick}
            title="الكاميرا"
            className="w-11 h-11 rounded-xl bg-[#141d1a] border border-[#22332c] flex items-center justify-center text-slate-200 active:scale-95 transition"
          >
            <Camera className="w-5 h-5" />
          </button>

          <button
            onClick={() => setShowHistory((v) => !v)}
            className="h-11 px-3.5 rounded-xl bg-[#141d1a] border border-[#22332c] flex items-center gap-1.5 text-sm font-semibold text-slate-100 active:scale-95 transition"
          >
            <History className="w-4 h-4 text-slate-300" />
            <span>السجل</span>
          </button>

          <button
            onClick={handleClearAndSave}
            className="h-11 px-3 rounded-xl bg-[#0c261d] border border-[#184b39] flex items-center gap-1.5 text-xs font-bold text-emerald-200 leading-tight active:scale-95 transition"
          >
            <Eraser className="w-4 h-4 text-amber-300 shrink-0" />
            <span>
              مسح
              <br />
              وحفظ
            </span>
          </button>
        </div>

        <div className="flex items-center gap-2 text-right">
          <div>
            <div className="font-extrabold text-base leading-tight text-white">
              المترجم الذكي
              <br />
              الفوري
            </div>
            <div className="text-[11px] text-emerald-400/90 leading-tight mt-0.5">
              38 لغة ولهجة • شاشة ذكية نظيفة
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-[#0b2e22] border border-emerald-500/40 flex items-center justify-center font-black text-emerald-400 text-sm shrink-0">
            AI
          </div>
        </div>
      </header>

      {/* منطقة العرض الرئيسية */}
      <main className="flex-1 px-3 py-2 flex flex-col justify-center gap-4">
        {statusNote ? (
          <div className="bg-amber-950/60 border border-amber-500/40 text-amber-200 text-xs rounded-xl px-3 py-2 text-right">
            {statusNote}
          </div>
        ) : null}

        {showHistory ? (
          <div className="bg-[#0e1b16] border border-[#1d382e] rounded-2xl p-3 max-h-64 overflow-y-auto space-y-2">
            <div className="flex items-center justify-between text-xs text-emerald-300 pb-1 border-b border-[#1d382e]">
              <span>سجل المحادثات ({messages.length})</span>
              <button onClick={() => setShowHistory(false)} className="underline">
                إغلاق
              </button>
            </div>
            {messages.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-4">لا توجد رسائل في السجل.</p>
            ) : (
              messages.map((m) => (
                <div key={m.id} className="bg-[#08120e] rounded-xl p-2.5 text-xs space-y-1">
                  <div className="flex justify-between text-slate-400">
                    <span>{m.speaker === 'me' ? '• أنت' : '• الضيف'}</span>
                    <span>{m.time}</span>
                  </div>
                  <div className="text-white font-semibold">{m.sourceText}</div>
                  <div className="flex items-center justify-between gap-2">
                    <button
                      onClick={() => handleSpeak(m.translatedText, m.targetLang)}
                      className="px-2 py-1 rounded-lg bg-emerald-600/30 text-emerald-300 flex items-center gap-1"
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                      <span>صوت</span>
                    </button>
                    <span className="text-emerald-300 text-right flex-1">{m.translatedText}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        ) : latestMessage ? (
          <div
            className={`rounded-3xl p-4 shadow-lg border transition ${
              latestMessage.speaker === 'me'
                ? 'bg-[#0c1d16] border-[#193d2e]'
                : 'bg-[#1b150b] border-[#3d2d14]'
            }`}
          >
            <div className="flex items-center justify-between text-xs mb-2 gap-2">
              <span className="text-slate-400 font-mono">{latestMessage.time}</span>
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-white/5 text-slate-300 truncate">
                {getLangLabel(latestMessage.sourceLang)} ← {getLangLabel(latestMessage.targetLang)}
              </span>
              <span
                className={`font-bold flex items-center gap-1 ${
                  latestMessage.speaker === 'me' ? 'text-emerald-400' : 'text-amber-400'
                }`}
              >
                <span
                  className={`w-2 h-2 rounded-full inline-block ${
                    latestMessage.speaker === 'me' ? 'bg-emerald-400' : 'bg-amber-400'
                  }`}
                />
                {latestMessage.speaker === 'me' ? 'أنت' : 'الضيف'}
              </span>
            </div>

            <div className="text-right text-lg font-bold text-slate-100 mb-4">
              {latestMessage.sourceText}
            </div>

            <div className="flex items-center justify-between gap-2.5">
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => handleSpeak(latestMessage.translatedText, latestMessage.targetLang)}
                  className="w-12 h-12 rounded-2xl bg-[#10b981] hover:bg-[#059669] text-[#052e16] flex items-center justify-center active:scale-95 transition"
                  title="استماع"
                >
                  <Volume2 className="w-6 h-6" />
                </button>

                <button
                  onClick={() => handleCopy(latestMessage.id, latestMessage.translatedText)}
                  className="w-11 h-11 rounded-2xl bg-white/10 hover:bg-white/15 text-slate-200 flex items-center justify-center active:scale-95 transition"
                  title="نسخ"
                >
                  {copiedId === latestMessage.id ? (
                    <Check className="w-5 h-5 text-emerald-400" />
                  ) : (
                    <Copy className="w-5 h-5" />
                  )}
                </button>
              </div>

              <div className="text-right text-xl font-extrabold text-white flex-1">
                {latestMessage.translatedText}
              </div>
            </div>
          </div>
        ) : null}

        {/* شريط اختيار اللغتين */}
        <div className="bg-[#111514] border border-[#232927] rounded-2xl p-3 grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-slate-400 text-right">لغة الطرف الآخر:</label>
            <div className="relative">
              <select
                value={guestLang}
                onChange={(e) => setGuestLang(e.target.value)}
                className="w-full appearance-none bg-[#1a1f1d] border border-[#2d3532] rounded-xl px-3 py-2.5 pr-8 text-xs font-bold text-white focus:outline-none"
              >
                {LANGUAGES.map((l) => (
                  <option key={l.code} value={l.code}>
                    {l.flag} {l.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-slate-400 text-right">لغتك (أنت):</label>
            <div className="relative">
              <select
                value={myLang}
                onChange={(e) => setMyLang(e.target.value)}
                className="w-full appearance-none bg-[#1a1f1d] border border-[#2d3532] rounded-xl px-3 py-2.5 pr-8 text-xs font-bold text-white focus:outline-none"
              >
                {LANGUAGES.map((l) => (
                  <option key={l.code} value={l.code}>
                    {l.flag} {l.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* أزرار الميكروفون الدائرية */}
        <div className="grid grid-cols-2 gap-4 pt-1 pb-2 place-items-center">
          <div className="flex flex-col items-center gap-2">
            <button
              onClick={() => handleVoiceInput('guest')}
              className={`w-24 h-24 rounded-full bg-[#f59e0b] hover:bg-[#d97706] text-[#111827] flex items-center justify-center shadow-lg transition active:scale-95 ${
                isListening === 'guest' ? 'ring-4 ring-amber-300 animate-pulse' : ''
              }`}
            >
              <Mic className="w-10 h-10 stroke-[2.2]" />
            </button>
            <span className="text-xs font-bold text-slate-200">
              {isListening === 'guest' ? 'جاري الاستماع...' : 'تحدث الضيف'}
            </span>
          </div>

          <div className="flex flex-col items-center gap-2">
            <button
              onClick={() => handleVoiceInput('me')}
              className={`w-24 h-24 rounded-full bg-[#10b981] hover:bg-[#059669] text-[#06281e] flex items-center justify-center shadow-lg transition active:scale-95 ${
                isListening === 'me' ? 'ring-4 ring-emerald-300 animate-pulse' : ''
              }`}
            >
              <Mic className="w-10 h-10 stroke-[2.2]" />
            </button>
            <span className="text-xs font-bold text-slate-200">
              {isListening === 'me' ? 'جاري الاستماع...' : 'تحدث أنت'}
            </span>
          </div>
        </div>
      </main>

      {/* شريط الإعلان السفلي */}
      <footer className="bg-white text-slate-900 px-3 py-2 flex items-center justify-between border-t border-slate-200">
        <span className="text-xs font-semibold text-blue-600">Nice job!</span>
        <div className="bg-black/80 text-white text-[11px] px-2 py-0.5 rounded">
          Annonce test
        </div>
        <div className="w-7 h-7 rounded-full bg-amber-500 text-white font-black text-xs flex items-center justify-center">
          a
        </div>
      </footer>
    </div>
  );
}
