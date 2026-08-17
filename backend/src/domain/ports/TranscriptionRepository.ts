import { Transcription } from "@domain/entities/Transcription";

export interface PaginatedResult<T> {
  items: T[];
  nextCursor: string | null;
}

export interface TranscriptionRepository {
  save(transcription: Transcription): Promise<void>;
  findById(
    userId: string,
    transcriptionId: string,
  ): Promise<Transcription | null>;
  findByUser(
    userId: string,
    limit: number,
    cursor?: string,
  ): Promise<PaginatedResult<Transcription>>;
}
