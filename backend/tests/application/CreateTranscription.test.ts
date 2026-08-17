import { CreateTranscription } from "../../src/application/use-cases/CreateTranscription";
import { TranscriptionRepository } from "../../src/domain/ports/TranscriptionRepository";
import { AudioStorage } from "../../src/domain/ports/AudioStorage";
import { FileTooLargeError } from "../../src/domain/errors";

const makeRepository = (): jest.Mocked<TranscriptionRepository> => ({
  save: jest.fn(),
  findById: jest.fn(),
  findByUser: jest.fn(),
});

const makeStorage = (): jest.Mocked<AudioStorage> => ({
  createUploadUrl: jest.fn().mockResolvedValue("https://s3.example/upload"),
  createDownloadUrl: jest.fn(),
  saveText: jest.fn(),
  getText: jest.fn(),
});

describe("CreateTranscription", () => {
  it("creates a transcription and returns an upload url", async () => {
    const repository = makeRepository();
    const storage = makeStorage();
    const useCase = new CreateTranscription(repository, storage);

    const result = await useCase.execute({
      userId: "user-1",
      fileName: "audio.wav",
      contentLength: 1024,
    });

    expect(result.uploadUrl).toBe("https://s3.example/upload");
    expect(repository.save).toHaveBeenCalledTimes(1);
  });

  it("rejects files larger than 20MB", async () => {
    const useCase = new CreateTranscription(makeRepository(), makeStorage());

    await expect(
      useCase.execute({
        userId: "user-1",
        fileName: "big.wav",
        contentLength: 21 * 1024 * 1024,
      }),
    ).rejects.toThrow(FileTooLargeError);
  });

  it("does not create an upload url when the file is too large", async () => {
    const storage = makeStorage();
    const useCase = new CreateTranscription(makeRepository(), storage);

    await expect(
      useCase.execute({
        userId: "user-1",
        fileName: "big.wav",
        contentLength: 21 * 1024 * 1024,
      }),
    ).rejects.toThrow();

    expect(storage.createUploadUrl).not.toHaveBeenCalled();
  });
});
