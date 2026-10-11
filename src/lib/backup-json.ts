import type { BackupPayload } from './storage';

export async function encodeBackup(payload: BackupPayload): Promise<string> {
  const attachments = await Promise.all(payload.attachments.map(async file => {
    const bytes = new Uint8Array(await file.blob.arrayBuffer());
    let binary = '';
    for (let offset = 0; offset < bytes.length; offset += 8192) binary += String.fromCharCode(...bytes.subarray(offset, offset + 8192));
    return { id: file.id, mime: file.blob.type, base64: btoa(binary) };
  }));
  return JSON.stringify({ ...payload, version: 2, attachments }, null, 2);
}
export function decodeBackup(json: string): BackupPayload {
  const payload = JSON.parse(json);
  if (payload.version === 1) {
    if (payload.attachments?.length) throw new Error('Legacy backup cannot restore attachment bytes');
    return payload;
  }
  if (payload.version !== 2 || !Array.isArray(payload.attachments)) throw new Error('Unsupported backup');
  const attachments = payload.attachments.map((file: { id: string; mime: string; base64: string }) => {
    if (typeof file.base64 !== 'string' || file.base64.length > 35 * 1024 * 1024) throw new Error('Invalid attachment');
    const binary = atob(file.base64);
    return { id: file.id, blob: new Blob([Uint8Array.from(binary, char => char.charCodeAt(0))], { type: file.mime }) };
  });
  return { ...payload, version: 1, attachments };
}
