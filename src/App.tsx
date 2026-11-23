import React, { useState, useRef } from 'react';

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

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const startSpeechRecognition = (sender: 'user' | 'guest') => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("المتصفح لا يدعم تسجيل الصوت. يرجى استخدام Chrome أو Safari.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = sender === 'user' ? langUser : langGuest;
    recognition.interimResults = false;

    if (sender === 'user') setIsRecordingUser(true);
    else setIsRecordingGuest(true);

    recognition.onresult = async (event: any) => {
      const speechText = event.results[0][0].transcript;
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
        const translationText = data.translation || "خطأ: تأكد من إضافة GEMINI_API_KEY في Vercel";

        setMessages(prev => [...prev, {
          sender,
          text: speechText,
          translation: translationText,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }]);
        speakText(translationText, targetLang);
      } catch (err) {
        alert("تعذر الاتصال بالخادم للترجمة.");
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

  const speakText = (text: string, lang: string) => {
    if (!window.speechSynthesis) return;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang;
    window.speechSynthesis.speak(utterance);
  };

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

        const stream = video.srcObject as MediaStream;
        stream?.getTracks().forEach(track => track.stop());
        setCameraActive(false);

        setIsTranslatingCam(true);
        try {
          const response = await fetch('/api/translate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              image: imageData,
              target: langUser,
              mode: 'ترجمة بصرية بالكاميرا OCR'
            })
          });
          const data = await response.json();
          setCamTranslation(data.translation || "لم يتم العثور على نص واضح.");
        } catch (err) {
          setCamTranslation("فشلت ترجمة الصورة.");
        } finally {
          setIsTranslatingCam(false);
        }
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between pb-6 font-sans" dir="rtl">
      {/* الترويسة */}
      <header className="p-4 bg-slate-900 border-b border-slate-800 flex justify-between items-center shadow-lg">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center font-bold text-lg shadow-md">AI</div>
          <div>
            <h1 className="text-base font-bold text-white leading-tight">المترجم الذكي الفوري</h1>
            <p className="text-[10px] text-slate-400">محادثات صوتية وترجمة بالكاميرا</p>
          </div>
        </div>
        <button onClick={openCamera} className="flex items-center gap-2 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 active:scale-95 transition-all text-xs font-medium rounded-xl text-blue-400 border border-slate-700">
          <span>📷</span>
          <span>الكاميرا</span>
        </button>
      </header>

      {/* ساحة المحادثة */}
      <main className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center text-slate-500 py-16">
            <div className="text-4xl mb-3 opacity-50">🎙️</div>
            <p className="text-sm font-medium text-slate-300">ابدأ المحادثة الفورية الآن</p>
            <p className="text-xs text-slate-500 mt-1 max-w-xs">اضغط على زر الميكروفون الخاص بك وتكلم، وسيقوم الذكاء الاصطناعي بالترجمة والنطق فوراً</p>
          </div>
        ) : (
          messages.map((msg, idx) => (
            <div key={idx} className={`flex flex-col max-w-[85%] ${msg.sender === 'user' ? 'mr-auto items-start' : 'ml-auto items-end'}`}>
              <div className={`p-3.5 rounded-2xl ${msg.sender === 'user' ? 'bg-blue-600/20 border border-blue-500/30 text-blue-100' : 'bg-indigo-600/20 border border-indigo-500/30 text-indigo-100'}`}>
                <p className="text-[10px] text-slate-400 mb-1">{msg.timestamp}</p>
                <p className="text-sm">{msg.text}</p>
                <div className="mt-2 pt-2 border-t border-slate-800 text-sm text-white font-bold flex items-center justify-between gap-3">
                  <span>{msg.translation}</span>
                  <button onClick={() => speakText(msg.translation, msg.sender === 'user' ? langGuest : langUser)} className="p-1.5 bg-slate-800 rounded-lg text-xs">
                    🔊
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </main>

      {/* واجهة الكاميرا */}
      {cameraActive && (
        <div className="fixed inset-0 bg-black z-50 flex flex-col justify-between p-4">
          <div className="flex justify-between items-center text-white">
            <span className="text-xs font-semibold">وجه الكاميرا نحو النص</span>
            <button onClick={() => {
              const stream = videoRef.current?.srcObject as MediaStream;
              stream?.getTracks().forEach(track => track.stop());
              setCameraActive(false);
            }} className="px-3 py-1 bg-slate-800 rounded-lg text-xs">إغلاق ✕</button>
          </div>
          <video ref={videoRef} autoPlay playsInline className="flex-1 w-full rounded-2xl object-cover my-4 border border-slate-800"></video>
          <button onClick={captureAndTranslate} className="w-16 h-16 bg-red-600 rounded-full border-4 border-white mx-auto flex items-center justify-center text-2xl shadow-lg">
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
            <button onClick={() => setCapturedImage(null)} className="text-slate-400 text-xs">إغلاق ✕</button>
          </div>
          <img src={capturedImage} alt="Captured" className="w-full h-32 object-cover rounded-xl" />
          {isTranslatingCam ? (
            <p className="text-xs text-center text-blue-400 py-2 animate-pulse">جاري قراءة النص وترجمته...</p>
          ) : (
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
              <p className="text-sm text-white font-medium">{camTranslation}</p>
            </div>
          )}
        </div>
      )}

      {/* التحكم السفلي */}
      <footer className="px-4 space-y-4">
        <div className="grid grid-cols-2 gap-3 bg-slate-900 p-3 rounded-2xl border border-slate-800 text-xs">
          <div>
            <label className="text-[10px] text-blue-400 block mb-1">لغتك (أنت):</label>
            <select value={langUser} onChange={(e) => setLangUser(e.target.value)} className="w-full bg-slate-950 border border-slate-800 p-2 rounded-lg text-white">
              <option value="ar-MA">العربية (المغرب)</option>
              <option value="fr-FR">الفرنسية</option>
              <option value="en-US">الإنجليزية</option>
              <option value="es-ES">الإسبانية</option>
            </select>
          </div>
          <div>
            <label className="text-[10px] text-indigo-400 block mb-1">لغة الطرف الآخر:</label>
            <select value={langGuest} onChange={(e) => setLangGuest(e.target.value)} className="w-full bg-slate-950 border border-slate-800 p-2 rounded-lg text-white">
              <option value="zh-CN">الصينية (中文)</option>
              <option value="en-US">الإنجليزية</option>
              <option value="es-ES">الإسبانية</option>
              <option value="de-DE">الألمانية</option>
              <option value="fr-FR">الفرنسية</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 pt-1">
          <div className="flex flex-col items-center gap-2">
            <button
              onClick={() => startSpeechRecognition('user')}
              className={`w-20 h-20 rounded-full flex items-center justify-center text-3xl transition-all shadow-lg ${
                isRecordingUser ? 'bg-red-600 animate-pulse scale-95' : 'bg-blue-600 hover:bg-blue-500 active:scale-90'
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
                isRecordingGuest ? 'bg-red-600 animate-pulse scale-95' : 'bg-indigo-600 hover:bg-indigo-500 active:scale-90'
              }`}
            >
              {isRecordingGuest ? '⏹️' : '🎙️'}
            </button>
            <span className="text-xs font-bold text-indigo-400">تحدث الضيف</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
