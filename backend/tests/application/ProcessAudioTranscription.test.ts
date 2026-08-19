import { ProcessAudioTranscription } from "@application/use-cases/ProcessAudioTranscription";
import { TranscriptionNotFoundError } from "@domain/errors";
import {
  makeRepository,
  makeStorage,
  makeSpeechToText,
} from "../helpers/mocks";
import { makePendingTranscription } from "../helpers/factories";

describe("ProcessAudioTranscription", () => {
  it("Transcribes the audio and completes the transcription", async () => {
    const repository = makeRepository();
    const storage = makeStorage();
    const stt = makeSpeechToText();
    const transcription = makePendingTranscription();
    repository.findById.mockResolvedValue(transcription);
    const useCase = new ProcessAudioTranscription(repository, storage, stt);

    await useCase.execute("user-1", "transcription-1");

    expect(transcription.status).toBe("COMPLETED");
    expect(transcription.transcriptKey).toBe(
      "transcripts/user-1/transcription-1.txt",
    );
  });

  it("Stores the transcript text in the storage", async () => {
    const repository = makeRepository();
    const storage = makeStorage();
    repository.findById.mockResolvedValue(makePendingTranscription());
    const useCase = new ProcessAudioTranscription(
      repository,
      storage,
      makeSpeechToText(),
    );

    await useCase.execute("user-1", "transcription-1");

    expect(storage.saveText).toHaveBeenCalledWith(
      "transcripts/user-1/transcription-1.txt",
      "texto transcrito",
    );
  });

  it("Marks the transcription as processing before calling the provider", async () => {
    const repository = makeRepository();
    const stt = makeSpeechToText();
    const transcription = makePendingTranscription();
    repository.findById.mockResolvedValue(transcription);
    stt.transcribeFile.mockImplementation(async () => {
      expect(transcription.status).toBe("PROCESSING");
      return { text: "texto transcrito", durationSeconds: 42 };
    });
    const useCase = new ProcessAudioTranscription(
      repository,
      makeStorage(),
      stt,
    );

    await useCase.execute("user-1", "transcription-1");

    expect(stt.transcribeFile).toHaveBeenCalledTimes(1);
  });

  it("Marks the transcription as failed when the provider fails", async () => {
    const repository = makeRepository();
    const stt = makeSpeechToText();
    const transcription = makePendingTranscription();
    repository.findById.mockResolvedValue(transcription);
    stt.transcribeFile.mockRejectedValue(new Error("Speechmatics timeout"));
    const useCase = new ProcessAudioTranscription(
      repository,
      makeStorage(),
      stt,
    );

    await useCase.execute("user-1", "transcription-1");

    expect(transcription.status).toBe("FAILED");
    expect(transcription.toJSON().errorMessage).toBe("Speechmatics timeout");
  });

  it("Does not rethrow provider errors so lambda is not retried", async () => {
    const repository = makeRepository();
    const stt = makeSpeechToText();
    repository.findById.mockResolvedValue(makePendingTranscription());
    stt.transcribeFile.mockRejectedValue(new Error("Speechmatics timeout"));
    const useCase = new ProcessAudioTranscription(
      repository,
      makeStorage(),
      stt,
    );

    await expect(
      useCase.execute("user-1", "transcription-1"),
    ).resolves.toBeUndefined();
  });

  it("Fails when the transcription does not exist", async () => {
    const repository = makeRepository();
    repository.findById.mockResolvedValue(null);
    const useCase = new ProcessAudioTranscription(
      repository,
      makeStorage(),
      makeSpeechToText(),
    );

    await expect(useCase.execute("user-1", "missing")).rejects.toThrow(
      TranscriptionNotFoundError,
    );
  });
});
