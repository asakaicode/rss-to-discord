import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import {
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
} from '@aws-sdk/lib-dynamodb'

export class DynamoDBService {
  private doc: DynamoDBDocumentClient

  constructor(private tableName: string) {
    const ddb = new DynamoDBClient({})
    this.doc = DynamoDBDocumentClient.from(ddb)
  }

  public async fetchLastFeedPublishedDate(
    feedUrl: string,
  ): Promise<Date | null> {
    const lastItem = await this.doc.send(
      new GetCommand({ TableName: this.tableName, Key: { FeedUrl: feedUrl } }),
    )
    return lastItem.Item?.LastPublished
      ? new Date(lastItem.Item.LastPublished)
      : null
  }

  public async updateLastPublishedDate(
    feedUrl: string,
    newDate: Date,
  ): Promise<void> {
    await this.doc.send(
      new PutCommand({
        TableName: this.tableName,
        Item: {
          FeedUrl: feedUrl,
          LastPublished: newDate.toISOString(),
        },
      }),
    )
  }
}
