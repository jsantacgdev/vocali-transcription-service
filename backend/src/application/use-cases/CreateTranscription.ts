import { randomUUID } from "node:crypto";
import { Transcription } from "../../domain/entities/Transcription";
import { TranscriptionRepository } from "../../domain/ports/TranscriptionRepository";
import { AudioStorage } from "../../domain/ports/AudioStorage";
import { FileTooLargeError } from "../../domain/errors";

const MAX_BYTES = 20 * 1024 * 1024;
const UPLOAD_URL_TTL = 300;

export interface CreateTranscriptionInput {
  userId: string;
  fileName: string;
  contentLength: number;
}

export interface CreateTranscriptionOutput {
  transcriptionId: string;
  uploadUrl: string;
}

export class CreateTranscription {
  constructor(
    private readonly repository: TranscriptionRepository,
    private readonly storage: AudioStorage,
  ) {}

  async execute(
    input: CreateTranscriptionInput,
  ): Promise<CreateTranscriptionOutput> {
    if (input.contentLength > MAX_BYTES) {
      throw new FileTooLargeError(MAX_BYTES);
    }

    const transcriptionId = randomUUID();
    const audioKey = `audio/${input.userId}/${transcriptionId}`;

    const transcription = Transcription.create({
      transcriptionId,
      userId: input.userId,
      fileName: input.fileName,
      source: "FILE",
      audioKey,
    });

    await this.repository.save(transcription);

    const uploadUrl = await this.storage.createUploadUrl(
      audioKey,
      input.contentLength,
      UPLOAD_URL_TTL,
    );

    return { transcriptionId, uploadUrl };
  }
}
