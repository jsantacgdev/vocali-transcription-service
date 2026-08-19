import type { S3Event } from "aws-lambda";
import { processAudioTranscription } from "@infrastructure/container";

export const handler = async (event: S3Event): Promise<void> => {
  for (const record of event.Records) {
    const key = decodeURIComponent(record.s3.object.key.replace(/\+/g, " "));
    const parts = key.split("/");
    const userId = parts[1];
    const transcriptionId = parts[2];

    if (!userId || !transcriptionId) {
      console.warn(`Skipping unexpected key: ${key}`);
      continue;
    }

    await processAudioTranscription.execute(userId, transcriptionId);
  }
};
