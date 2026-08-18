import { TranscriptionRepository } from "@domain/ports/TranscriptionRepository";
import { AudioStorage } from "@domain/ports/AudioStorage";
import { SpeechToTextProvider } from "@domain/ports/SpeechToTextProvider";
import { TranscriptionNotFoundError } from "@domain/errors";

const LANGUAGE = "es";

export class ProcessAudioTranscription {
  constructor(
    private readonly repository: TranscriptionRepository,
    private readonly storage: AudioStorage,
    private readonly stt: SpeechToTextProvider,
  ) {}

  async execute(userId: string, transcriptionId: string): Promise<void> {
    const transcription = await this.repository.findById(
      userId,
      transcriptionId,
    );

    if (!transcription) {
      throw new TranscriptionNotFoundError(transcriptionId);
    }

    if (!transcription.audioKey) {
      throw new Error(`Transcription ${transcriptionId} has no audio key`);
    }

    try {
      transcription.markAsProcessing();
      await this.repository.save(transcription);

      const audio = await this.storage.getAudio(transcription.audioKey);
      const result = await this.stt.transcribeFile(audio, LANGUAGE);

      const transcriptKey = `transcripts/${userId}/${transcriptionId}.txt`;
      await this.storage.saveText(transcriptKey, result.text);

      transcription.markAsCompleted(transcriptKey, result.durationSeconds);
      await this.repository.save(transcription);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      transcription.markAsFailed(message);
      await this.repository.save(transcription);
      throw error;
    }
  }
}
