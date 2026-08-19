import { TranscriptionRepository } from "@domain/ports/TranscriptionRepository";
import { AudioStorage } from "@domain/ports/AudioStorage";
import {
  TranscriptionNotFoundError,
  UnauthorizedAccessError,
  TranscriptionNotReadyError,
} from "@domain/errors";

const DOWNLOAD_URL_TTL = 300;

export interface DownloadTranscriptionInput {
  userId: string;
  transcriptionId: string;
}

export interface DownloadTranscriptionOutput {
  downloadUrl: string;
  fileName: string;
}

export class DownloadTranscription {
  constructor(
    private readonly repository: TranscriptionRepository,
    private readonly storage: AudioStorage,
  ) {}

  async execute(
    input: DownloadTranscriptionInput,
  ): Promise<DownloadTranscriptionOutput> {
    const transcription = await this.repository.findById(
      input.userId,
      input.transcriptionId,
    );

    if (!transcription) {
      throw new TranscriptionNotFoundError(input.transcriptionId);
    }

    if (!transcription.belongsTo(input.userId)) {
      throw new UnauthorizedAccessError();
    }

    if (!transcription.transcriptKey) {
      throw new TranscriptionNotReadyError(
        input.transcriptionId,
        transcription.status,
      );
    }

    const downloadUrl = await this.storage.createDownloadUrl(
      transcription.transcriptKey,
      DOWNLOAD_URL_TTL,
    );

    return { downloadUrl, fileName: `${input.transcriptionId}.txt` };
  }
}
