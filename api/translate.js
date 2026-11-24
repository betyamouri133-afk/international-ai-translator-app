export default async function handler(req, res) {
  // 1. خدمة النطق الصوتي المباشر عبر GET (أسرع وأخف للمتصفح)
  if (req.method === 'GET' && req.query.tts === '1') {
    try {
      const text = (req.query.text || '').toString().slice(0, 200);
      const rawLang = (req.query.lang || 'en').toString().toLowerCase();
      if (!text) return res.status(400).send('No text');

      let ttsLang = rawLang.split('-')[0];
      if (rawLang.startsWith('zh')) ttsLang = 'zh-CN';
      if (rawLang.startsWith('pt')) ttsLang = 'pt';

      const encoded = encodeURIComponent(text);
      const url = `https://translate.googleapis.com/translate_tts?ie=UTF-8&q=${encoded}&tl=${ttsLang}&client=gtx`;

      const audioRes = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Referer': 'https://translate.google.com/',
        },
      });

      if (!audioRes.ok) {
        return res.status(502).send('TTS failed');
      }

      const arrayBuffer = await audioRes.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      res.setHeader('Content-Type', 'audio/mpeg');
      res.setHeader('Cache-Control', 'public, max-age=86400');
      return res.status(200).send(buffer);
    } catch (e) {
      return res.status(500).send(e.message);
    }
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // 2. خدمة الترجمة الفورية عبر Gemini
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ translation: 'خطأ: تأكد من إضافة GEMINI_API_KEY في Vercel' });
  }

  try {
    const { text, image, source, target, sourceLang, targetLang } = req.body;
    const src = source || sourceLang || 'auto';
    const tgt = target || targetLang || 'العربية';
    const parts = [];

    if (image) {
      const base64Data = image.replace(/^data:image\/\w+;base64,/, '');
      parts.push({
        inlineData: { mimeType: 'image/jpeg', data: base64Data },
      });
      parts.push({
        text: `Extract any text from this image and translate it accurately into ${tgt}. Return ONLY the translated text.`,
      });
    } else {
      if (!text || !text.trim()) {
        return res.status(400).json({ translation: 'النص فارغ' });
      }
      parts.push({
        text: `Translate naturally and accurately from ${src} to ${tgt}. If the target is an Arabic dialect (Moroccan Darija, Gulf Arabic, Egyptian, or Levantine), write it naturally in Arabic script only (never Latin/Arabizi). Return ONLY the translation:\n"${text}"`,
      });
    }

    const models = ['gemini-3.5-flash-lite', 'gemini-3.8-flash'];
    let lastError = 'تعذر الاتصال';

    for (const model of models) {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts }],
            generationConfig: { temperature: 0.15, maxOutputTokens: 180 },
          }),
        }
      );

      const data = await response.json();

      if (response.ok) {
        const translation = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
        if (translation) {
          return res.status(200).json({ translation });
        }
      } else {
        lastError = data.error?.message || lastError;
        if (response.status === 400 || response.status === 403) break;
      }
    }

    return res.status(503).json({
      translation: `الخادم مشغول مؤقتاً، أعد المحاولة (${lastError})`,
    });
  } catch (error) {
    return res.status(500).json({ translation: `خطأ في الخادم: ${error.message}` });
  }
}
