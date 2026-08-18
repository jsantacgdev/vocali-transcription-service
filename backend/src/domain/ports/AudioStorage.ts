export interface AudioStorage {
  createUploadUrl(
    key: string,
    maxBytes: number,
    expiresInSeconds: number,
  ): Promise<string>;
  createDownloadUrl(key: string, expiresInSeconds: number): Promise<string>;
  saveText(key: string, content: string): Promise<void>;
  getText(key: string): Promise<string>;
  getAudio(key: string): Promise<Buffer>;
}
