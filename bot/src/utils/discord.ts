import { bot } from "./client";
import { ActivityType } from "discord.js";

bot.on("clientReady", () => {
  if (!bot.user) {
    console.error("The bot is ready, but 'bot.user' is undefined.");
    return;
  }

  bot.user.setPresence({
    activities: [
      {
        name: "MazWorld",
        type: ActivityType.Watching,
      },
    ],
    status: "dnd",
  });

  console.log(`\n✅ Bot connecté : ${bot.user?.tag}`);
  console.log(`🎮 Serveurs : ${bot.guilds.cache.size}\n`);
});

export default bot;
