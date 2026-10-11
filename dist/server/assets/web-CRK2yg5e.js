import { W as WebPlugin } from "./app-IEcFZlYR.js";
import "./server-BYXv4CDl.js";
import "node:async_hooks";
import "node:stream";
import "util";
import "crypto";
import "async_hooks";
import "stream";
import "./router-D9emHzeH.js";
class ShareWeb extends WebPlugin {
  async canShare() {
    if (typeof navigator === "undefined" || !navigator.share) {
      return { value: false };
    } else {
      return { value: true };
    }
  }
  async share(options) {
    if (typeof navigator === "undefined" || !navigator.share) {
      throw this.unavailable("Share API not available in this browser");
    }
    await navigator.share({
      title: options.title,
      text: options.text,
      url: options.url
    });
    return {};
  }
}
export {
  ShareWeb
};
