"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerInteractionCreate = registerInteractionCreate;
const discord_js_1 = require("discord.js");
function registerInteractionCreate(client, commands) {
    client.on(discord_js_1.Events.InteractionCreate, async (interaction) => {
        if (!interaction.isChatInputCommand())
            return;
        const command = commands.get(interaction.commandName);
        if (!command)
            return;
        try {
            await command.execute(interaction);
        }
        catch (err) {
            console.error(`Command "${interaction.commandName}" failed:`, err);
            const payload = {
                content: "명령어 실행 중 오류가 발생했습니다.",
                flags: discord_js_1.MessageFlags.Ephemeral,
            };
            if (interaction.replied || interaction.deferred) {
                await interaction.followUp(payload);
            }
            else {
                await interaction.reply(payload);
            }
        }
    });
}
//# sourceMappingURL=interactionCreate.js.map