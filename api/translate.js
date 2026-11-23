export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { text, sourceLang, targetLang, tone } = req.body;
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return res.status(500).json({ error: 'مفتاح GEMINI_API_KEY غير مضاف في إعدادات Vercel' });
  }

  if (!text || !text.trim()) {
    return res.status(400).json({ error: 'النص فارغ' });
  }

  const toneInstructions = {
    standard: 'ترجمة طبيعية، دقيقة، وسلسة تحافظ على المعنى الأصلي بدقة احترافية.',
    formal: 'ترجمة رسمية واحترافية تناسب المراسلات التجارية، الشركات، والوثائق الرسمية.',
    casual: 'ترجمة ودية وعفوية تناسب المحادثات اليومية ووسائل التواصل الاجتماعي.',
    technical: 'ترجمة تقنية دقيقة تحافظ على المصطلحات العلمية والبرمجية والتقنية المعتمدة.',
    creative: 'ترجمة إبداعية وتسويقية جذابة بأسلوب بليغ ومؤثر.'
  };

  const prompt = `أنت مترجم خبير بمستوى عالمي (مثل DeepL).
المطلوب: ترجمة النص التالي من (${sourceLang === 'auto' ? 'اكتشاف اللغة تلقائياً' : sourceLang}) إلى (${targetLang}).
الأسلوب والنبرة المطلوبة: ${toneInstructions[tone] || toneInstructions.standard}

أجب بصيغة JSON فقط بدون أي نص إضافي أو علامات markdown، بالشكل التالي:
{
  "detectedLang": "اسم اللغة المكتشفة بالعربية",
  "translation": "النص المترجم بدقة",
  "alternatives": ["بديل أو صياغة ثانية للترجمة", "صياغة ثالثة إن وجدت"],
  "notes": "ملاحظة لغوية أو ثقافية قصيرة جداً إذا كانت مفيدة، أو اتركها فارغة"
}

النص المراد ترجمته:
"""
${text}
"""`;

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.3,
            responseMimeType: 'application/json'
          }
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({
        error: data.error?.message || 'حدث خطأ أثناء الاتصال بمحرك الذكاء الاصطناعي'
      });
    }

    const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
    const parsed = JSON.parse(rawText);

    return res.status(200).json(parsed);
  } catch (error) {
    return res.status(500).json({ error: 'فشل في معالجة الترجمة: ' + error.message });
  }
}
