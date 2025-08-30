import AWS from 'aws-sdk'

const TABLE_NAME = 'RssLastPublished'

export class DynamoDBService extends AWS.DynamoDB.DocumentClient {
  constructor() {
    super()
  }

  public async fetchLastFeedPublishedDate(
    feedUrl: string,
  ): Promise<Date | null> {
    const lastItem = await this.get({
      TableName: TABLE_NAME,
      Key: { FeedUrl: feedUrl },
    }).promise()
    return lastItem.Item?.LastPublished
      ? new Date(lastItem.Item.LastPublished)
      : null
  }

  public async updateLastPublishedDate(
    feedUrl: string,
    newDate: Date,
  ): Promise<void> {
    await this.put({
      TableName: TABLE_NAME,
      Item: {
        FeedUrl: feedUrl,
        LastPublished: newDate.toISOString(),
      },
    }).promise()
  }
}
