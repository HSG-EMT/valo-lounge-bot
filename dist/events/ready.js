"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerReady = registerReady;
const discord_js_1 = require("discord.js");
function registerReady(client) {
    client.once(discord_js_1.Events.ClientReady, (readyClient) => {
        console.log(`VALO LOUNGE bot logged in as ${readyClient.user.tag}`);
    });
}
//# sourceMappingURL=ready.js.map