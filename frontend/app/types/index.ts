export type TranscriptionStatus =
  | "PENDING"
  | "PROCESSING"
  | "COMPLETED"
  | "FAILED";

export type TranscriptionSource = "FILE" | "REALTIME";

export interface Transcription {
  transcriptionId: string;
  userId: string;
  fileName: string;
  status: TranscriptionStatus;
  source: TranscriptionSource;
  audioKey: string | null;
  transcriptKey: string | null;
  durationSeconds: number | null;
  errorMessage: string | null;
  createdAt: string;
  completedAt: string | null;
}

export interface TranscriptionsPage {
  items: Transcription[];
  nextCursor: string | null;
}

export interface CreateTranscriptionResponse {
  transcriptionId: string;
  uploadUrl: string;
}

export interface DownloadTranscriptionResponse {
  downloadUrl: string;
  fileName: string;
}

export interface RealtimeTokenResponse {
  token: string;
  expiresInSeconds: number;
}

export interface ApiError {
  code: string;
  message: string;
}
