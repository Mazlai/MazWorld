import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
} from "discord.js";
import { api } from "../../api/client";
import { Command } from "../../models/Command";
import type { WorkResponse } from "./data";
import { buildWorkLoadingEmbed, buildWorkResultEmbed } from "./utils/embeds";
import { handleCommandError } from "../../utils/errorHandler";

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
      await handleCommandError(error, interaction);
    }
  },
};

export default work;
