import React, { useState, useRef, useEffect } from 'react';

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
  // اللهجات العربية والعربية الفصحى
  { code: 'ar-MA', label: '🇲🇦 الدارجة المغربية', promptName: 'Moroccan Darija (Arabic script only)' },
  { code: 'ar-SA', label: '🇸🇦 اللهجة الخليجية', promptName: 'Gulf Arabic dialect (Khaleeji, Arabic script only)' },
  { code: 'ar-EG', label: '🇪🇬 اللهجة المصرية', promptName: 'Egyptian Arabic dialect (Masri, Arabic script only)' },
  { code: 'ar-LB', label: '🇱🇧 اللهجة الشامية', promptName: 'Levantine Arabic dialect (Arabic script only)' },
  { code: 'ar-001', label: '🌍 العربية الفصحى', promptName: 'Modern Standard Arabic' },

  // اللغات الآسيوية المطلوبة والأكثر انتشاراً
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

  // اللغات الأوروبية والعالمية
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

  // اللغات الإفريقية
  { code: 'sw-KE', label: '🇰🇪 السواحيلية (Kiswahili)', promptName: 'Swahili' },
  { code: 'ha-NG', label: '🇳🇬 الهوسا (Hausa)', promptName: 'Hausa' },
];

export default function App() {
  const [langUser, setLangUser] = useState('ar-MA');
  const [langGuest, setLangGuest] = useState('ja-JP');
  const [messages, setMessages] = useState<Message[]>([]);
  const [liveTranscript, setLiveTranscript] = useState('');
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
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const inactivityTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
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
    if (messages.length === 0) return;
    if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);

    inactivityTimerRef.current = setTimeout(() => {
      archiveCurrentCall();
    }, 45000);

    return () => {
      if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
    };
  }, [messages]);

  const archiveCurrentCall = () => {
    if (messages.length === 0) return;
    const newSession: ConversationSession = {
      id: Date.now().toString(),
      date: new Date().toLocaleString('ar-MA', {
        day: '2-digit',
        month: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      }),
      messages: [...messages],
    };
    setHistory((prev) => [newSession, ...prev]);
    setMessages([]);
  };

  const getPromptLangName = (code: string) => {
    return ALL_LANGUAGES.find((l) => l.code === code)?.promptName || code;
  };

  const getRecognitionLang = (code: string) => {
    if (code === 'ar-001') return 'ar-SA';
    return code;
  };

  const speakText = async (text: string, lang: string) => {
    if (!text || text.startsWith('⚡')) return;

    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }

    const ttsLang = lang.startsWith('ar') ? 'ar-SA' : lang;

    try {
      const res = await fetch('/api/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'tts',
          text,
          lang: ttsLang,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.audioBase64) {
          const audio = new Audio(data.audioBase64);
          audioRef.current = audio;
          await audio.play();
          return;
        }
      }
    } catch {
      // احتياطي: النطق المحلي من الهاتف
    }

    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = ttsLang;
      utterance.rate = 0.95;
      window.speechSynthesis.speak(utterance);
    }
  };

  const startSpeechRecognition = (sender: 'user' | 'guest') => {
    if ('speechSynthesis' in window) {
      const unlock = new SpeechSynthesisUtterance('');
      window.speechSynthesis.speak(unlock);
    }

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('المتصفح لا يدعم تسجيل الصوت. يرجى استخدام Chrome أو Safari.');
      return;
    }

    const recognition = new SpeechRecognition();
    const activeLang = sender === 'user' ? langUser : langGuest;
    recognition.lang = getRecognitionLang(activeLang);
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

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

      setMessages((prev) => [
        ...prev,
        {
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
        },
      ]);

      try {
        const response = await fetch('/api/translate', {
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
          data.translation || 'خطأ: تأكد من إضافة GEMINI_API_KEY في Vercel';

        setMessages((prev) =>
          prev.map((m) =>
            m.id === msgId ? { ...m, translation: translationText } : m
          )
        );

        speakText(translationText, targetLang);
      } catch {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === msgId ? { ...m, translation: 'تعذر الاتصال بالخادم.' } : m
          )
        );
      }
    };

    recognition.onerror = () => {
      setIsRecordingUser(false);
      setIsRecordingGuest(false);
      setLiveTranscript('');
    };

    recognition.start();
  };

  const openCamera = async () => {
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

        setIsTranslatingCam(true);
        try {
          const response = await fetch('/api/translate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              image: imageData,
              target: getPromptLangName(langUser),
            }),
          });
          const data = await response.json();
          const result = data.translation || 'لم يتم العثور على نص واضح.';
          setCamTranslation(result);
          speakText(result, langUser);
        } catch {
          setCamTranslation('فشلت ترجمة الصورة.');
        } finally {
          setIsTranslatingCam(false);
        }
      }
    }
  };

  return (
    <div
      className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between pb-6 font-sans"
      dir="rtl"
    >
      {/* الترويسة */}
      <header className="p-3.5 bg-slate-900 border-b border-slate-800 flex justify-between items-center shadow-lg">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center font-bold text-base shadow-md">
            AI
          </div>
          <div>
            <h1 className="text-sm font-bold text-white leading-tight">
              المترجم الذكي الفوري
            </h1>
            <p className="text-[10px] text-slate-400">
              34 لغة ولهجة عالمية • صوت • كاميرا
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {messages.length > 0 && (
            <button
              onClick={archiveCurrentCall}
              className="px-2.5 py-1.5 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/40 rounded-xl text-[11px] font-bold transition"
            >
              ✓ إنهاء وحفظ
            </button>
          )}

          <button
            onClick={() => setShowHistory(true)}
            className="relative px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-amber-400 border border-slate-700 rounded-xl text-[11px] font-medium transition"
          >
            🕒 السجل
            {history.length > 0 && (
              <span className="mr-1 px-1.5 py-0.2 bg-amber-500 text-slate-950 rounded-full text-[9px] font-bold">
                {history.length}
              </span>
            )}
          </button>

          <button
            onClick={openCamera}
            className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-blue-400 border border-slate-700 rounded-xl text-[11px] font-medium transition"
          >
            📷
          </button>
        </div>
      </header>

      {/* ساحة المحادثة */}
      <main className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {messages.length === 0 && !liveTranscript ? (
          <div className="h-full flex flex-col items-center justify-center text-center text-slate-500 py-14">
            <div className="text-4xl mb-3 opacity-60">🎙️</div>
            <p className="text-sm font-medium text-slate-300">
              ابدأ المحادثة الفورية الآن
            </p>
            <p className="text-xs text-slate-500 mt-1 max-w-xs">
              اختر من بين 34 لغة ولهجة (اليابانية، الكورية، الهندية، الخليجية، المصرية، الدارجة...) وتحدث فوراً
            </p>
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex flex-col max-w-[85%] ${
                msg.sender === 'user'
                  ? 'mr-auto items-start'
                  : 'ml-auto items-end'
              }`}
            >
              <div
                className={`p-3.5 rounded-2xl ${
                  msg.sender === 'user'
                    ? 'bg-blue-600/20 border border-blue-500/30 text-blue-100'
                    : 'bg-indigo-600/20 border border-indigo-500/30 text-indigo-100'
                }`}
              >
                <p className="text-[10px] text-slate-400 mb-1">
                  {msg.timestamp}
                </p>
                <p className="text-sm">{msg.text}</p>
                <div className="mt-2 pt-2 border-t border-slate-800 text-sm text-white font-bold flex items-center justify-between gap-3">
                  <span
                    className={
                      msg.translation.startsWith('⚡')
                        ? 'text-xs text-blue-300 animate-pulse font-normal'
                        : ''
                    }
                  >
                    {msg.translation}
                  </span>
                  {!msg.translation.startsWith('⚡') && (
                    <button
                      onClick={() => speakText(msg.translation, msg.targetLang)}
                      className="p-1.5 bg-slate-800 hover:bg-slate-700 active:scale-95 rounded-lg text-xs shrink-0"
                    >
                      🔊
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}

        {liveTranscript && (
          <div className="p-3 rounded-2xl bg-slate-800/80 border border-blue-500/40 text-sm text-blue-200 animate-pulse">
            🎙️ {liveTranscript}...
          </div>
        )}
      </main>

      {/* نافذة السجل */}
      {showHistory && (
        <div className="fixed inset-0 bg-slate-950/95 z-50 flex flex-col p-4">
          <div className="flex justify-between items-center border-b border-slate-800 pb-3">
            <h2 className="text-base font-bold text-amber-400">
              🕒 سجل المحادثات السابقة ({history.length})
            </h2>
            <div className="flex items-center gap-2">
              {history.length > 0 && (
                <button
                  onClick={() => setHistory([])}
                  className="px-2.5 py-1 bg-red-600/20 text-red-400 border border-red-500/30 rounded-lg text-xs"
                >
                  مسح الكل
                </button>
              )}
              <button
                onClick={() => setShowHistory(false)}
                className="px-3 py-1 bg-slate-800 rounded-lg text-xs text-white"
              >
                إغلاق ✕
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto py-4 space-y-4">
            {history.length === 0 ? (
              <p className="text-center text-slate-500 text-sm py-20">
                لا توجد محادثات محفوظة في السجل بعد.
              </p>
            ) : (
              history.map((session) => (
                <div
                  key={session.id}
                  className="bg-slate-900 border border-slate-800 rounded-2xl p-3.5 space-y-2.5"
                >
                  <div className="flex justify-between items-center text-[11px] text-slate-400 border-b border-slate-800 pb-1.5">
                    <span>📅 {session.date}</span>
                    <span>{session.messages.length} جمل</span>
                  </div>
                  {session.messages.map((m, i) => (
                    <div
                      key={i}
                      className="bg-slate-950 p-2.5 rounded-xl border border-slate-800/80 space-y-1"
                    >
                      <p className="text-xs text-slate-400">{m.text}</p>
                      <div className="flex justify-between items-center gap-2">
                        <p className="text-sm font-bold text-white">
                          {m.translation}
                        </p>
                        <button
                          onClick={() => speakText(m.translation, m.targetLang)}
                          className="p-1 bg-slate-800 rounded text-xs"
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

      {/* واجهة الكاميرا */}
      {cameraActive && (
        <div className="fixed inset-0 bg-black z-50 flex flex-col justify-between p-4">
          <div className="flex justify-between items-center text-white">
            <span className="text-xs font-semibold">وجه الكاميرا نحو النص</span>
            <button
              onClick={() => {
                const stream = videoRef.current?.srcObject as MediaStream;
                stream?.getTracks().forEach((track) => track.stop());
                setCameraActive(false);
              }}
              className="px-3 py-1 bg-slate-800 rounded-lg text-xs"
            >
              إغلاق ✕
            </button>
          </div>
          <video
            ref={videoRef}
            autoPlay
            playsInline
            className="flex-1 w-full rounded-2xl object-cover my-4 border border-slate-800"
          ></video>
          <button
            onClick={captureAndTranslate}
            className="w-16 h-16 bg-red-600 rounded-full border-4 border-white mx-auto flex items-center justify-center text-2xl shadow-lg"
          >
            📸
          </button>
          <canvas ref={canvasRef} className="hidden"></canvas>
        </div>
      )}

      {/* نتيجة ترجمة الكاميرا */}
      {capturedImage && (
        <div className="mx-4 mb-4 p-4 bg-slate-900 border border-slate-800 rounded-2xl space-y-3">
          <div className="flex justify-between items-center border-b border-slate-800 pb-2">
            <span className="text-xs font-bold text-blue-400">ترجمة الصورة</span>
            <button
              onClick={() => setCapturedImage(null)}
              className="text-slate-400 text-xs"
            >
              إغلاق ✕
            </button>
          </div>
          <img
            src={capturedImage}
            alt="Captured"
            className="w-full h-32 object-cover rounded-xl"
          />
          {isTranslatingCam ? (
            <p className="text-xs text-center text-blue-400 py-2 animate-pulse">
              جاري قراءة النص وترجمته...
            </p>
          ) : (
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex justify-between items-center gap-2">
              <p className="text-sm text-white font-medium">{camTranslation}</p>
              <button
                onClick={() => speakText(camTranslation, langUser)}
                className="p-1.5 bg-slate-800 rounded-lg text-xs shrink-0"
              >
                🔊
              </button>
            </div>
          )}
        </div>
      )}

      {/* التحكم السفلي */}
      <footer className="px-4 space-y-4">
        <div className="grid grid-cols-2 gap-3 bg-slate-900 p-3 rounded-2xl border border-slate-800 text-xs">
          <div>
            <label className="text-[10px] text-blue-400 block mb-1">
              لغتك (أنت):
            </label>
            <select
              value={langUser}
              onChange={(e) => setLangUser(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 p-2 rounded-lg text-white"
            >
              {ALL_LANGUAGES.map((l) => (
                <option key={l.code} value={l.code}>
                  {l.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-[10px] text-indigo-400 block mb-1">
              لغة الطرف الآخر:
            </label>
            <select
              value={langGuest}
              onChange={(e) => setLangGuest(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 p-2 rounded-lg text-white"
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
              className={`w-20 h-20 rounded-full flex items-center justify-center text-3xl transition-all shadow-lg ${
                isRecordingUser
                  ? 'bg-red-600 animate-pulse scale-95'
                  : 'bg-blue-600 hover:bg-blue-500 active:scale-90'
              }`}
            >
              {isRecordingUser ? '⏹️' : '🎙️'}
            </button>
            <span className="text-xs font-bold text-blue-400">تحدث أنت</span>
          </div>

          <div className="flex flex-col items-center gap-2">
            <button
              onClick={() => startSpeechRecognition('guest')}
              className={`w-20 h-20 rounded-full flex items-center justify-center text-3xl transition-all shadow-lg ${
                isRecordingGuest
                  ? 'bg-red-600 animate-pulse scale-95'
                  : 'bg-indigo-600 hover:bg-indigo-500 active:scale-90'
              }`}
            >
              {isRecordingGuest ? '⏹️' : '🎙️'}
            </button>
            <span className="text-xs font-bold text-indigo-400">
              تحدث الضيف
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
