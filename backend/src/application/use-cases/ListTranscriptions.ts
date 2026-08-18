import { TranscriptionRepository } from "@domain/ports/TranscriptionRepository";
import { TranscriptionProps } from "@domain/entities/Transcription";

const PAGE_SIZE = 10;

export interface ListTranscriptionsInput {
  userId: string;
  cursor?: string;
}

export interface ListTranscriptionsOutput {
  items: TranscriptionProps[];
  nextCursor: string | null;
}

export class ListTranscriptions {
  constructor(private readonly repository: TranscriptionRepository) {}

  async execute(
    input: ListTranscriptionsInput,
  ): Promise<ListTranscriptionsOutput> {
    const result = await this.repository.findByUser(
      input.userId,
      PAGE_SIZE,
      input.cursor,
    );

    return {
      items: result.items.map((t) => t.toJSON()),
      nextCursor: result.nextCursor,
    };
  }
}
