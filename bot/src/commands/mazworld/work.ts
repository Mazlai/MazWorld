import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  MessageFlags,
} from "discord.js";
import { api, ApiError } from "../../api/client";
import { Command } from "../../models/Command";
import type { WorkResponse } from "./data";
import { buildWorkLoadingEmbed, buildWorkResultEmbed } from "./utils/embeds";

const work: Command = {
  data: new SlashCommandBuilder()
    .setName("work")
    .setDescription("Travaillez dans votre ville actuelle pour gagner de l'argent ! 💼"),

  async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    const avatarURL = interaction.user.displayAvatarURL();

    try {
      await interaction.reply({ embeds: [buildWorkLoadingEmbed(avatarURL)] });

      const result = await api.post<WorkResponse>(
        "/api/commands/work",
        interaction.user.id,
        interaction.user.username,
      );

      if (!result.success) {
        await interaction.editReply({ content: `❌ ${result.message}`, embeds: [] });
        return;
      }

      await new Promise(resolve => setTimeout(resolve, 2000));
      await interaction.editReply({ embeds: [buildWorkResultEmbed(result, avatarURL)] });
    } catch (error) {
      if (error instanceof ApiError) {
        const content = error.status === 429 || error.status === 409
          ? `⏱️ ${error.message}`
          : `❌ ${error.message}`;
        if (interaction.deferred || interaction.replied) {
          await interaction.editReply({ content, embeds: [] });
        } else {
          await interaction.reply({ content, flags: MessageFlags.Ephemeral });
        }
        return;
      }
      console.error("Erreur dans /work:", error);
      const errorMessage = "❌ Une erreur est survenue pendant votre travail.";
      if (interaction.deferred || interaction.replied) {
        await interaction.editReply({ content: errorMessage, embeds: [] });
      } else {
        await interaction.reply({ content: errorMessage, flags: MessageFlags.Ephemeral });
      }
    }
  },
};

export default work;
