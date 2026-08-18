import { BatchClient } from "@speechmatics/batch-client";
import {
  SpeechToTextProvider,
  TranscriptionResult,
} from "@domain/ports/SpeechToTextProvider";

export class SpeechmaticsProvider implements SpeechToTextProvider {
  private readonly client: BatchClient;

  constructor(private readonly apiKey: string) {
    this.client = new BatchClient({ apiKey, appId: "vocali-transcriptions" });
  }

  async transcribeFile(
    audioBuffer: Buffer,
    language: string,
  ): Promise<TranscriptionResult> {
    const bytes = new Uint8Array(audioBuffer);
    const file = new File([bytes], "audio.wav", { type: "audio/wav" });

    const response = await this.client.transcribe(
      file,
      { transcription_config: { language, operating_point: "enhanced" } },
      "json-v2",
    );

    const text =
      typeof response === "string"
        ? response
        : response.results
            .map((r) => r.alternatives?.[0]?.content ?? "")
            .join(" ");

    const durationSeconds =
      typeof response === "string"
        ? 0
        : Math.round(response.job?.duration ?? 0);

    return { text, durationSeconds };
  }

  async createRealtimeToken(ttlSeconds: number): Promise<string> {
    const response = await fetch(
      "https://mp.speechmatics.com/v1/api_keys?type=rt",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ ttl: ttlSeconds }),
      },
    );
    const data: unknown = await response.json();

    if (typeof data !== "object" || data === null || !("key_value" in data)) {
      throw new Error("Unexpected response from Speechmatics token endpoint");
    }

    return String(data.key_value);
  }
}
