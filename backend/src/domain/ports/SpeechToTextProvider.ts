export interface TranscriptionResult {
  text: string;
  durationSeconds: number;
}

export interface SpeechToTextProvider {
  transcribeFile(
    audioBuffer: Buffer,
    language: string,
  ): Promise<TranscriptionResult>;
  createRealtimeToken(ttlSeconds: number): Promise<string>;
}
