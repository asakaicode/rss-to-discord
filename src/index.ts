import fs from 'fs'
import Parser from 'rss-parser'

const parser = new Parser()
const LAST_FILE = './lastPublished.json'

const getLastPublished = () => {
  try {
    const data = JSON.parse(fs.readFileSync(LAST_FILE).toString())
    return new Date(data.lastPublished)
  } catch {
    return new Date(0)
  }
}

const setLastPublished = (date: Date) => {
  fs.writeFileSync(
    LAST_FILE,
    JSON.stringify({ lastPublished: date.toISOString() }),
  )
}

const checkFeed = async (rssUrl: string) => {
  if (!process.env.DISCORD_WEBHOOK_URL) {
    console.error('DISCORD_WEBHOOK_URL is not defined')
    return
  }

  console.log('Checking RSS ...')

  const feed = await parser.parseURL(rssUrl)
  const lastPublished = getLastPublished()
  let newest = lastPublished

  for (const item of feed.items) {
    const pubDate = new Date(item.pubDate || item.isoDate || 0)

    if (pubDate > lastPublished) {
      console.log('New post: ', item.title)

      // Push to Discord
      await fetch(process.env.DISCORD_WEBHOOK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: 'RSS Bot',
          embeds: [
            {
              title: item.title,
              url: item.link,
              description: item.contentSnippet || '',
              timestamp: pubDate.toISOString(),
            },
          ],
        }),
      })

      if (pubDate > newest) {
        newest = pubDate
      }
    }
  }

  if (newest > lastPublished) {
    setLastPublished(newest)
  }
}

void (async () => {
  if (!process.env.RSS_FEED_URL) {
    console.error('RSS_FEED_URL is not defined')
    return
  }

  await checkFeed(process.env.RSS_FEED_URL)

  setInterval(() => {
    if (!process.env.RSS_FEED_URL) {
      console.error('RSS_FEED_URL is not defined')
      return
    }
    checkFeed(process.env.RSS_FEED_URL)
  }, 5 * 60 * 1000)
})()
