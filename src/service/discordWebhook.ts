export class DiscordWebhookService {
  constructor(private webhookUrl: string) {}

  public async sendToDiscord(title: string, link: string, time: Date) {
    await fetch(this.webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: 'RSS Bot',
        embeds: [
          {
            title,
            url: link,
            timestamp: time.toISOString(),
            description: 'New RSS post',
          },
        ],
      }),
    })
  }
}
