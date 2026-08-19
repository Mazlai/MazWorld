import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
} from "discord.js";
import { api, ApiError } from "../../api/client";
import { Command } from "../../models/Command";
import type { DailyResponse } from "./data";
import { buildDailySuccessEmbed, buildDailyAlreadyClaimedEmbed } from "./utils/embeds";

const daily: Command = {
  data: new SlashCommandBuilder()
    .setName("daily")
    .setDescription("Réclamez votre récompense quotidienne de 5€"),

  async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    const avatarURL = interaction.user.displayAvatarURL();

    await interaction.deferReply();

    try {
      const result = await api.post<DailyResponse>(
        "/api/commands/daily",
        interaction.user.id,
        interaction.user.username,
      );

      if (result.success) {
        await interaction.editReply({ embeds: [buildDailySuccessEmbed(result, avatarURL)] });
      } else {
        await interaction.editReply({ embeds: [buildDailyAlreadyClaimedEmbed(result, avatarURL)] });
      }
    } catch (error) {
      if (error instanceof ApiError && error.status === 429) {
        await interaction.editReply({ content: `⏰ ${error.message}` });
        return;
      }
      console.error("Erreur dans /daily:", error);
      await interaction.editReply({
        content: "❌ Une erreur est survenue lors de la réclamation de votre récompense quotidienne.",
      });
    }
  },
};

export default daily;
