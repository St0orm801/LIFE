import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.st0orm801.life",
  appName: "LIFE CLOCK",
  webDir: "dist-mobile",
  android: { backgroundColor: "#f7f5f0" },
  ios: { backgroundColor: "#f7f5f0" },
  plugins: { LocalNotifications: { presentationOptions: ['sound', 'banner', 'list', 'badge'] } },
};
export default config;
