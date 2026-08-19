import { InvalidTransitionError } from "@domain/errors";
import {
  makeTranscription,
  makePendingTranscription,
} from "../helpers/factories";

describe("Transcription state machine", () => {
  it("Goes from pending to processing", () => {
    const transcription = makePendingTranscription();

    transcription.markAsProcessing();

    expect(transcription.status).toBe("PROCESSING");
  });

  it("Rejects processing a transcription that is already completed", () => {
    const transcription = makeTranscription();

    expect(() => transcription.markAsProcessing()).toThrow(
      InvalidTransitionError,
    );
  });

  it("Rejects completing a transcription twice", () => {
    const transcription = makeTranscription();

    expect(() => transcription.markAsCompleted("key.txt", 10)).toThrow(
      InvalidTransitionError,
    );
  });

  it("Rejects reprocessing a failed transcription", () => {
    const transcription = makeTranscription({
      status: "FAILED",
      transcriptKey: null,
      errorMessage: "Speechmatics timeout",
    });

    expect(() => transcription.markAsProcessing()).toThrow(
      InvalidTransitionError,
    );
  });

  it("Only belongs to its owner", () => {
    const transcription = makeTranscription({ userId: "user-1" });

    expect(transcription.belongsTo("user-1")).toBe(true);
    expect(transcription.belongsTo("someone-else")).toBe(false);
  });
});
