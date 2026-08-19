import { SpeechToTextProvider } from "@domain/ports/SpeechToTextProvider";

const TOKEN_TTL = 60;

export interface CreateRealtimeTokenOutput {
  token: string;
  expiresInSeconds: number;
}

export class CreateRealtimeToken {
  constructor(private readonly stt: SpeechToTextProvider) {}

  async execute(): Promise<CreateRealtimeTokenOutput> {
    const token = await this.stt.createRealtimeToken(TOKEN_TTL);
    return { token, expiresInSeconds: TOKEN_TTL };
  }
}
