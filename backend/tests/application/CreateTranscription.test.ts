import { CreateTranscription } from "@application/use-cases/CreateTranscription";
import { FileTooLargeError } from "@domain/errors";
import { makeRepository, makeStorage } from "../helpers/mocks";

describe("CreateTranscription", () => {
  it("Creates a transcription and returns an upload url", async () => {
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

  it("Rejects files larger than 20MB", async () => {
    const useCase = new CreateTranscription(makeRepository(), makeStorage());

    await expect(
      useCase.execute({
        userId: "user-1",
        fileName: "big.wav",
        contentLength: 21 * 1024 * 1024,
      }),
    ).rejects.toThrow(FileTooLargeError);
  });

  it("Does not create an upload url when the file is too large", async () => {
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
