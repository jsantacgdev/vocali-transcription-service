import { DynamoTranscriptionRepository } from "./adapters/dynamodb/DynamoTranscriptionRepository";
import { S3AudioStorage } from "./adapters/s3/S3AudioStorage";
import { SpeechmaticsProvider } from "./adapters/speechmatics/SpeechmaticsProvider";
import { CreateTranscription } from "@application/use-cases/CreateTranscription";
import { ProcessAudioTranscription } from "@application/use-cases/ProcessAudioTranscription";
import { ListTranscriptions } from "@application/use-cases/ListTranscriptions";

const tableName = process.env.TABLE_NAME!;
const bucketName = process.env.BUCKET_NAME!;

const speechmaticsApiKey = process.env.SPEECHMATICS_API_KEY!;

const stt = new SpeechmaticsProvider(speechmaticsApiKey);

const repository = new DynamoTranscriptionRepository(tableName);
const storage = new S3AudioStorage(bucketName);

export const createTranscription = new CreateTranscription(repository, storage);

export const processAudioTranscription = new ProcessAudioTranscription(
  repository,
  storage,
  stt,
);

export const listTranscriptions = new ListTranscriptions(repository);
