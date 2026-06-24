import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  MessageFlags,
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

    try {
      const result = await api.post<DailyResponse>(
        "/api/commands/daily",
        interaction.user.id,
        interaction.user.username,
      );

      if (result.success) {
        await interaction.reply({ embeds: [buildDailySuccessEmbed(result, avatarURL)] });
      } else {
        await interaction.reply({ embeds: [buildDailyAlreadyClaimedEmbed(result, avatarURL)], flags: MessageFlags.Ephemeral });
      }
    } catch (error) {
      if (error instanceof ApiError && error.status === 429) {
        await interaction.reply({ content: `⏰ ${error.message}`, flags: MessageFlags.Ephemeral });
        return;
      }
      console.error("Erreur dans /daily:", error);
      await interaction.reply({
        content: "❌ Une erreur est survenue lors de la réclamation de votre récompense quotidienne.",
        flags: MessageFlags.Ephemeral,
      });
    }
  },
};

export default daily;
