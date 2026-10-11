import { Capacitor } from "@capacitor/core";
import { Directory, Encoding, Filesystem } from "@capacitor/filesystem";
import { Share } from "@capacitor/share";

export async function shareAttachment(filename: string, blob: Blob) {
  const bytes = new Uint8Array(await blob.arrayBuffer());
  let binary = "";
  for (let offset = 0; offset < bytes.length; offset += 8192) {
    binary += String.fromCharCode(...bytes.subarray(offset, offset + 8192));
  }
  const safeName = filename.replace(/[\\/\u0000-\u001f:]/g, "_") || "attachment";
  const { uri } = await Filesystem.writeFile({ path: `life-${Date.now()}-${safeName}`, data: btoa(binary), directory: Directory.Cache });
  await Share.share({ title: filename, files: [uri] });
}

export async function exportTextFile(filename: string, content: string, mime: string) {
  if (Capacitor.isNativePlatform()) {
    const { uri } = await Filesystem.writeFile({ path: filename, data: content, directory: Directory.Cache, encoding: Encoding.UTF8 });
    await Share.share({ title: "LIFE CLOCK export", files: [uri] });
    return;
  }
  const url = URL.createObjectURL(new Blob([content], { type: mime }));
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
