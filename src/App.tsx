import React, { useState, useRef, useEffect } from 'react';
import {
  AdMob,
  BannerAdOptions,
  BannerAdSize,
  BannerAdPosition,
  AdOptions,
} from '@capacitor-community/admob';

// رابط السيرفر السحابي المعتمد للمشروع
const API_BASE_URL = 'https://app-ash.vercel.app';

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
  const [langUser, setLangUser] = useState('ar-
