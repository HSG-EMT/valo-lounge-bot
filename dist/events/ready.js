"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerReady = registerReady;
const discord_js_1 = require("discord.js");
function registerReady(client) {
    client.once(discord_js_1.Events.ClientReady, (readyClient) => {
        console.log(`VALO LOUNGE bot logged in as ${readyClient.user.tag}`);
        readyClient.user.setActivity("/도움말 | 명령어 확인", { type: discord_js_1.ActivityType.Watching });
    });
}
//# sourceMappingURL=ready.js.map