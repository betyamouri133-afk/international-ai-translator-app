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
        inlineData: {
          mimeType: 'image/jpeg',
          data: base64Data,
        },
      });
      parts.push({
        text: `Extract any text from this image and translate it accurately into ${tgt}. Return ONLY the translated text without any extra explanations.`,
      });
    } else {
      if (!text || !text.trim()) {
        return res.status(400).json({ translation: 'النص فارغ' });
      }
      parts.push({
        text: `Translate the following text from ${src} to ${tgt} naturally for a real-time conversation. Return ONLY the translation without quotes or extra words:\n\n"${text}"`,
      });
    }

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts }],
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return res.status(500).json({
        translation: `خطأ من Google API: ${data.error?.message || 'تأكد من صلاحية المفتاح'}`,
      });
    }

    const translation = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || 'لم يتم الحصول على ترجمة';
    return res.status(200).json({ translation });
  } catch (error) {
    return res.status(500).json({ translation: `خطأ في الخادم: ${error.message}` });
  }
}
