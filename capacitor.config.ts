import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.lamistock.factory',
  appName: 'LamiStock',
  webDir: 'dist',
  server: {
    url: 'http://192.168.1.34:5173',
    cleartext: true
  }
};

export default config;
