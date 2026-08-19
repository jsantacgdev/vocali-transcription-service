import { CreateRealtimeToken } from "@application/use-cases/CreateRealtimeToken";
import { makeSpeechToText } from "../helpers/mocks";

describe("CreateRealtimeToken", () => {
  it("returns a short lived token", async () => {
    const stt = makeSpeechToText();
    const useCase = new CreateRealtimeToken(stt);

    const result = await useCase.execute();

    expect(result.token).toBe("ephemeral-token");
    expect(result.expiresInSeconds).toBe(60);
  });

  it("never requests a token that outlives the connection handshake", async () => {
    const stt = makeSpeechToText();
    const useCase = new CreateRealtimeToken(stt);

    await useCase.execute();

    const [ttl] = stt.createRealtimeToken.mock.calls[0]!;
    expect(ttl).toBeLessThanOrEqual(300);
  });
});
