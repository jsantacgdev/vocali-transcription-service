import { DynamoTranscriptionRepository } from "./adapters/dynamodb/DynamoTranscriptionRepository";
import { S3AudioStorage } from "./adapters/s3/S3AudioStorage";
import { CreateTranscription } from "../application/use-cases/CreateTranscription";

const tableName = process.env.TABLE_NAME!;
const bucketName = process.env.BUCKET_NAME!;

const repository = new DynamoTranscriptionRepository(tableName);
const storage = new S3AudioStorage(bucketName);

export const createTranscription = new CreateTranscription(repository, storage);
