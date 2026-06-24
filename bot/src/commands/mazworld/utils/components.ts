import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  StringSelectMenuBuilder,
} from "discord.js";
import type { MapRoute, ShopItem } from "../data";

// ===== MAP =====

export function buildMapButtons(routes: MapRoute[]): ActionRowBuilder<ButtonBuilder>[] {
  const buttons = routes.slice(0, 5).map(r =>
    new ButtonBuilder()
      .setCustomId(`travel_${r.city_to}`)
      .setLabel(`${r.destination_emoji} ${r.destination_name}`)
      .setStyle(ButtonStyle.Primary),
  );
  return buttons.length > 0
    ? [new ActionRowBuilder<ButtonBuilder>().addComponents(buttons)]
    : [];
}

export function buildTravelConfirmRow(): ActionRowBuilder<ButtonBuilder> {
  return new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder().setCustomId("confirm_travel").setLabel("✅ Confirmer le voyage").setStyle(ButtonStyle.Success),
    new ButtonBuilder().setCustomId("cancel_travel").setLabel("❌ Annuler").setStyle(ButtonStyle.Danger),
  );
}

// ===== SHOP =====

export function buildShopCategorySelect(): ActionRowBuilder<StringSelectMenuBuilder> {
  return new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
    new StringSelectMenuBuilder()
      .setCustomId("shop_category")
      .setPlaceholder("Sélectionnez une catégorie")
      .addOptions([
        { label: "Backgrounds", description: "Personnalisez le fond de votre profil", value: "background", emoji: "🎨" },
        { label: "Badges", description: "Collectionnez des badges uniques", value: "badge", emoji: "🏅" },
      ]),
  );
}

export function buildShopItemSelect(items: ShopItem[]): ActionRowBuilder<StringSelectMenuBuilder> {
  const menu = new StringSelectMenuBuilder()
    .setCustomId("shop_item")
    .setPlaceholder("Choisissez un item");
  for (const item of items.slice(0, 25)) {
    menu.addOptions({
      label: `${item.name} - ${item.price}€`,
      description: item.owned ? "✅ Déjà possédé" : (item.description?.substring(0, 100) || "Aucune description"),
      value: item.item_id,
      emoji: item.emoji || undefined,
    });
  }
  return new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(menu);
}

export function buildPurchaseConfirmRow(alreadyOwned: boolean, canAfford: boolean): ActionRowBuilder<ButtonBuilder> {
  return new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId("confirm_purchase")
      .setLabel("Acheter")
      .setStyle(ButtonStyle.Success)
      .setDisabled(alreadyOwned || !canAfford),
    new ButtonBuilder()
      .setCustomId("cancel_purchase")
      .setLabel("Annuler")
      .setStyle(ButtonStyle.Secondary),
  );
}

// ===== INVENTORY =====

export function buildInventoryButtons(hasBackgrounds: boolean, hasBadges: boolean): ActionRowBuilder<ButtonBuilder>[] {
  const rows: ActionRowBuilder<ButtonBuilder>[] = [];

  if (hasBackgrounds) {
    rows.push(new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder().setCustomId("equip_background").setLabel("Équiper un background").setEmoji("🎨").setStyle(ButtonStyle.Primary),
    ));
  }

  if (hasBadges) {
    rows.push(new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder().setCustomId("equip_badge").setLabel("Équiper un badge").setEmoji("🏅").setStyle(ButtonStyle.Success),
      new ButtonBuilder().setCustomId("unequip_badge").setLabel("Retirer un badge").setEmoji("🗑️").setStyle(ButtonStyle.Danger),
    ));
  }

  if (!hasBackgrounds && !hasBadges) {
    rows.push(new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder().setCustomId("goto_shop").setLabel("Visiter le shop").setEmoji("🏪").setStyle(ButtonStyle.Primary).setDisabled(true),
    ));
  }

  return rows;
}

export function buildBackgroundSelectMenu(backgrounds: ShopItem[], equippedBgId: string): ActionRowBuilder<StringSelectMenuBuilder> {
  const menu = new StringSelectMenuBuilder()
    .setCustomId("select_background")
    .setPlaceholder("Choisissez un background à équiper");
  for (const bg of backgrounds) {
    const isEquipped = equippedBgId === bg.item_id;
    menu.addOptions({
      label: bg.name + (isEquipped ? " (équipé)" : ""),
      value: bg.item_id,
      emoji: bg.emoji || undefined,
      description: isEquipped ? "✅ Actuellement équipé" : bg.description?.substring(0, 100),
    });
  }
  return new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(menu);
}

export function buildBadgeSelectMenu(badges: ShopItem[], allItems: ShopItem[], equippedBadges: string[]): ActionRowBuilder<StringSelectMenuBuilder> {
  const menu = new StringSelectMenuBuilder()
    .setCustomId("select_badge")
    .setPlaceholder("Choisissez un badge à équiper");
  for (const badge of badges) {
    const item         = allItems.find(it => it.item_id === badge.item_id);
    const equippedSlot = equippedBadges.indexOf(badge.item_id);
    const isEquipped   = equippedSlot !== -1;
    menu.addOptions({
      label: (item?.name ?? badge.item_id) + (isEquipped ? ` (Slot ${equippedSlot + 1})` : ""),
      value: badge.item_id,
      emoji: item?.emoji || undefined,
      description: isEquipped ? `✅ Équipé dans le slot ${equippedSlot + 1}` : item?.description?.substring(0, 100),
    });
  }
  return new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(menu);
}

export function buildSlotSelectMenu(badgeId: string, allItems: ShopItem[], equippedBadges: string[]): ActionRowBuilder<StringSelectMenuBuilder> {
  const menu = new StringSelectMenuBuilder()
    .setCustomId("select_slot")
    .setPlaceholder("Choisissez un slot (1-6)");
  for (let slot = 0; slot < 6; slot++) {
    const occupiedId = equippedBadges[slot];
    const occupied   = occupiedId ? allItems.find(it => it.item_id === occupiedId) : null;
    menu.addOptions({
      label: `Slot ${slot + 1}`,
      value: `${badgeId}:${slot}`,
      description: occupied ? `${occupied.emoji ?? ""} ${occupied.name} (sera remplacé)` : "Vide",
      emoji: occupied ? "🔄" : "⚫",
    });
  }
  return new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(menu);
}

export function buildUnequipSelectMenu(equippedBadges: string[], allItems: ShopItem[]): ActionRowBuilder<StringSelectMenuBuilder> {
  const menu = new StringSelectMenuBuilder()
    .setCustomId("select_unequip_slot")
    .setPlaceholder("Choisissez un slot à vider");
  for (let idx = 0; idx < 6; idx++) {
    const badgeId = equippedBadges[idx];
    if (badgeId) {
      const item = allItems.find(it => it.item_id === badgeId);
      menu.addOptions({
        label: `Slot ${idx + 1} : ${item?.name ?? "Badge"}`,
        value: idx.toString(),
        emoji: item?.emoji || "❓",
        description: "Retirer ce badge",
      });
    }
  }
  return new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(menu);
}
