export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

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
        text: `Translate naturally from ${src} to ${tgt} (if Arabic, use natural spoken Moroccan Darija if requested, otherwise clear Arabic). Return ONLY the translation:\n"${text}"`,
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
            generationConfig: { temperature: 0.2, maxOutputTokens: 256 },
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
