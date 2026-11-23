import React, { useState, useEffect, useRef } from 'react';

// الأيقونات المستعملة من Lucide (المكتبة لي ضفناها في index.html)
declare var lucide: any;

export default function App() {
  const [langUser, setLangUser] = useState('ar-MA');
  const [langGuest, setLangGuest] = useState('zh-CN');
  const [messages, setMessages] = useState<{ sender: 'user' | 'guest'; text: string; translation: string; timestamp: string }[]>([]);
  const [isRecordingUser, setIsRecordingUser] = useState(false);
  const [isRecordingGuest, setIsRecordingGuest] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [camTranslation, setCamTranslation] = useState('');
  const [isTranslatingCam, setIsTranslatingCam] = useState(false);
  const [systemAlert, setSystemAlert] = useState('⚠️ جاري التحميل... يرجى التأكد من إضافة GEMINI_API_KEY في Vercel.');

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // تشغيل الأيقونات التفاعلية
  useEffect(() => {
    if (typeof lucide !== 'undefined') {
      lucide.createIcons();
    }
    // فحص بيئة العمل (تحقق من المفتاح)
    setSystemAlert(''); // يمكن تحسينه للتحقق الفعلي
  }, [messages, cameraActive, capturedImage]);

  // دالة تحويل الصوت إلى كتابة (Speech-to-Text) والترجمة التلقائية
  const startSpeechRecognition = (sender: 'user' | 'guest') => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("المتصفح لا يدعم تسجيل الصوت. يرجى استخدام Chrome أو Safari.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = sender === 'user' ? langUser : langGuest;
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    if (sender === 'user') setIsRecordingUser(true);
    else setIsRecordingGuest(true);

    recognition.onresult = async (event: any) => {
      const speechText = event.results[0][0].transcript;
      
      // إرسال النص إلى الـ API للترجمة عبر Gemini
      const sourceLang = sender === 'user' ? langUser : langGuest;
      const targetLang = sender === 'user' ? langGuest : langUser;
      
      try {
        const response = await fetch('/api/translate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: speechText,
            source: sourceLang,
            target: targetLang,
            mode: 'محادثة صوتية فورية'
          })
        });
        const data = await response.json();
        const translationText = data.translation || "عذراً، تعذرت الترجمة الفورية.";

        const newMessage = {
          sender,
          text: speechText,
          translation: translationText,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };

        setMessages(prev => [...prev, newMessage]);
        speakText(translationText, targetLang); // نطق الترجمة تلقائياً للطرف الآخر

      } catch (err) {
        console.error(err);
      }
    };

    recognition.onend = () => {
      setIsRecordingUser(false);
      setIsRecordingGuest(false);
    };

    recognition.onerror = () => {
      setIsRecordingUser(false);
      setIsRecordingGuest(false);
    };

    recognition.start();
  };

  // دالة نطق النصوص بالصوت (Text-to-Speech)
  const speakText = (text: string, lang: string) => {
    if (!window.speechSynthesis) return;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang;
    window.speechSynthesis.speak(utterance);
  };

  // تفعيل كاميرا الهاتف لترجمة الصور
  const openCamera = async () => {
    setCameraActive(true);
    setCapturedImage(null);
    setCamTranslation('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      alert("لا يمكن الوصول إلى الكاميرا.");
      setCameraActive(false);
    }
  };

  // التقاط الصورة وترجمتها بـ Gemini
  const captureAndTranslate = async () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const imageData = canvas.toDataURL('image/jpeg');
        setCapturedImage(imageData);

        // إيقاف الكاميرا
        const stream = video.srcObject as MediaStream;
        if (stream) {
          stream.getTracks().forEach(track => track.stop());
        }
        setCameraActive(false);

        // إرسال الصورة للـ API للترجمة البصرية OCR
        setIsTranslatingCam(true);
        try {
          const response = await fetch('/api/translate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              image: imageData,
              target: langUser, // الترجمة إلى لغتك
              mode: 'ترجمة بصرية بالكاميرا OCR'
            })
          });
          const data = await response.json();
          setCamTranslation(data.translation || "لم يتم العثور على نصوص واضحة لترجمتها.");
        } catch (err) {
          setCamTranslation("فشلت عملية معالجة الصورة وترجمتها.");
        } finally {
          setIsTranslatingCam(false);
        }
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between pb-6 font-sans">
      {/* الترويسة العلوية */}
      <header className="p-4 bg-slate-900 border-b border-slate-800 flex justify-between items-center shadow-lg">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center font-bold text-lg shadow-md shadow-blue-500/20">AI</div>
          <div>
            <h1 className="text-base font-bold text-white leading-tight">المترجم الذكي الفوري</h1>
            <p className="text-[10px] text-slate-400">محادثات صوتية وترجمة بصرية بالكاميرا</p>
          </div>
        </div>
        <button onClick={openCamera} className="flex items-center gap-2 px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 active:scale-95 transition-all text-xs font-medium rounded-lg text-blue-400 border border-slate-700">
          <i data-lucide="camera" className="w-4 h-4"></i>
          ترجمة بالكاميرا
        </button>
      </header>

      {/* التنبيهات الفنية */}
      {systemAlert && (
        <div className="mx-4 mt-3 p-2.5 bg-amber-500/10 border border-amber-500/20 rounded-lg text-[10px] text-amber-400 flex items-center gap-2">
          <i data-lucide="alert-triangle" className="w-4 h-4 shrink-0"></i>
          <span>{systemAlert}</span>
        </div>
      )}

      {/* ساحة المحادثة (الشات السريع) */}
      <main className="flex-1 overflow-y-auto px-4 py-4 space-y-4 max-h-[50vh]">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center text-slate-500 py-12">
            <i data-lucide="message-square-dashed" className="w-12 h-12 mb-3 text-slate-700"></i>
            <p className="text-xs">اضغط على الميكروفون للبدء في المحادثة الفورية</p>
            <p className="text-[10px] text-slate-600 mt-1">تكلم بلغتك، وسيتكفل الذكاء الاصطناعي بنطقها للطرف الآخر</p>
          </div>
        ) : (
          messages.map((msg, idx) => (
            <div key={idx} className={`flex flex-col max-w-[85%] ${msg.sender === 'user' ? 'mr-auto items-start' : 'ml-auto items-end'}`}>
              <div className={`p-3 rounded-2xl ${msg.sender === 'user' ? 'bg-blue-600/10 border border-blue-500/20 text-blue-200' : 'bg-indigo-600/10 border border-indigo-500/20 text-indigo-200'}`}>
                <p className="text-xs text-slate-400 mb-1 font-mono text-[9px]">{msg.timestamp}</p>
                <p className="text-sm font-medium">{msg.text}</p>
                <div className="mt-2 pt-2 border-t border-slate-800 text-xs text-white font-semibold flex items-center gap-2">
                  <i data-lucide="languages" className="w-3.5 h-3.5 text-blue-400"></i>
                  <span>{msg.translation}</span>
                  <button onClick={() => speakText(msg.translation, msg.sender === 'user' ? langGuest : langUser)} className="p-1 hover:bg-slate-800 rounded">
                    <i data-lucide="volume-2" className="w-3.5 h-3.5 text-slate-400"></i>
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </main>

      {/* الكاميرا وترجمة الصور (إن كانت نشطة) */}
      {cameraActive && (
        <div className="fixed inset-0 bg-black z-50 flex flex-col justify-between p-4">
          <div className="flex justify-between items-center text-white">
            <span className="text-xs font-semibold">وجه الكاميرا نحو النص المراد ترجمته</span>
            <button onClick={() => {
              const stream = videoRef.current?.srcObject as MediaStream;
              stream?.getTracks().forEach(track => track.stop());
              setCameraActive(false);
            }} className="p-2 bg-slate-950 rounded-full"><i data-lucide="x" className="w-5 h-5"></i></button>
          </div>
          <video ref={videoRef} autoPlay playsInline className="flex-1 w-full rounded-2xl object-cover my-4 border border-slate-800"></video>
          <button onClick={captureAndTranslate} className="w-16 h-16 bg-red-600 hover:bg-red-700 active:scale-95 rounded-full border-4 border-white mx-auto flex items-center justify-center shadow-lg shadow-red-600/30">
            <i data-lucide="camera" className="w-6 h-6 text-white"></i>
          </button>
          <canvas ref={canvasRef} className="hidden"></canvas>
        </div>
      )}

      {/* واجهة ترجمة الكاميرا الـ OCR بعد التقاط الصورة */}
      {capturedImage && (
        <div className="m-4 p-4 bg-slate-900 border border-slate-800 rounded-2xl space-y-3">
          <div className="flex justify-between items-center border-b border-slate-800 pb-2">
            <span className="text-xs font-bold text-blue-400 flex items-center gap-2"><i data-lucide="image" className="w-4 h-4"></i> ترجمة الكاميرا</span>
            <button onClick={() => setCapturedImage(null)} className="text-slate-500 hover:text-white"><i data-lucide="x" className="w-4 h-4"></i></button>
          </div>
          <img src={capturedImage} alt="اللقطة" className="w-full h-32 object-cover rounded-xl border border-slate-800" />
          {isTranslatingCam ? (
            <div className="text-xs text-slate-400 flex items-center gap-2 justify-center py-4"><i data-lucide="loader" className="w-4 h-4 animate-spin"></i> جاري استخراج النص وترجمته بـ Gemini...</div>
          ) : (
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-850">
              <p className="text-xs text-slate-400 mb-1">الترجمة البصرية:</p>
              <p className="text-sm text-white font-medium">{camTranslation}</p>
            </div>
          )}
        </div>
      )}

      {/* أزرار المحادثة الثنائية (Dual Controls) */}
      <footer className="px-4 space-y-4">
        {/* إعداد اللغات ثنائية الاتجاه */}
        <div className="grid grid-cols-2 gap-3 bg-slate-900 p-2.5 rounded-xl border border-slate-800 text-xs">
          <div>
            <label className="text-[10px] text-blue-400 block mb-1">لغتك أنت (المضيف):</label>
            <select value={langUser} onChange={(e) => setLangUser(e.target.value)} className="w-full bg-slate-950 border border-slate-800 p-1 rounded font-medium text-white">
              <option value="ar-MA">العربية (المغربية)</option>
              <option value="fr-FR">الفرنسية (Français)</option>
              <option value="en-US">الإنجليزية (English)</option>
              <option value="es-ES">الإسبانية (Español)</option>
            </select>
          </div>
          <div>
            <label className="text-[10px] text-indigo-400 block mb-1">لغة الضيف (الأجنبي):</label>
            <select value={langGuest} onChange={(e) => setLangGuest(e.target.value)} className="w-full bg-slate-950 border border-slate-800 p-1 rounded font-medium text-white">
              <option value="zh-CN">الصينية (中文)</option>
              <option value="en-US">الإنجليزية (English)</option>
              <option value="es-ES">الإسبانية (Español)</option>
              <option value="de-DE">الألمانية (Deutsch)</option>
              <option value="it-IT">الإيطالية (Italiano)</option>
            </select>
          </div>
        </div>

        {/* الميكروفونات الضخمة ثنائية الاتجاه */}
        <div className="grid grid-cols-2 gap-4 pt-2">
          {/* جهة المستخدم العربي */}
          <div className="flex flex-col items-center gap-2">
            <span className="text-[10px] text-slate-400">تكلم أنت (لغتك)</span>
            <button
              onClick={() => startSpeechRecognition('user')}
              className={`w-20 h-20 rounded-full flex flex-col items-center justify-center transition-all ${
                isRecordingUser
                  ? 'bg-red-600 shadow-lg shadow-red-600/40 scale-95 animate-pulse'
                  : 'bg-gradient-to-tr from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 shadow-md shadow-blue-500/20 active:scale-90'
              }`}
            >
              {isRecordingUser ? (
                <div className="flex gap-0.5 items-center justify-center">
                  <div className="w-1 h-4 bg-white rounded voice-wave"></div>
                  <div className="w-1 h-6 bg-white rounded voice-wave" style={{ animationDelay: '0.2s' }}></div>
                  <div className="w-1 h-3 bg-white rounded voice-wave" style={{ animationDelay: '0.4s' }}></div>
                </div>
              ) : (
                <i data-lucide="mic" className="w-8 h-8 text-white"></i>
              )}
            </button>
            <span className="text-xs font-bold text-blue-400">{langUser === 'ar-MA' ? 'العربية' : langUser.split('-')[0].toUpperCase()}</span>
          </div>

          {/* جهة الضيف الأجنبي */}
          <div className="flex flex-col items-center gap-2">
            <span className="text-[10px] text-slate-400">يتكلم الضيف (الأجنبي)</span>
            <button
              onClick={() => startSpeechRecognition('guest')}
              className={`w-20 h-20 rounded-full flex flex-col items-center justify-center transition-all ${
                isRecordingGuest
                  ? 'bg-red-600 shadow-lg shadow-red-600/40 scale-95 animate-pulse'
                  : 'bg-gradient-to-tr from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 shadow-md shadow-indigo-500/20 active:scale-90'
              }`}
            >
              {isRecordingGuest ? (
                <div className="flex gap-0.5 items-center justify-center">
                  <div className="w-1 h-4 bg-white rounded voice-wave"></div>
                  <div className="w-1 h-6 bg-white rounded voice-wave" style={{ animationDelay: '0.2s' }}></div>
                  <div className="w-1 h-3 bg-white rounded voice-wave" style={{ animationDelay: '0.4s' }}></div>
                </div>
              ) : (
                <i data-lucide="mic" className="w-8 h-8 text-white"></i>
              )}
            </button>
            <span className="text-xs font-bold text-indigo-400">
              {langGuest === 'zh-CN' ? '中文' : langGuest.split('-')[0].toUpperCase()}
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
