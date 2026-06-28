import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  MessageFlags,
} from "discord.js";
import { api } from "../../api/client";
import { handleCommandError } from "../../utils/errorHandler";
import { generateProfileCard } from "./utils/profileCard";
import { Command } from "../../models/Command";
import type { ProfileResponse } from "./data";
import { buildProfileEmbed } from "./utils/embeds";

const profile: Command = {
  data: new SlashCommandBuilder()
    .setName("profile")
    .setDescription("Affiche votre carte de profil personnalisée")
    .addUserOption(option =>
      option
        .setName("utilisateur")
        .setDescription("Voir le profil d'un autre utilisateur (optionnel)")
        .setRequired(false),
    ),

  async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    const targetUser = interaction.options.getUser("utilisateur") || interaction.user;

    if (targetUser.bot) {
      await interaction.reply({ content: "❌ Les bots n'ont pas de profil !", flags: MessageFlags.Ephemeral });
      return;
    }

    try {
      await interaction.deferReply();

      const { profile: profileData } = await api.get<ProfileResponse>(
        "/api/profile/me",
        targetUser.id,
        targetUser.username,
      );

      const profileCard = await generateProfileCard({
        username:   targetUser.username,
        avatarURL:  targetUser.displayAvatarURL({ extension: "png", size: 256 }),
        background: profileData.equipped_background,
        badges:     profileData.equipped_badges,
        coins:      profileData.coins,
      });

      await interaction.editReply({
        embeds: [buildProfileEmbed(targetUser.username, profileData)],
        files: [profileCard],
      });
    } catch (error) {
      await handleCommandError(error, interaction);
    }
  },
};

export default profile;
