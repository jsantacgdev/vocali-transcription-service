import { InvalidTransitionError } from "../errors";

export type TranscriptionStatus =
  | "PENDING"
  | "PROCESSING"
  | "COMPLETED"
  | "FAILED";
export type TranscriptionSource = "FILE" | "REALTIME";

export interface TranscriptionProps {
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

const VALID_TRANSITIONS: Record<TranscriptionStatus, TranscriptionStatus[]> = {
  PENDING: ["PROCESSING", "FAILED"],
  PROCESSING: ["COMPLETED", "FAILED"],
  COMPLETED: [],
  FAILED: [],
};

export class Transcription {
  private constructor(private props: TranscriptionProps) {}

  static create(params: {
    transcriptionId: string;
    userId: string;
    fileName: string;
    source: TranscriptionSource;
    audioKey?: string | null;
  }): Transcription {
    return new Transcription({
      ...params,
      status: "PENDING",
      audioKey: params.audioKey ?? null,
      transcriptKey: null,
      durationSeconds: null,
      errorMessage: null,
      createdAt: new Date().toISOString(),
      completedAt: null,
    });
  }

  static fromPersistence(props: TranscriptionProps): Transcription {
    return new Transcription(props);
  }

  private transitionTo(next: TranscriptionStatus): void {
    if (!VALID_TRANSITIONS[this.props.status].includes(next)) {
      throw new InvalidTransitionError(this.props.status, next);
    }
    this.props.status = next;
  }

  markAsProcessing(): void {
    this.transitionTo("PROCESSING");
  }

  markAsCompleted(transcriptKey: string, durationSeconds: number): void {
    this.transitionTo("COMPLETED");
    this.props.transcriptKey = transcriptKey;
    this.props.durationSeconds = durationSeconds;
    this.props.completedAt = new Date().toISOString();
  }

  markAsFailed(reason: string): void {
    this.transitionTo("FAILED");
    this.props.errorMessage = reason;
    this.props.completedAt = new Date().toISOString();
  }

  belongsTo(userId: string): boolean {
    return this.props.userId === userId;
  }

  get id(): string {
    return this.props.transcriptionId;
  }
  get status(): TranscriptionStatus {
    return this.props.status;
  }
  get transcriptKey(): string | null {
    return this.props.transcriptKey;
  }

  toJSON(): TranscriptionProps {
    return { ...this.props };
  }

  get audioKey(): string | null {
    return this.props.audioKey;
  }
  get userId(): string {
    return this.props.userId;
  }
}
