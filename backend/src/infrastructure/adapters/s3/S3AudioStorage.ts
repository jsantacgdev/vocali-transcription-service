import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { AudioStorage } from "@domain/ports/AudioStorage";

const client = new S3Client({});

export class S3AudioStorage implements AudioStorage {
  constructor(private readonly bucket: string) {}

  async createUploadUrl(
    key: string,
    maxBytes: number,
    expiresInSeconds: number,
  ): Promise<string> {
    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      ContentLength: maxBytes,
    });
    return getSignedUrl(client, command, { expiresIn: expiresInSeconds });
  }

  async createDownloadUrl(
    key: string,
    expiresInSeconds: number,
  ): Promise<string> {
    const command = new GetObjectCommand({ Bucket: this.bucket, Key: key });
    return getSignedUrl(client, command, { expiresIn: expiresInSeconds });
  }

  async saveText(key: string, content: string): Promise<void> {
    await client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: content,
        ContentType: "text/plain; charset=utf-8",
      }),
    );
  }

  async getText(key: string): Promise<string> {
    const result = await client.send(
      new GetObjectCommand({ Bucket: this.bucket, Key: key }),
    );
    return result.Body!.transformToString();
  }

  async getAudio(key: string): Promise<Buffer> {
    const result = await client.send(
      new GetObjectCommand({ Bucket: this.bucket, Key: key }),
    );
    const bytes = await result.Body!.transformToByteArray();
    return Buffer.from(bytes);
  }
}
