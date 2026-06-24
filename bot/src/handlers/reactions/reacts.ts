import {
  Client,
  MessageReaction,
  PartialMessageReaction,
  User,
  PartialUser,
} from "discord.js";

export default function reactionMessages(bot: Client): void {
  bot.on("messageReactionAdd", async (reaction: MessageReaction | PartialMessageReaction, user: User | PartialUser) => {
    if (user.partial) {
      try {
        user = await user.fetch();
      } catch (error: any) {
        console.error("Error fetching user:", error);
        return;
      }
    }

    if (reaction.partial) {
      try {
        await reaction.fetch();
      } catch (error: any) {
        console.error("Error fetching reaction:", error);
        return;
      }
    }
  });
}
