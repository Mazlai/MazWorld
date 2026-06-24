import { bot } from "./client";
import { ActivityType } from "discord.js";

import handleMessage from "../handlers/messages/messageHandler";
import reactionMessages from "../handlers/reactions/reacts";
import guildMessages from "../handlers/welcomes/announcements";

bot.on("clientReady", () => {
  if (!bot.user) {
    console.error("The bot is ready, but 'bot.user' is undefined.");
    return;
  }

  bot.user.setPresence({
    activities: [
      {
        name: "MazWorld 🌍",
        type: ActivityType.Watching,
      },
    ],
    status: "online",
  });

  console.log(`\n✅ Bot connecté : ${bot.user?.tag}`);
  console.log(`🎮 Serveurs : ${bot.guilds.cache.size}\n`);

  reactionMessages(bot);
  guildMessages(bot);
});

bot.on("messageCreate", handleMessage);

export default bot;
