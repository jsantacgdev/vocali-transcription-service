import { TranscriptionRepository } from "@domain/ports/TranscriptionRepository";
import { AudioStorage } from "@domain/ports/AudioStorage";

export const makeRepository = (): jest.Mocked<TranscriptionRepository> => ({
  save: jest.fn(),
  findById: jest.fn(),
  findByUser: jest.fn(),
});

export const makeStorage = (): jest.Mocked<AudioStorage> => ({
  createUploadUrl: jest.fn().mockResolvedValue("https://s3.example/upload"),
  createDownloadUrl: jest.fn().mockResolvedValue("https://s3.example/download"),
  saveText: jest.fn(),
  getText: jest.fn(),
  getAudio: jest.fn(),
});
