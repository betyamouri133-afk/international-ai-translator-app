import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.smarttranslator.app',
  appName: 'المترجم الذكي الفوري',
  webDir: 'dist',
  server: {
    url: 'https://app-ash.vercel.app',
    cleartext: true,
  },
};

export default config;
