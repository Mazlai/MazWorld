import { EmbedBuilder } from "discord.js";
import type {
  TravelStatus,
  MapRoute,
  MapResponse,
  TravelStartResponse,
  ProfileData,
  ShopItem,
  PurchaseResponse,
  WorkResponse,
  DailyResponse,
  CoinflipResponse,
} from "../data";

const FOOTER_ICON = "https://i.pinimg.com/564x/4d/73/9f/4d739fa55c3465cadc171fdcc75c01d9.jpg";
const FOOTER_TEXT = "MazWorld";

const CITY_COLORS: Record<string, number> = {
  Village:  0x8bc34a,
  Commerce: 0xffc107,
  "Forêt":  0x4caf50,
  "Côte":   0x03a9f4,
  Montagne: 0x9e9e9e,
  "Désert": 0xff9800,
  Capitale: 0x9c27b0,
};

// ===== MAP =====

export function buildTravelInProgressEmbed(status: TravelStatus, avatarURL: string): EmbedBuilder {
  const timeLeft = (status.arrival_time ?? 0) - Math.floor(Date.now() / 1000);
  const hours    = Math.floor(timeLeft / 3600);
  const minutes  = Math.floor((timeLeft % 3600) / 60);
  return new EmbedBuilder()
    .setTitle("🚂 Voyage en cours...")
    .setDescription(`Vous voyagez vers **${status.destination_emoji} ${status.destination_name}**`)
    .setColor(0xffaa00)
    .addFields({ name: "⏱️ Arrivée prévue", value: `<t:${status.arrival_time}:R> (${hours}h ${minutes}m)`, inline: false })
    .setThumbnail(avatarURL)
    .setFooter({ text: "Bon voyage ! Profitez du paysage 🌄", iconURL: FOOTER_ICON });
}

export function buildMapEmbed(data: MapResponse, avatarURL: string): EmbedBuilder {
  const { current_city: city, coins, routes } = data;
  const destinationsText = routes.length > 0
    ? routes.map(r =>
        r.visited
          ? `${r.destination_emoji} **${r.destination_name}** - ✅ Gratuit (${Math.floor(r.duration / 60)}min)`
          : `${r.destination_emoji} **${r.destination_name}** - ${r.effective_cost}€ (${Math.floor(r.duration / 60)}min)`,
      ).join("\n")
    : "Aucune route disponible depuis cette ville.";

  return new EmbedBuilder()
    .setTitle("🗺️ Carte du Monde")
    .setDescription(
      `📍 **Position actuelle :** ${city.emoji} **${city.name}**\n` +
      `*${city.description}*\n\n` +
      `💰 **Solde :** ${coins}€`,
    )
    .setColor(0x5865f2)
    .setThumbnail(avatarURL)
    .addFields({ name: "🧭 Destinations disponibles", value: destinationsText, inline: false })
    .setFooter({ text: "💡 Les villes déjà visitées sont gratuites !", iconURL: FOOTER_ICON });
}

export function buildTravelConfirmEmbed(route: MapRoute): EmbedBuilder {
  return new EmbedBuilder()
    .setTitle(`🎫 Voyage vers ${route.destination_emoji} ${route.destination_name}`)
    .setColor(route.visited ? 0x00ff00 : 0x5865f2)
    .addFields(
      { name: "💰 Coût", value: route.visited ? "**Gratuit** ✅ (déjà visité)" : `${route.effective_cost}€`, inline: true },
      { name: "⏱️ Durée", value: `${Math.floor(route.duration / 60)} minutes`, inline: true },
      {
        name: "⚠️ Pendant le voyage",
        value: "❌ Vous ne pourrez pas travailler, jouer ou acheter\n✅ Vous pourrez consulter votre profil et inventaire",
        inline: false,
      },
    );
}

export function buildTravelSuccessEmbed(route: MapRoute, result: TravelStartResponse, avatarURL: string): EmbedBuilder {
  return new EmbedBuilder()
    .setTitle("🚂 Voyage commencé !")
    .setDescription(
      `Vous êtes en route vers **${route.destination_emoji} ${route.destination_name}** !\n\n` +
      (result.travel_cost ? `💸 Vous avez payé **${result.travel_cost}€**\n` : `✅ Voyage gratuit (ville déjà visitée)\n`) +
      `💰 Solde restant : **${result.coins}€**`,
    )
    .setColor(0x00ff00)
    .addFields({ name: "⏱️ Arrivée prévue", value: `<t:${result.arrival_time}:R>`, inline: false })
    .setThumbnail(avatarURL)
    .setFooter({ text: "Bon voyage ! 🌍", iconURL: FOOTER_ICON });
}

// ===== CITYINFO =====

export function buildCityinfoEmbed(data: MapResponse, avatarURL: string): EmbedBuilder {
  const { current_city: city, routes, jobs = [] } = data;

  const embed = new EmbedBuilder()
    .setTitle(`🏙️ Infos sur ${city.emoji} ${city.name}`)
    .setDescription(city.description)
    .setColor(CITY_COLORS[city.theme] ?? 0x5865f2)
    .setThumbnail(avatarURL)
    .addFields(
      { name: "🏷️ Thème", value: city.theme || "Village", inline: true },
      { name: "🔗 Connexions", value: `${routes.length} ville(s) connectée(s)`, inline: true },
      { name: "🗺️ Statut de visite", value: "Ville visitée", inline: true },
    );

  const jobsText = jobs.length > 0
    ? jobs.map(j => `${j.job_emoji} **${j.job_name}**\n   • ${j.task_1}\n   • ${j.task_2}\n   • ${j.task_3}`).join("\n\n")
    : null;
  embed.addFields({
    name: `💼 Métiers disponibles${jobs.length > 0 ? ` (${jobs.length})` : ""}`,
    value: jobsText ?? "Aucun métier disponible dans cette ville.",
    inline: false,
  });

  if (routes.length > 0) {
    embed.addFields({
      name: "🗺️ Destinations depuis cette ville",
      value: routes.map(r => {
        const cost = r.visited ? "Gratuit ✅" : `${r.effective_cost}€`;
        return `${r.destination_emoji} **${r.destination_name}** - ${cost} (${Math.floor(r.duration / 60)}min)`;
      }).join("\n"),
      inline: false,
    });
  }

  embed
    .addFields({
      name: "💡 Informations",
      value: "• Utilisez `/work` pour travailler dans cette ville\n• Utilisez `/map` pour voyager vers une autre ville",
      inline: false,
    })
    .setFooter({ text: `${city.name} vous souhaite la bienvenue !`, iconURL: FOOTER_ICON })
    .setTimestamp();

  return embed;
}

// ===== DAILY =====

export function buildDailySuccessEmbed(result: DailyResponse, avatarURL: string): EmbedBuilder {
  return new EmbedBuilder()
    .setTitle("🎁 Récompense Quotidienne")
    .setDescription(result.message)
    .setColor(0x00ff00)
    .addFields({ name: "💰 Nouveau solde", value: `${result.coins}€`, inline: true })
    .setThumbnail(avatarURL)
    .setTimestamp()
    .setFooter({ text: "Revenez demain pour une nouvelle récompense !", iconURL: FOOTER_ICON });
}

export function buildDailyAlreadyClaimedEmbed(result: DailyResponse, avatarURL: string): EmbedBuilder {
  const embed = new EmbedBuilder()
    .setTitle("⏰ Récompense Déjà Réclamée")
    .setDescription(result.message)
    .setColor(0xff9900)
    .setThumbnail(avatarURL)
    .setTimestamp();
  if (result.next_daily) {
    embed.addFields({ name: "📅 Prochaine récompense", value: `<t:${result.next_daily}:R>`, inline: true });
  }
  return embed;
}

// ===== WORK =====

export function buildWorkLoadingEmbed(avatarURL: string): EmbedBuilder {
  return new EmbedBuilder()
    .setTitle("💼 Au travail...")
    .setDescription("Recherche d'un emploi dans la ville...")
    .setColor(0xffaa00)
    .setThumbnail(avatarURL);
}

export function buildWorkResultEmbed(result: WorkResponse, avatarURL: string): EmbedBuilder {
  return new EmbedBuilder()
    .setTitle(`${result.job_emoji} Travail terminé !`)
    .setDescription(`💼 **${result.job_name}**\n\n*${result.task}*`)
    .setColor(0x00ff00)
    .setThumbnail(avatarURL)
    .addFields(
      { name: "💰 Gains", value: `+${result.reward}€`, inline: true },
      { name: "💼 Nouveau solde", value: `${result.coins}€`, inline: true },
      { name: "⏱️ Prochain travail", value: `<t:${result.next_work}:R>`, inline: false },
    )
    .setFooter({ text: "Bon travail ! Revenez dans 1 heure", iconURL: FOOTER_ICON })
    .setTimestamp();
}

// ===== COINFLIP =====

export function buildCoinflipLoadingEmbed(mise: number, choix: string, avatarURL: string): EmbedBuilder {
  return new EmbedBuilder()
    .setTitle("🪙 Lancement de la pièce...")
    .setDescription(`Vous avez parié **${mise}€** sur **${choix}** !`)
    .setColor(0xffaa00)
    .setThumbnail(avatarURL);
}

export function buildCoinflipResultEmbed(result: CoinflipResponse, avatarURL: string): EmbedBuilder {
  return new EmbedBuilder()
    .setTitle(result.won ? "🎉 VICTOIRE !" : "💔 DÉFAITE")
    .setDescription(result.message)
    .setColor(result.won ? 0x00ff00 : 0xff0000)
    .setThumbnail(avatarURL)
    .addFields(
      { name: "🎲 Résultat", value: result.result === "pile" ? "🪙 **PILE**" : "🎴 **FACE**", inline: true },
      { name: "💸 Résultat", value: result.won ? `+${result.amount}€` : `-${result.amount}€`, inline: true },
      { name: "💰 Nouveau solde", value: `${result.coins}€`, inline: true },
    )
    .setFooter({ text: result.won ? "Bien joué !" : "Retentez votre chance !", iconURL: FOOTER_ICON })
    .setTimestamp();
}

// ===== SHOP =====

export function buildShopHomeEmbed(userCoins: number): EmbedBuilder {
  return new EmbedBuilder()
    .setTitle("🏪 Magasin MazWorld")
    .setDescription(`💰 Votre argent : **${userCoins}€**\n\nChoisissez une catégorie ci-dessous :`)
    .setColor(0x5865f2)
    .setThumbnail("https://i.pinimg.com/564x/a7/26/5c/a7265ce5384476970886fd1ded1807bb.jpg")
    .setTimestamp()
    .setFooter({ text: FOOTER_TEXT, iconURL: FOOTER_ICON });
}

export function buildShopCategoryEmbed(category: "background" | "badge", userCoins: number): EmbedBuilder {
  return new EmbedBuilder()
    .setTitle(`🏪 ${category === "background" ? "Backgrounds" : "Badges"}`)
    .setDescription(`💰 Votre argent : **${userCoins}€**\n\nSélectionnez un item à acheter :`)
    .setColor(0x5865f2)
    .setTimestamp();
}

export function buildShopItemConfirmEmbed(item: ShopItem, userCoins: number): EmbedBuilder {
  const alreadyOwned = item.owned;
  return new EmbedBuilder()
    .setTitle(`${item.emoji ?? ""} ${item.name}`)
    .setDescription(item.description || "Aucune description")
    .addFields(
      { name: "💰 Prix", value: `${item.price}€`, inline: true },
      { name: "👛 Votre argent", value: `${userCoins}€`, inline: true },
      {
        name: "📊 Statut",
        value: alreadyOwned
          ? "✅ Déjà possédé"
          : userCoins >= item.price ? "✅ Vous pouvez acheter" : "❌ Pas assez d'argent",
        inline: false,
      },
    )
    .setColor(alreadyOwned ? 0xffaa00 : userCoins >= item.price ? 0x00ff00 : 0xff0000);
}

export function buildShopPurchaseResultEmbed(result: PurchaseResponse): EmbedBuilder {
  const embed = new EmbedBuilder()
    .setTitle(result.success ? "✅ Achat réussi !" : "❌ Achat échoué")
    .setDescription(result.message)
    .setColor(result.success ? 0x00ff00 : 0xff0000);
  if (result.success && result.new_balance !== undefined) {
    embed.addFields({ name: "💰 Nouveau solde", value: `${result.new_balance}€`, inline: true });
  }
  return embed;
}

// ===== INVENTORY =====

export function buildInventoryEmbed(
  profile: ProfileData,
  backgrounds: ShopItem[],
  badges: ShopItem[],
  allItems: ShopItem[],
  username: string,
  avatarURL: string,
): EmbedBuilder {
  const totalSpent = [...backgrounds, ...badges].reduce((sum, i) => sum + i.price, 0);
  const equippedBg = allItems.find(i => i.item_id === profile.equipped_background);
  const bgName     = equippedBg ? `${equippedBg.emoji ?? ""} ${equippedBg.name}` : "⬜ Défaut";

  let badgesText = "";
  for (let i = 0; i < 6; i++) {
    const badgeId = profile.equipped_badges[i];
    const badge   = badgeId ? allItems.find(it => it.item_id === badgeId) : null;
    badgesText += badgeId
      ? `**[${i + 1}]** ${badge?.emoji ?? "❓"} ${badge?.name ?? "Inconnu"}\n`
      : `**[${i + 1}]** ⚫ Vide\n`;
  }

  return new EmbedBuilder()
    .setTitle(`🎒 Inventaire de ${username}`)
    .setColor(0x5865f2)
    .setThumbnail(avatarURL)
    .setTimestamp()
    .setFooter({ text: FOOTER_TEXT, iconURL: FOOTER_ICON })
    .addFields(
      { name: "💰 Solde", value: `**${profile.coins}€**`, inline: true },
      { name: "🖼️ Backgrounds", value: `${backgrounds.length}`, inline: true },
      { name: "🏅 Badges", value: `${badges.length}`, inline: true },
      { name: "💸 Dépenses totales", value: `**${totalSpent}€**`, inline: true },
      { name: "🎨 Background actuel", value: bgName, inline: false },
      { name: "🏅 Badges équipés", value: badgesText || "Aucun badge équipé", inline: false },
    );
}

export function buildInventoryActionResultEmbed(success: boolean, message: string): EmbedBuilder {
  return new EmbedBuilder()
    .setTitle(success ? "✅ Succès !" : "❌ Erreur")
    .setDescription(message)
    .setColor(success ? 0x00ff00 : 0xff0000);
}

export function buildBackgroundMenuEmbed(): EmbedBuilder {
  return new EmbedBuilder()
    .setTitle("🎨 Équiper un Background")
    .setDescription("Sélectionnez le background à équiper :")
    .setColor(0x5865f2);
}

export function buildBadgeMenuEmbed(): EmbedBuilder {
  return new EmbedBuilder()
    .setTitle("🏅 Équiper un Badge")
    .setDescription("Sélectionnez le badge à équiper :")
    .setColor(0x00ff00);
}

export function buildSlotMenuEmbed(shopItem: ShopItem | undefined, badgeId: string): EmbedBuilder {
  return new EmbedBuilder()
    .setTitle(`🏅 ${shopItem?.emoji ?? ""} ${shopItem?.name ?? badgeId}`)
    .setDescription("Choisissez le slot où équiper ce badge :")
    .setColor(0x00ff00);
}

export function buildUnequipMenuEmbed(): EmbedBuilder {
  return new EmbedBuilder()
    .setTitle("🗑️ Retirer un Badge")
    .setDescription("Sélectionnez le badge à retirer :")
    .setColor(0xff0000);
}

// ===== PROFILE =====

export function buildProfileEmbed(username: string, profileData: ProfileData): EmbedBuilder {
  const createdTimestamp = Math.floor(new Date(profileData.created_at!).getTime() / 1000);
  return new EmbedBuilder()
    .setColor(0x5865f2)
    .setTitle(`🎴 Profil de ${username}`)
    .setDescription(
      `💰 **${profileData.coins}€**\n` +
      `📅 Membre depuis <t:${createdTimestamp}:R>`,
    )
    .setImage("attachment://profile.png")
    .setTimestamp()
    .setFooter({ text: FOOTER_TEXT, iconURL: FOOTER_ICON });
}
