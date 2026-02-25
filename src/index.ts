import Parser from 'rss-parser'
import { DiscordWebhookService } from './services/discordWebhook'
import { DynamoDBService } from './services/dynamodb'
import { SSMService } from './services/ssm'

const TABLE_NAME = 'RssLastPublished'
const FEED_REQUEST_HEADERS = {
  'User-Agent': 'rss-to-discord-bot/1.0 (AWS Lambda)',
  Accept: 'application/rss+xml, application/xml, text/xml;q=0.9, */*;q=0.8',
}

const fetchFeed = async (parser: Parser, feedUrl: string) => {
  const response = await fetch(feedUrl, {
    headers: FEED_REQUEST_HEADERS,
    signal: AbortSignal.timeout(15000),
  })

  if (!response.ok) {
    throw new Error(`Feed request failed: ${response.status} ${response.statusText}`)
  }

  return parser.parseString(await response.text())
}

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
  const feedUrls = Array.isArray(params['/rssBot/rssFeeds'])
    ? params['/rssBot/rssFeeds'].map((url) => url.trim()).filter(Boolean)
    : []

  for (const feedUrl of feedUrls) {
    try {
      console.log(`Checking feed: ${feedUrl}`)
      const feed = await fetchFeed(parser, feedUrl)

      const lastPublishedDate = await dynamoClient.fetchLastFeedPublishedDate(
        feedUrl,
      )
      const threshold = lastPublishedDate ?? new Date(0)
      let newestPublishedDate = threshold

      for (const item of feed.items) {
        const pubDate = new Date(item.pubDate || item.isoDate || 0)

        if (pubDate > threshold) {
          await discordWebhookClient.sendToDiscord(
            item.title ?? 'No Title',
            item.link ?? 'No Link',
            pubDate,
          )

          if (pubDate > newestPublishedDate) {
            newestPublishedDate = pubDate
          }
        }
      }

      if (newestPublishedDate > threshold) {
        await dynamoClient.updateLastPublishedDate(feedUrl, newestPublishedDate)
      }
    } catch (error) {
      console.error(`Failed to process feed: ${feedUrl}`, error)
    }
  }
}
