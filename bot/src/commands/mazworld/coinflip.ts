import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
} from "discord.js";
import { api } from "../../api/client";
import { Command } from "../../models/Command";
import type { CoinflipResponse } from "./data";
import { buildCoinflipLoadingEmbed, buildCoinflipResultEmbed } from "./utils/embeds";
import { handleCommandError } from "../../utils/errorHandler";

const coinflip: Command = {
  data: new SlashCommandBuilder()
    .setName("coinflip")
    .setDescription("Pariez vos coins sur pile ou face !")
    .addStringOption(option =>
      option
        .setName("choix")
        .setDescription("Choisissez 'pile' ou 'face'")
        .setRequired(true)
        .addChoices(
          { name: "🪙 Pile", value: "pile" },
          { name: "🎴 Face", value: "face" },
        ),
    )
    .addIntegerOption(option =>
      option
        .setName("mise")
        .setDescription("Montant à parier (10€ minimum)")
        .setRequired(true)
        .setMinValue(10)
        .setMaxValue(500),
    ),

  async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    const choix     = interaction.options.getString("choix", true) as "pile" | "face";
    const mise      = interaction.options.getInteger("mise", true);
    const avatarURL = interaction.user.displayAvatarURL();

    try {
      await interaction.reply({ embeds: [buildCoinflipLoadingEmbed(mise, choix, avatarURL)] });

      const result = await api.post<CoinflipResponse>(
        "/api/commands/coinflip",
        interaction.user.id,
        interaction.user.username,
        { choice: choix, amount: mise },
      );

      await new Promise(resolve => setTimeout(resolve, 2000));
      await interaction.editReply({ embeds: [buildCoinflipResultEmbed(result, avatarURL)] });
    } catch (error) {
      await handleCommandError(error, interaction);
    }
  },
};

export default coinflip;
