import { ListTranscriptions } from "@application/use-cases/ListTranscriptions";
import { makeRepository } from "../helpers/mocks";
import { makeTranscription } from "../helpers/factories";

describe("ListTranscriptions", () => {
  it("Requests pages of 10 items as required by the spec", async () => {
    const repository = makeRepository();
    repository.findByUser.mockResolvedValue({ items: [], nextCursor: null });
    const useCase = new ListTranscriptions(repository);

    await useCase.execute({ userId: "user-1" });

    expect(repository.findByUser).toHaveBeenCalledWith("user-1", 10, undefined);
  });

  it("Forwards the cursor to the repository", async () => {
    const repository = makeRepository();
    repository.findByUser.mockResolvedValue({ items: [], nextCursor: null });
    const useCase = new ListTranscriptions(repository);

    await useCase.execute({ userId: "user-1", cursor: "opaque-cursor" });

    expect(repository.findByUser).toHaveBeenCalledWith(
      "user-1",
      10,
      "opaque-cursor",
    );
  });

  it("Serializes entities into plain objects", async () => {
    const repository = makeRepository();
    repository.findByUser.mockResolvedValue({
      items: [makeTranscription({ transcriptionId: "t-1" })],
      nextCursor: null,
    });
    const useCase = new ListTranscriptions(repository);

    const result = await useCase.execute({ userId: "user-1" });

    expect(result.items).toHaveLength(1);
    expect(result.items[0]).toMatchObject({
      transcriptionId: "t-1",
      status: "COMPLETED",
    });
  });

  it("Returns the cursor for the next page when there are more results", async () => {
    const repository = makeRepository();
    repository.findByUser.mockResolvedValue({
      items: [makeTranscription()],
      nextCursor: "next-page-token",
    });
    const useCase = new ListTranscriptions(repository);

    const result = await useCase.execute({ userId: "user-1" });

    expect(result.nextCursor).toBe("next-page-token");
  });

  it("Returns a null cursor on the last page", async () => {
    const repository = makeRepository();
    repository.findByUser.mockResolvedValue({
      items: [makeTranscription()],
      nextCursor: null,
    });
    const useCase = new ListTranscriptions(repository);

    const result = await useCase.execute({ userId: "user-1" });

    expect(result.nextCursor).toBeNull();
  });
});
