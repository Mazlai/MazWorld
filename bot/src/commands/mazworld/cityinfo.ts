import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  MessageFlags,
} from "discord.js";
import { api } from "../../api/client";
import { handleCommandError } from "../../utils/errorHandler";
import { Command } from "../../models/Command";
import type { TravelStatus, MapResponse } from "./data";
import { buildCityinfoEmbed } from "./utils/embeds";

const cityinfo: Command = {
  data: new SlashCommandBuilder()
    .setName("cityinfo")
    .setDescription("Découvrez les détails de votre ville actuelle"),

  async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    const userId    = interaction.user.id;
    const username  = interaction.user.username;
    const avatarURL = interaction.user.displayAvatarURL();

    try {
      const travelStatus = await api.get<TravelStatus>("/api/travel/status", userId, username);

      if (travelStatus.traveling && travelStatus.arrival_time) {
        const timeLeft = travelStatus.arrival_time - Math.floor(Date.now() / 1000);
        const hours    = Math.floor(timeLeft / 3600);
        const minutes  = Math.floor((timeLeft % 3600) / 60);

        await interaction.reply({
          content:
            `🚂 Vous êtes en voyage vers **${travelStatus.destination_emoji ?? ""} ${travelStatus.destination_name ?? ""}**\n` +
            `⏱️ Arrivée dans ${hours}h ${minutes}m\n\n` +
            `💡 Utilisez \`/cityinfo\` une fois arrivé pour découvrir la ville !`,
          flags: MessageFlags.Ephemeral,
        });
        return;
      }

      const mapData = await api.get<MapResponse>("/api/travel/map", userId, username);
      await interaction.reply({ embeds: [buildCityinfoEmbed(mapData, avatarURL)] });
    } catch (error) {
      await handleCommandError(error, interaction);
    }
  },
};

export default cityinfo;
