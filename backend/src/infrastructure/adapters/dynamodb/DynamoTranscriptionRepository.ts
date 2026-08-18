import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  PutCommand,
  GetCommand,
  QueryCommand,
} from "@aws-sdk/lib-dynamodb";
import {
  Transcription,
  TranscriptionProps,
} from "@domain/entities/Transcription";
import {
  TranscriptionRepository,
  PaginatedResult,
} from "@domain/ports/TranscriptionRepository";

const client = DynamoDBDocumentClient.from(new DynamoDBClient({}), {
  marshallOptions: { removeUndefinedValues: true },
});

export class DynamoTranscriptionRepository implements TranscriptionRepository {
  constructor(private readonly tableName: string) {}

  private pk(userId: string): string {
    return `USER#${userId}`;
  }

  private sk(createdAt: string, id: string): string {
    return `TRANSCRIPTION#${createdAt}#${id}`;
  }

  async save(transcription: Transcription): Promise<void> {
    const props = transcription.toJSON();
    await client.send(
      new PutCommand({
        TableName: this.tableName,
        Item: {
          PK: this.pk(props.userId),
          SK: this.sk(props.createdAt, props.transcriptionId),
          ...props,
        },
      }),
    );
  }

  async findById(
    userId: string,
    transcriptionId: string,
  ): Promise<Transcription | null> {
    const result = await client.send(
      new QueryCommand({
        TableName: this.tableName,
        KeyConditionExpression: "PK = :pk",
        FilterExpression: "transcriptionId = :id",
        ExpressionAttributeValues: {
          ":pk": this.pk(userId),
          ":id": transcriptionId,
        },
      }),
    );

    const item = result.Items?.[0];
    if (!item) return null;

    const { PK, SK, ...props } = item;
    return Transcription.fromPersistence(props as TranscriptionProps);
  }

  async findByUser(
    userId: string,
    limit: number,
    cursor?: string,
  ): Promise<PaginatedResult<Transcription>> {
    const result = await client.send(
      new QueryCommand({
        TableName: this.tableName,
        KeyConditionExpression: "PK = :pk",
        ExpressionAttributeValues: { ":pk": this.pk(userId) },
        Limit: limit,
        ScanIndexForward: false,
        ExclusiveStartKey: cursor ? this.decodeCursor(cursor) : undefined,
      }),
    );

    return {
      items: (result.Items ?? []).map((i) => {
        const { PK, SK, ...props } = i;
        return Transcription.fromPersistence(props as TranscriptionProps);
      }),
      nextCursor: result.LastEvaluatedKey
        ? this.encodeCursor(result.LastEvaluatedKey)
        : null,
    };
  }

  private encodeCursor(key: Record<string, unknown>): string {
    return Buffer.from(JSON.stringify(key)).toString("base64url");
  }

  private decodeCursor(cursor: string): Record<string, unknown> {
    return JSON.parse(Buffer.from(cursor, "base64url").toString());
  }
}
