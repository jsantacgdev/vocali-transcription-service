import { DownloadTranscription } from "@application/use-cases/DownloadTranscription";
import {
  TranscriptionNotFoundError,
  TranscriptionNotReadyError,
  UnauthorizedAccessError,
} from "@domain/errors";
import { makeRepository, makeStorage } from "../helpers/mocks";
import { makeTranscription } from "../helpers/factories";

describe("DownloadTranscription", () => {
  it("Returns a signed url for a completed transcription", async () => {
    const repository = makeRepository();
    const storage = makeStorage();
    repository.findById.mockResolvedValue(makeTranscription());
    const useCase = new DownloadTranscription(repository, storage);

    const result = await useCase.execute({
      userId: "user-1",
      transcriptionId: "transcription-1",
    });

    expect(result.downloadUrl).toBe("https://s3.example/download");
    expect(result.fileName).toBe("transcription-1.txt");
  });

  it("Passes the file name to the storage so the browser downloads it", async () => {
    const repository = makeRepository();
    const storage = makeStorage();
    repository.findById.mockResolvedValue(makeTranscription());
    const useCase = new DownloadTranscription(repository, storage);

    await useCase.execute({
      userId: "user-1",
      transcriptionId: "transcription-1",
    });

    expect(storage.createDownloadUrl).toHaveBeenCalledWith(
      "transcripts/user-1/transcription-1.txt",
      expect.any(Number),
      "transcription-1.txt",
    );
  });

  it("Fails when the transcription does not exist", async () => {
    const repository = makeRepository();
    repository.findById.mockResolvedValue(null);
    const useCase = new DownloadTranscription(repository, makeStorage());

    await expect(
      useCase.execute({ userId: "user-1", transcriptionId: "missing" }),
    ).rejects.toThrow(TranscriptionNotFoundError);
  });

  it("Fails when the transcription belongs to another user", async () => {
    const repository = makeRepository();
    repository.findById.mockResolvedValue(
      makeTranscription({ userId: "someone-else" }),
    );
    const useCase = new DownloadTranscription(repository, makeStorage());

    await expect(
      useCase.execute({ userId: "user-1", transcriptionId: "transcription-1" }),
    ).rejects.toThrow(UnauthorizedAccessError);
  });

  it("Fails when the transcription is still processing", async () => {
    const repository = makeRepository();
    repository.findById.mockResolvedValue(
      makeTranscription({ status: "PROCESSING", transcriptKey: null }),
    );
    const useCase = new DownloadTranscription(repository, makeStorage());

    await expect(
      useCase.execute({ userId: "user-1", transcriptionId: "transcription-1" }),
    ).rejects.toThrow(TranscriptionNotReadyError);
  });

  it("Does not sign a url when access is denied", async () => {
    const repository = makeRepository();
    const storage = makeStorage();
    repository.findById.mockResolvedValue(
      makeTranscription({ userId: "someone-else" }),
    );
    const useCase = new DownloadTranscription(repository, storage);

    await expect(
      useCase.execute({ userId: "user-1", transcriptionId: "transcription-1" }),
    ).rejects.toThrow();

    expect(storage.createDownloadUrl).not.toHaveBeenCalled();
  });
});
