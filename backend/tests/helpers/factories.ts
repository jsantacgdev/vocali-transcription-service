import {
  Transcription,
  TranscriptionProps,
} from "@domain/entities/Transcription";

export const makeTranscription = (
  overrides: Partial<TranscriptionProps> = {},
): Transcription =>
  Transcription.fromPersistence({
    transcriptionId: "transcription-1",
    userId: "user-1",
    fileName: "audio.wav",
    status: "COMPLETED",
    source: "FILE",
    audioKey: "audio/user-1/transcription-1.wav",
    transcriptKey: "transcripts/user-1/transcription-1.txt",
    durationSeconds: 42,
    errorMessage: null,
    createdAt: "2026-01-01T00:00:00.000Z",
    completedAt: "2026-01-01T00:01:00.000Z",
    ...overrides,
  });
