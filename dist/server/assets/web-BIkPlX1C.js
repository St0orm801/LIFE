import { W as WebPlugin } from "./app-N6zyX3eS.js";
import "./server-zDF_ccTR.js";
import "node:async_hooks";
import "node:stream";
import "util";
import "crypto";
import "async_hooks";
import "stream";
import "./router-KgvdznhF.js";
class AppWeb extends WebPlugin {
  constructor() {
    super();
    this.handleVisibilityChange = () => {
      const data = {
        isActive: document.hidden !== true
      };
      this.notifyListeners("appStateChange", data);
      if (document.hidden) {
        this.notifyListeners("pause", null);
      } else {
        this.notifyListeners("resume", null);
      }
    };
    document.addEventListener("visibilitychange", this.handleVisibilityChange, false);
  }
  exitApp() {
    throw this.unimplemented("Not implemented on web.");
  }
  async getInfo() {
    throw this.unimplemented("Not implemented on web.");
  }
  async getLaunchUrl() {
    return { url: "" };
  }
  async getState() {
    return { isActive: document.hidden !== true };
  }
  async minimizeApp() {
    throw this.unimplemented("Not implemented on web.");
  }
  async toggleBackButtonHandler() {
    throw this.unimplemented("Not implemented on web.");
  }
  async getAppLanguage() {
    return {
      value: navigator.language.split("-")[0].toLowerCase()
    };
  }
}
export {
  AppWeb
};
