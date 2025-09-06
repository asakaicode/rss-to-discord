import Parser from 'rss-parser'
import { DiscordWebhookService } from './service/discordWebhook'
import { DynamoDBService } from './service/dynamo'
import { SSMService } from './service/ssm'

const TABLE_NAME = 'RssLastPublished'

export const handler = async () => {
  const ssmClient = new SSMService()
  const params = await ssmClient.fetchParameters([
    '/rssBot/webhookUrl',
    '/rssBot/rssFeeds',
  ])

  const parser = new Parser()
  const dynamoClient = new DynamoDBService(TABLE_NAME)
  const discordWebhookClient = new DiscordWebhookService(
    params['/rssBot/webhookUrl'] as string,
  )

  for (const feedUrl of params['/rssBot/rssFeeds']) {
    console.log(`Checking feed: ${feedUrl}`)
    const feed = await parser.parseURL(feedUrl)

    const lastPublishedDate = await dynamoClient.fetchLastFeedPublishedDate(
      feedUrl,
    )

    let newest = lastPublishedDate ?? new Date(0)

    for (const item of feed.items) {
      const pubDate = new Date(item.pubDate || item.isoDate || 0)

      if (!newest || pubDate > newest) {
        await discordWebhookClient.sendToDiscord(
          item.title ?? 'No Title',
          item.link ?? 'No Link',
          pubDate,
        )
      }
    }

    await dynamoClient.updateLastPublishedDate(feedUrl, new Date())
  }
}
