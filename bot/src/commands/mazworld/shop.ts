import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  StringSelectMenuInteraction,
  ComponentType,
} from "discord.js";
import { api, ApiError } from "../../api/client";
import { Command } from "../../models/Command";
import type { ShopListResponse, PurchaseResponse } from "./data";
import {
  buildShopHomeEmbed,
  buildShopCategoryEmbed,
  buildShopItemConfirmEmbed,
  buildShopPurchaseResultEmbed,
} from "./utils/embeds";
import {
  buildShopCategorySelect,
  buildShopItemSelect,
  buildPurchaseConfirmRow,
} from "./utils/components";

const shop: Command = {
  data: new SlashCommandBuilder()
    .setName("shop")
    .setDescription("Accéder au magasin pour acheter des backgrounds et badges"),

  async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    const userId   = interaction.user.id;
    const username = interaction.user.username;

    let userCoins = 0;
    try {
      const data = await api.get<ShopListResponse>("/api/shop", userId, username);
      userCoins = data.user_coins;
    } catch {
      await interaction.reply({ content: "❌ Impossible de charger le magasin.", flags: 64 });
      return;
    }

    await interaction.reply({ embeds: [buildShopHomeEmbed(userCoins)], components: [buildShopCategorySelect()] });
    const response = await interaction.fetchReply();

    const collector = response.createMessageComponentCollector({
      componentType: ComponentType.StringSelect,
      filter: (i) => i.customId === "shop_category" && i.user.id === userId,
      time: 120_000,
    });

    collector.on("collect", async (i: StringSelectMenuInteraction) => {
      await i.deferUpdate();

      const category = i.values[0] as "background" | "badge";
      let shopData: ShopListResponse;
      try {
        shopData = await api.get<ShopListResponse>(`/api/shop?type=${category}`, userId, username);
      } catch {
        await i.editReply({ content: "❌ Impossible de charger les items.", embeds: [], components: [] });
        return;
      }

      const items = shopData.items;
      if (items.length === 0) {
        await i.editReply({
          content: `❌ Aucun ${category === "background" ? "background" : "badge"} disponible.`,
          embeds: [],
          components: [],
        });
        return;
      }

      await i.editReply({
        embeds: [buildShopCategoryEmbed(category, shopData.user_coins)],
        components: [buildShopItemSelect(items)],
      });

      const itemCollector = response.createMessageComponentCollector({
        componentType: ComponentType.StringSelect,
        filter: (itemInt) => itemInt.customId === "shop_item" && itemInt.user.id === userId,
        time: 120_000,
      });

      itemCollector.on("collect", async (itemInt: StringSelectMenuInteraction) => {
        await itemInt.deferUpdate();

        const itemId = itemInt.values[0];
        const item   = items.find(it => it.item_id === itemId);

        if (!item) {
          await itemInt.editReply({ content: "❌ Item introuvable.", embeds: [], components: [] });
          return;
        }

        await itemInt.editReply({
          embeds: [buildShopItemConfirmEmbed(item, shopData.user_coins)],
          components: [buildPurchaseConfirmRow(item.owned, shopData.user_coins >= item.price)],
        });

        const buttonCollector = response.createMessageComponentCollector({
          componentType: ComponentType.Button,
          filter: (btn) => btn.user.id === userId,
          time: 30_000,
        });

        buttonCollector.on("collect", async (btn) => {
          await btn.deferUpdate();

          if (btn.customId === "confirm_purchase") {
            let purchaseResult: PurchaseResponse;
            try {
              purchaseResult = await api.post<PurchaseResponse>(
                "/api/shop/purchase",
                userId,
                username,
                { item_id: itemId },
              );
            } catch (error) {
              const msg = error instanceof ApiError ? error.message : "Erreur lors de l'achat.";
              await btn.editReply({ content: `❌ ${msg}`, embeds: [], components: [] });
              buttonCollector.stop();
              return;
            }
            await btn.editReply({ embeds: [buildShopPurchaseResultEmbed(purchaseResult)], components: [] });
            buttonCollector.stop();
            itemCollector.stop();
            collector.stop();
          } else {
            await btn.editReply({ content: "❌ Achat annulé.", embeds: [], components: [] });
            buttonCollector.stop();
          }
        });

        buttonCollector.on("end", (_collected, reason) => {
          if (reason === "time") {
            itemInt.editReply({ content: "⏱️ Temps écoulé. Achat annulé.", components: [] }).catch(console.error);
          }
        });
      });

      itemCollector.on("end", (_collected, reason) => {
        if (reason === "time") {
          i.editReply({ content: "⏱️ Temps écoulé.", components: [] }).catch(console.error);
        }
      });
    });

    collector.on("end", (_collected, reason) => {
      if (reason === "time") {
        interaction.editReply({ content: "⏱️ Temps écoulé.", components: [] }).catch(console.error);
      }
    });
  },
};

export default shop;
