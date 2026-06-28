import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  StringSelectMenuInteraction,
} from "discord.js";
import { api } from "../../api/client";
import { handleCommandError } from "../../utils/errorHandler";
import { Command } from "../../models/Command";
import type { ProfileResponse, ShopListResponse, EquipResponse } from "./data";
import {
  buildInventoryEmbed,
  buildInventoryActionResultEmbed,
  buildBackgroundMenuEmbed,
  buildBadgeMenuEmbed,
  buildSlotMenuEmbed,
  buildUnequipMenuEmbed,
} from "./utils/embeds";
import {
  buildInventoryButtons,
  buildBackgroundSelectMenu,
  buildBadgeSelectMenu,
  buildSlotSelectMenu,
  buildUnequipSelectMenu,
} from "./utils/components";

const inventory: Command = {
  data: new SlashCommandBuilder()
    .setName("inventory")
    .setDescription("Consultez votre inventaire et gérez vos équipements"),

  async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    const userId    = interaction.user.id;
    const username  = interaction.user.username;
    const avatarURL = interaction.user.displayAvatarURL();

    try {
      await interaction.deferReply();

      const [profileRes, bgRes, badgeRes] = await Promise.all([
        api.get<ProfileResponse>("/api/profile/me", userId, username),
        api.get<ShopListResponse>("/api/shop?type=background", userId, username),
        api.get<ShopListResponse>("/api/shop?type=badge", userId, username),
      ]);

      const profile     = profileRes.profile;
      const backgrounds = bgRes.items.filter(i => i.owned);
      const badges      = badgeRes.items.filter(i => i.owned);
      const allItems    = [...bgRes.items, ...badgeRes.items];

      const response = await interaction.editReply({
        embeds: [buildInventoryEmbed(profile, backgrounds, badges, allItems, interaction.user.username, avatarURL)],
        components: buildInventoryButtons(backgrounds.length > 0, badges.length > 0),
      });

      const collector = response.createMessageComponentCollector({
        filter: (i) => i.user.id === userId,
        time: 120_000,
      });

      collector.on("collect", async (i) => {
        try {
          await i.deferUpdate();

          if (i.customId === "equip_background") {
            if (backgrounds.length === 0) {
              await i.editReply({ content: "❌ Vous ne possédez aucun background.", components: [] });
              return;
            }
            await i.editReply({
              embeds: [buildBackgroundMenuEmbed()],
              components: [buildBackgroundSelectMenu(backgrounds, profile.equipped_background)],
            });
          } else if (i.customId === "equip_badge") {
            if (badges.length === 0) {
              await i.editReply({ content: "❌ Vous ne possédez aucun badge.", components: [] });
              return;
            }
            await i.editReply({
              embeds: [buildBadgeMenuEmbed()],
              components: [buildBadgeSelectMenu(badges, allItems, profile.equipped_badges)],
            });
          } else if (i.customId === "unequip_badge") {
            if (!profile.equipped_badges.some(Boolean)) {
              await i.editReply({ content: "❌ Vous n'avez aucun badge équipé.", components: [] });
              return;
            }
            await i.editReply({
              embeds: [buildUnequipMenuEmbed()],
              components: [buildUnequipSelectMenu(profile.equipped_badges, allItems)],
            });
          } else if (i.customId === "select_background") {
            const bgId   = (i as StringSelectMenuInteraction).values[0];
            const result = await api.post<EquipResponse>("/api/profile/equip/background", userId, username, { item_id: bgId });
            await i.editReply({ embeds: [buildInventoryActionResultEmbed(result.success, result.message)], components: [] });
            collector.stop("equipped");
          } else if (i.customId === "select_badge") {
            const badgeId  = (i as StringSelectMenuInteraction).values[0];
            const shopItem = allItems.find(it => it.item_id === badgeId);
            await i.editReply({
              embeds: [buildSlotMenuEmbed(shopItem, badgeId)],
              components: [buildSlotSelectMenu(badgeId, allItems, profile.equipped_badges)],
            });
          } else if (i.customId === "select_slot") {
            const [badgeId, slotStr] = (i as StringSelectMenuInteraction).values[0].split(":");
            const slot   = parseInt(slotStr, 10);
            const result = await api.post<EquipResponse>("/api/profile/equip/badge", userId, username, { badge_id: badgeId, slot });
            await i.editReply({ embeds: [buildInventoryActionResultEmbed(result.success, result.message)], components: [] });
            collector.stop("equipped");
          } else if (i.customId === "select_unequip_slot") {
            const slot   = parseInt((i as StringSelectMenuInteraction).values[0], 10);
            const result = await api.post<EquipResponse>("/api/profile/unequip/badge", userId, username, { slot });
            await i.editReply({ embeds: [buildInventoryActionResultEmbed(result.success, result.message)], components: [] });
            collector.stop("equipped");
          }
        } catch (error) {
          await handleCommandError(error, i as any);
        }
      });

      collector.on("end", (_collected, reason) => {
        if (reason === "time") {
          interaction.editReply({ content: "⌛ Temps écoulé.", components: [] }).catch(console.error);
        }
      });
    } catch (error) {
      await handleCommandError(error, interaction);
    }
  },
};

export default inventory;
