import { ActivityType, Client, Events } from "discord.js";

export function registerReady(client: Client): void {
  client.once(Events.ClientReady, (readyClient) => {
    console.log(`VALO LOUNGE bot logged in as ${readyClient.user.tag}`);
    readyClient.user.setActivity("/도움말 | 명령어 확인", { type: ActivityType.Watching });
  });
}
