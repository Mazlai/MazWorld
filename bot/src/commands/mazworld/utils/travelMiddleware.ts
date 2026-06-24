import { ChatInputCommandInteraction, MessageFlags } from "discord.js";
import { api } from "../../../api/client";

interface TravelStatus {
  traveling: boolean;
  destination?: string;
  destination_name?: string;
  destination_emoji?: string;
  arrival_time?: number;
}

export async function checkTravelingStatus(interaction: ChatInputCommandInteraction): Promise<boolean> {
  const status = await api.get<TravelStatus>(
    "/api/travel/status",
    interaction.user.id,
    interaction.user.username,
  );

  if (!status.traveling) return false;

  const timeLeft = (status.arrival_time ?? 0) - Math.floor(Date.now() / 1000);
  const hours    = Math.floor(timeLeft / 3600);
  const minutes  = Math.floor((timeLeft % 3600) / 60);
  const timeStr  = [hours > 0 && `${hours}h`, minutes > 0 && `${minutes}m`].filter(Boolean).join(" ");

  await interaction.reply({
    content:
      `🚂 **Vous êtes en voyage !**\n\n` +
      `📍 Destination : **${status.destination_emoji ?? ""} ${status.destination_name ?? ""}**\n` +
      `⏱️ Arrivée dans : **${timeStr || "moins d'une minute"}**\n\n` +
      `❌ Vous ne pouvez pas utiliser cette commande pendant le trajet.\n` +
      `✅ Vous pouvez consulter votre \`/profile\` et \`/inventory\``,
    flags: MessageFlags.Ephemeral,
  });

  return true;
}
