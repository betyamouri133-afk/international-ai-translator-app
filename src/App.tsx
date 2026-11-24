import React, { useState, useRef, useEffect } from 'react';
import {
  AdMob,
  BannerAdOptions,
  BannerAdSize,
  BannerAdPosition,
  AdOptions,
} from '@capacitor-community/admob';

// رابط السيرفر السحابي (يعمل سواء في الويب أو داخل تطبيق الأندرويد APK)
const API_BASE_URL =
  typeof window !== 'undefined' && window.location.protocol.startsWith('http') && !window.location.hostname.includes('localhost')
    ? ''
    : 'https://international-ai-translator-app-ash.vercel.app';

// معرفات إعلانات Google AdMob التجريبية الرسمية (استبدلها بمعرفاتك الحقيقية عند النشر في Google Play)
const ADMOB_BANNER_ID = 'ca-app-pub-3940256099942544/6300978111';
const ADMOB_INTERSTITIAL_ID = 'ca-app-pub-3940256099942544/1033173712';

interface Message {
  id: string;
  sender: 'user' | 'guest';
  text: string;
  translation: string;
  timestamp: string;
  sourceLang: string;
  targetLang: string;
}

interface ConversationSession {
  id: string;
  date: string;
  messages: Message[];
}

const ALL_LANGUAGES = [
  { code: 'ar-MA', label: '🇲🇦 الدارجة المغربية', promptName: 'Moroccan Darija (Arabic script only)' },
  { code: 'ar-SA', label: '🇸🇦 اللهجة الخليجية', promptName: 'Gulf Arabic dialect (Khaleeji, Arabic script only)' },
  { code: 'ar-EG', label: '🇪🇬 اللهجة المصرية', promptName: 'Egyptian Arabic dialect (Masri, Arabic script only)' },
  { code: 'ar-LB', label: '🇱🇧 اللهجة الشامية', promptName: 'Levantine Arabic dialect (Arabic script only)' },
  { code: 'ar-001', label: '🌍 العربية الفصحى', promptName: 'Modern Standard Arabic' },

  { code: 'ja-JP', label: '🇯🇵 اليابانية (日本語)', promptName: 'Japanese' },
  { code: 'ko-KR', label: '🇰🇷 الكورية (한국어)', promptName: 'Korean' },
  { code: 'hi-IN', label: '🇮🇳 الهندية (हिन्दी)', promptName: 'Hindi' },
  { code: 'zh-CN', label: '🇨🇳 الصينية المبسطة (简体中文)', promptName: 'Simplified Mandarin Chinese' },
  { code: 'zh-TW', label: '🇹🇼 الصينية التقليدية (繁體中文)', promptName: 'Traditional Chinese' },
  { code: 'ur-PK', label: '🇵🇰 الأردية (اردو)', promptName: 'Urdu' },
  { code: 'id-ID', label: '🇮🇩 الإندونيسية (Bahasa Indonesia)', promptName: 'Indonesian' },
  { code: 'ms-MY', label: '🇲🇾 الملايوية (Bahasa Melayu)', promptName: 'Malay' },
  { code: 'th-TH', label: '🇹🇭 التايلاندية (ไทย)', promptName: 'Thai' },
  { code: 'vi-VN', label: '🇻🇳 الفيتنامية (Tiếng Việt)', promptName: 'Vietnamese' },
  { code: 'fil-PH', label: '🇵🇭 الفلبينية (Tagalog)', promptName: 'Filipino Tagalog' },
  { code: 'bn-BD', label: '🇧🇩 البنغالية (বাংলা)', promptName: 'Bengali' },

  { code: 'en-US', label: '🇺🇸 الإنجليزية (English)', promptName: 'English' },
  { code: 'fr-FR', label: '🇫🇷 الفرنسية (Français)', promptName: 'French' },
  { code: 'es-ES', label: '🇪🇸 الإسبانية (Español)', promptName: 'Spanish' },
  { code: 'tr-TR', label: '🇹🇷 التركية (Türkçe)', promptName: 'Turkish' },
  { code: 'nl-NL', label: '🇳🇱 الهولندية (Nederlands)', promptName: 'Dutch' },
  { code: 'pt-PT', label: '🇵🇹 البرتغالية (Português)', promptName: 'Portuguese' },
  { code: 'de-DE', label: '🇩🇪 الألمانية (Deutsch)', promptName: 'German' },
  { code: 'it-IT', label: '🇮🇹 الإيطالية (Italiano)', promptName: 'Italian' },
  { code: 'ru-RU', label: '🇷🇺 الروسية (Русский)', promptName: 'Russian' },
  { code: 'uk-UA', label: '🇺🇦 الأوكرانية (Українська)', promptName: 'Ukrainian' },
  { code: 'pl-PL', label: '🇵🇱 البولندية (Polski)', promptName: 'Polish' },
  { code: 'sv-SE', label: '🇸🇪 السويدية (Svenska)', promptName: 'Swedish' },
  { code: 'el-GR', label: '🇬🇷 اليونانية (Ελληνικά)', promptName: 'Greek' },
  { code: 'ro-RO', label: '🇷🇴 الرومانية (Română)', promptName: 'Romanian' },
  { code: 'fa-IR', label: '🇮🇷 الفارسية (فارسی)', promptName: 'Persian' },

  { code: 'sw-KE', label: '🇰🇪 السواحيلية (Kiswahili)', promptName: 'Swahili' },
  { code: 'ha-NG', label: '🇳🇬 الهوسا (Hausa)', promptName: 'Hausa' },
];

const SILENT_AUDIO =
  'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA';

export default function App() {
  const [langUser, setLangUser] = useState('ar-MA');
  const [langGuest, setLangGuest] = useState('tr-TR');
  const [camTargetLang, setCamTargetLang] = useState('ar-MA');
  const [currentMessage, setCurrentMessage] = useState<Message | null>(null);
  const [sessionMessages, setSessionMessages] = useState<Message[]>([]);
  const [liveTranscript, setLiveTranscript] = useState('');
  const [translationCount, setTranslationCount] = useState(0);
  const [history, setHistory] = useState<ConversationSession[]>(() => {
    try {
      const saved = localStorage.getItem('translator_history_v1');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [showHistory, setShowHistory] = useState(false);
  const [isRecordingUser, setIsRecordingUser] = useState(false);
  const [isRecordingGuest, setIsRecordingGuest] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [camTranslation, setCamTranslation] = useState('');
  const [isTranslatingCam, setIsTranslatingCam] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const playerRef = useRef<HTMLAudioElement | null>(null);
  const autoClearTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // تهيئة إعلانات Google AdMob عند تشغيل التطبيق على الأندرويد
  useEffect(() => {
    const initAdMob = async () => {
      try {
        await AdMob.initialize({
          initializeForTesting: true,
        });
        const bannerOptions: BannerAdOptions = {
          adId: ADMOB_BANNER_ID,
          adSize: BannerAdSize.ADAPTIVE_BANNER,
          position: BannerAdPosition.BOTTOM_CENTER,
          margin: 0,
          isTesting: true,
        };
        await AdMob.showBanner(bannerOptions);
      } catch {
        // يعمل التطبيق بشكل طبيعي في المتصفح حتى بدون AdMob
      }
    };
    initAdMob();
  }, []);

  const triggerInterstitialAd = async (newCount: number) => {
    if (newCount > 0 && newCount % 4 === 0) {
      try {
        const options: AdOptions = {
          adId: ADMOB_INTERSTITIAL_ID,
          isTesting: true,
        };
        await AdMob.prepareInterstitial(options);
        await AdMob.showInterstitial();
      } catch {
        // تجاهل في المتصفح
      }
    }
  };

  useEffect(() => {
    const audio = new Audio();
    audio.preload = 'auto';
    playerRef.current = audio;

    if ('speechSynthesis' in window) {
      window.speechSynthesis.getVoices();
      window.speechSynthesis.onvoiceschanged = () => {
        window.speechSynthesis.getVoices();
      };
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem('translator_history_v1', JSON.stringify(history));
    } catch (e) {
      console.error('Failed to save history', e);
    }
  }, [history]);

  useEffect(() => {
    if (!currentMessage || currentMessage.translation.startsWith('⚡')) return;
    if (autoClearTimerRef.current) clearTimeout(autoClearTimerRef.current);

    autoClearTimerRef.current = setTimeout(() => {
      clearScreenAndSave();
    }, 15000);

    return () => {
      if (autoClearTimerRef.current) clearTimeout(autoClearTimerRef.current);
    };
  }, [currentMessage]);

  const unlockAudioInMobile = () => {
    if (playerRef.current) {
      playerRef.current.src = SILENT_AUDIO;
      playerRef.current.play().catch(() => {});
    }
    if ('speechSynthesis' in window) {
      const u = new SpeechSynthesisUtterance('');
      window.speechSynthesis.speak(u);
    }
  };

  const clearScreenAndSave = () => {
    setCurrentMessage(null);
    setLiveTranscript('');
    setSessionMessages((prev) => {
      if (prev.length > 0) {
        const newSession: ConversationSession = {
          id: Date.now().toString(),
          date: new Date().toLocaleString('ar-MA', {
            day: '2-digit',
            month: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
          }),
          messages: [...prev],
        };
        setHistory((h) => [newSession, ...h]);
      }
      return [];
    });
  };

  const getPromptLangName = (code: string) => {
    return ALL_LANGUAGES.find((l) => l.code === code)?.promptName || code;
  };

  const getRecognitionLang = (code: string) => {
    if (code === 'ar-001') return 'ar-SA';
    return code;
  };

  const speakText = (text: string, lang: string) => {
    if (!text || text.startsWith('⚡')) return;

    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }

    const ttsLang = lang.startsWith('ar') ? 'ar-SA' : lang;
    const ttsUrl = `${API_BASE_URL}/api/translate?tts=1&lang=${encodeURIComponent(ttsLang)}&text=${encodeURIComponent(text.slice(0, 200))}`;

    const player = playerRef.current || new Audio();
    playerRef.current = player;
    player.pause();
    player.src = ttsUrl;

    player.onerror = () => {
      if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = ttsLang;
        utterance.rate = 0.95;
        window.speechSynthesis.speak(utterance);
      }
    };

    player.play().catch(() => {
      if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = ttsLang;
        utterance.rate = 0.95;
        window.speechSynthesis.speak(utterance);
      }
    });
  };

  const startSpeechRecognition = (sender: 'user' | 'guest') => {
    unlockAudioInMobile();

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('المتصفح لا يدعم تسجيل الصوت.');
      return;
    }

    const recognition = new SpeechRecognition();
    const activeLang = sender === 'user' ? langUser : langGuest;
    recognition.lang = getRecognitionLang(activeLang);
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    setCurrentMessage(null);
    setLiveTranscript('');
    if (sender === 'user') setIsRecordingUser(true);
    else setIsRecordingGuest(true);

    let finalTranscript = '';

    recognition.onresult = (event: any) => {
      let interim = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript;
        } else {
          interim += transcript;
        }
      }
      setLiveTranscript(finalTranscript || interim);
    };

    recognition.onend = async () => {
      setIsRecordingUser(false);
      setIsRecordingGuest(false);

      const speechText = (finalTranscript || liveTranscript).trim();
      setLiveTranscript('');

      if (!speechText) return;

      const sourceLang = sender === 'user' ? langUser : langGuest;
      const targetLang = sender === 'user' ? langGuest : langUser;
      const msgId = Date.now().toString();

      const pendingMsg: Message = {
        id: msgId,
        sender,
        text: speechText,
        translation: '⚡ جاري الترجمة...',
        timestamp: new Date().toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
        }),
        sourceLang,
        targetLang,
      };

      setCurrentMessage(pendingMsg);

      try {
        const response = await fetch(`${API_BASE_URL}/api/translate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: speechText,
            source: getPromptLangName(sourceLang),
            target: getPromptLangName(targetLang),
          }),
        });
        const data = await response.json();
        const translationText =
          data.translation || 'تعذرت الترجمة، حاول مجدداً';

        const completedMsg: Message = {
          ...pendingMsg,
          translation: translationText,
        };

        setCurrentMessage(completedMsg);
        setSessionMessages((prev) => [...prev, completedMsg]);
        speakText(translationText, targetLang);

        const nextCount = translationCount + 1;
        setTranslationCount(nextCount);
        triggerInterstitialAd(nextCount);
      } catch {
        setCurrentMessage({
          ...pendingMsg,
          translation: 'تعذر الاتصال بالخادم.',
        });
      }
    };

    recognition.onerror = () => {
      setIsRecordingUser(false);
      setIsRecordingGuest(false);
      setLiveTranscript('');
    };

    recognition.start();
  };

  const translateImageToLanguage = async (imageData: string, targetLangCode: string) => {
    setIsTranslatingCam(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/translate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image: imageData,
          target: getPromptLangName(targetLangCode),
        }),
      });
      const data = await response.json();
      const result = data.translation || 'لم يتم العثور على نص واضح.';
      setCamTranslation(result);
      speakText(result, targetLangCode);
    } catch {
      setCamTranslation('فشلت ترجمة الصورة.');
    } finally {
      setIsTranslatingCam(false);
    }
  };

  const openCamera = async () => {
    unlockAudioInMobile();
    setCamTargetLang(langUser);
    setCameraActive(true);
    setCapturedImage(null);
    setCamTranslation('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch {
      alert('لا يمكن الوصول إلى الكاميرا.');
      setCameraActive(false);
    }
  };

  const captureAndTranslate = async () => {
    unlockAudioInMobile();
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const imageData = canvas.toDataURL('image/jpeg', 0.8);
        setCapturedImage(imageData);

        const stream = video.srcObject as MediaStream;
        stream?.getTracks().forEach((track) => track.stop());
        setCameraActive(false);

        await translateImageToLanguage(imageData, camTargetLang);
      }
    }
  };

  return (
    <div
      className="min-h-screen bg-gradient-to-b from-zinc-950 via-neutral-900 to-zinc-950 text-zinc-100 flex flex-col justify-between pb-16 font-sans overflow-x-hidden"
      dir="rtl"
    >
      {/* الترويسة */}
      <header className="p-3.5 bg-zinc-900/90 backdrop-blur-md border-b border-emerald-500/20 flex justify-between items-center shadow-lg">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-zinc-950 flex items-center justify-center font-extrabold text-base shadow-md shadow-emerald-500/20">
            AI
          </div>
          <div>
            <h1 className="text-sm font-bold text-white leading-tight">
              المترجم الذكي الفوري
            </h1>
            <p className="text-[10px] text-emerald-400/90">
              34 لغة ولهجة • شاشة ذكية نظيفة
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {(currentMessage || sessionMessages.length > 0) && (
            <button
              onClick={clearScreenAndSave}
              title="مسح الشاشة وحفظ في السجل"
              className="px-2.5 py-1.5 bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/40 rounded-xl text-[11px] font-bold transition"
            >
              🧹 مسح وحفظ
            </button>
          )}

          <button
            onClick={() => setShowHistory(true)}
            className="relative px-2.5 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-amber-300 border border-zinc-700 rounded-xl text-[11px] font-medium transition"
          >
            🕒 السجل
            {history.length > 0 && (
              <span className="mr-1 px-1.5 py-0.2 bg-amber-400 text-zinc-950 rounded-full text-[9px] font-bold">
                {history.length}
              </span>
            )}
          </button>

          <button
            onClick={openCamera}
            className="px-2.5 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-teal-300 border border-zinc-700 rounded-xl text-[11px] font-medium transition"
          >
            📷
          </button>
        </div>
      </header>

      {/* ساحة العرض النظيفة */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-4">
        {liveTranscript ? (
          <div
            dir="auto"
            className="w-full max-w-md p-5 rounded-3xl bg-zinc-900/90 border border-emerald-500/40 text-center text-base text-emerald-300 animate-pulse shadow-xl"
          >
            🎙️ {liveTranscript}...
          </div>
        ) : currentMessage ? (
          <div
            className={`w-full max-w-md p-5 rounded-3xl shadow-2xl transition-all duration-300 ${
              currentMessage.sender === 'user'
                ? 'bg-gradient-to-br from-emerald-950/90 to-zinc-900 border border-emerald-500/40'
                : 'bg-gradient-to-br from-amber-950/60 to-zinc-900 border border-amber-500/40'
            }`}
          >
            <div className="flex justify-between items-center text-[11px] text-zinc-400 mb-2">
              <span className="font-semibold text-emerald-400">
                {currentMessage.sender === 'user' ? '● أنت' : '● الضيف'}
              </span>
              <span>{currentMessage.timestamp}</span>
            </div>

            <p dir="auto" className="text-sm text-zinc-300 leading-relaxed mb-3">
              {currentMessage.text}
            </p>

            <div className="pt-3 border-t border-zinc-800/80 flex items-center justify-between gap-3">
              <p
                dir="auto"
                className={`text-xl font-bold leading-snug ${
                  currentMessage.translation.startsWith('⚡')
                    ? 'text-sm text-emerald-300 animate-pulse font-normal'
                    : 'text-white'
                }`}
              >
                {currentMessage.translation}
              </p>

              {!currentMessage.translation.startsWith('⚡') && (
                <button
                  onClick={() =>
                    speakText(
                      currentMessage.translation,
                      currentMessage.targetLang
                    )
                  }
                  className="p-3 bg-gradient-to-tr from-emerald-500 to-teal-400 text-zinc-950 hover:opacity-90 active:scale-95 rounded-2xl text-base shrink-0 shadow-lg shadow-emerald-500/20 font-bold"
                >
                  🔊
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center text-center text-zinc-500 py-10">
            <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-3xl mb-3">
              🎙️
            </div>
            <p className="text-sm font-semibold text-zinc-200">
              الشاشة جاهزة ونظيفة
            </p>
            <p className="text-xs text-zinc-500 mt-1 max-w-xs">
              كل ترجمة جديدة تظهر هنا بوضوح وتُحفظ تلقائياً في السجل حتى تبقى الشاشة مريحة للعين
            </p>
          </div>
        )}
      </main>

      {/* نافذة السجل */}
      {showHistory && (
        <div className="fixed inset-0 bg-zinc-950/95 backdrop-blur-md z-50 flex flex-col p-4">
          <div className="flex justify-between items-center border-b border-zinc-800 pb-3">
            <h2 className="text-base font-bold text-amber-300">
              🕒 سجل المحادثات المحفوظة ({history.length})
            </h2>
            <div className="flex items-center gap-2">
              {history.length > 0 && (
                <button
                  onClick={() => setHistory([])}
                  className="px-2.5 py-1 bg-rose-500/20 text-rose-300 border border-rose-500/30 rounded-lg text-xs"
                >
                  مسح الكل
                </button>
              )}
              <button
                onClick={() => setShowHistory(false)}
                className="px-3 py-1 bg-zinc-800 rounded-lg text-xs text-white"
              >
                إغلاق ✕
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto py-4 space-y-4">
            {history.length === 0 ? (
              <p className="text-center text-zinc-500 text-sm py-20">
                لا توجد محادثات محفوظة في السجل بعد.
              </p>
            ) : (
              history.map((session) => (
                <div
                  key={session.id}
                  className="bg-zinc-900 border border-zinc-800 rounded-2xl p-3.5 space-y-2.5"
                >
                  <div className="flex justify-between items-center text-[11px] text-zinc-400 border-b border-zinc-800 pb-1.5">
                    <span>📅 {session.date}</span>
                    <span>{session.messages.length} جمل</span>
                  </div>
                  {session.messages.map((m, i) => (
                    <div
                      key={i}
                      className="bg-zinc-950 p-2.5 rounded-xl border border-zinc-800/80 space-y-1"
                    >
                      <p dir="auto" className="text-xs text-zinc-400">
                        {m.text}
                      </p>
                      <div className="flex justify-between items-center gap-2">
                        <p dir="auto" className="text-sm font-bold text-white">
                          {m.translation}
                        </p>
                        <button
                          onClick={() => speakText(m.translation, m.targetLang)}
                          className="p-1.5 bg-emerald-500/20 text-emerald-300 rounded text-xs"
                        >
                          🔊
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* واجهة الكاميرا مع اختيار لغة الترجمة */}
      {cameraActive && (
        <div className="fixed inset-0 bg-black z-50 flex flex-col justify-between p-4">
          <div className="flex justify-between items-center text-white gap-2">
            <span className="text-xs font-semibold shrink-0">ترجم إلى:</span>
            <select
              value={camTargetLang}
              onChange={(e) => setCamTargetLang(e.target.value)}
              className="flex-1 min-w-0 bg-zinc-900 border border-emerald-500/40 p-1.5 rounded-xl text-xs text-white outline-none truncate"
            >
              {ALL_LANGUAGES.map((l) => (
                <option key={l.code} value={l.code}>
                  {l.label}
                </option>
              ))}
            </select>
            <button
              onClick={() => {
                const stream = videoRef.current?.srcObject as MediaStream;
                stream?.getTracks().forEach((track) => track.stop());
                setCameraActive(false);
              }}
              className="px-3 py-1.5 bg-zinc-800 rounded-xl text-xs shrink-0"
            >
              إغلاق ✕
            </button>
          </div>
          <video
            ref={videoRef}
            autoPlay
            playsInline
            className="flex-1 w-full rounded-2xl object-cover my-4 border border-zinc-800"
          ></video>
          <button
            onClick={captureAndTranslate}
            className="w-16 h-16 bg-emerald-500 rounded-full border-4 border-white mx-auto flex items-center justify-center text-2xl shadow-lg"
          >
            📸
          </button>
          <canvas ref={canvasRef} className="hidden"></canvas>
        </div>
      )}

      {/* نتيجة ترجمة الكاميرا */}
      {capturedImage && (
        <div className="mx-4 mb-4 p-3.5 bg-zinc-900 border border-emerald-500/30 rounded-2xl space-y-3 overflow-hidden">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-2 gap-2">
            <span className="text-[11px] font-bold text-emerald-400 shrink-0">
              إلى:
            </span>
            <select
              value={camTargetLang}
              onChange={(e) => {
                const newLang = e.target.value;
                setCamTargetLang(newLang);
                translateImageToLanguage(capturedImage, newLang);
              }}
              className="flex-1 min-w-0 bg-zinc-950 border border-zinc-800 p-1.5 rounded-lg text-[11px] text-white outline-none truncate"
            >
              {ALL_LANGUAGES.map((l) => (
                <option key={l.code} value={l.code}>
                  {l.label}
                </option>
              ))}
            </select>
            <button
              onClick={() => setCapturedImage(null)}
              className="px-2 py-1 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-zinc-300 text-[11px] shrink-0"
            >
              إغلاق ✕
            </button>
          </div>
          <img
            src={capturedImage}
            alt="Captured"
            className="w-full h-28 object-cover rounded-xl"
          />
          {isTranslatingCam ? (
            <p className="text-xs text-center text-emerald-400 py-2 animate-pulse">
              جاري قراءة النص وترجمته...
            </p>
          ) : (
            <div className="bg-zinc-950 p-3 rounded-xl border border-zinc-800 flex justify-between items-center gap-2">
              <p dir="auto" className="text-sm text-white font-medium">
                {camTranslation}
              </p>
              <button
                onClick={() => speakText(camTranslation, camTargetLang)}
                className="p-2 bg-emerald-500 text-zinc-950 rounded-lg text-xs shrink-0 font-bold"
              >
                🔊
              </button>
            </div>
          )}
        </div>
      )}

      {/* التحكم السفلي */}
      <footer className="px-4 space-y-4">
        <div className="grid grid-cols-2 gap-3 bg-zinc-900/90 p-3 rounded-2xl border border-zinc-800 text-xs shadow-lg">
          <div className="min-w-0">
            <label className="text-[10px] text-emerald-400 font-semibold block mb-1">
              لغتك (أنت):
            </label>
            <select
              value={langUser}
              onChange={(e) => setLangUser(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 focus:border-emerald-500 p-2 rounded-xl text-white outline-none truncate"
            >
              {ALL_LANGUAGES.map((l) => (
                <option key={l.code} value={l.code}>
                  {l.label}
                </option>
              ))}
            </select>
          </div>
          <div className="min-w-0">
            <label className="text-[10px] text-amber-400 font-semibold block mb-1">
              لغة الطرف الآخر:
            </label>
            <select
              value={langGuest}
              onChange={(e) => setLangGuest(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 focus:border-amber-500 p-2 rounded-xl text-white outline-none truncate"
            >
              {ALL_LANGUAGES.map((l) => (
                <option key={l.code} value={l.code}>
                  {l.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 pt-1">
          <div className="flex flex-col items-center gap-2">
            <button
              onClick={() => startSpeechRecognition('user')}
              className={`w-20 h-20 rounded-full flex items-center justify-center text-3xl transition-all shadow-xl ${
                isRecordingUser
                  ? 'bg-rose-600 animate-pulse scale-95 shadow-rose-600/30'
                  : 'bg-gradient-to-tr from-emerald-600 to-teal-500 hover:opacity-95 active:scale-90 shadow-emerald-600/30'
              }`}
            >
              {isRecordingUser ? '⏹️' : '🎙️'}
            </button>
            <span className="text-xs font-bold text-emerald-400">تحدث أنت</span>
          </div>

          <div className="flex flex-col items-center gap-2">
            <button
              onClick={() => startSpeechRecognition('guest')}
              className={`w-20 h-20 rounded-full flex items-center justify-center text-3xl transition-all shadow-xl ${
                isRecordingGuest
                  ? 'bg-rose-600 animate-pulse scale-95 shadow-rose-600/30'
                  : 'bg-gradient-to-tr from-amber-500 to-orange-500 hover:opacity-95 active:scale-90 shadow-amber-500/30'
              }`}
            >
              {isRecordingGuest ? '⏹️' : '🎙️'}
            </button>
            <span className="text-xs font-bold text-amber-400">
              تحدث الضيف
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
