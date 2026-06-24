import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  ComponentType,
  MessageFlags,
} from "discord.js";
import { api, ApiError } from "../../api/client";
import { Command } from "../../models/Command";
import type { TravelStatus, MapResponse, TravelStartResponse } from "./data";
import {
  buildTravelInProgressEmbed,
  buildMapEmbed,
  buildTravelConfirmEmbed,
  buildTravelSuccessEmbed,
} from "./utils/embeds";
import { buildMapButtons, buildTravelConfirmRow } from "./utils/components";

const map: Command = {
  data: new SlashCommandBuilder()
    .setName("map")
    .setDescription("Consultez la carte et voyagez entre les villes"),

  async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    const userId    = interaction.user.id;
    const username  = interaction.user.username;
    const avatarURL = interaction.user.displayAvatarURL();

    try {
      const travelStatus = await api.get<TravelStatus>("/api/travel/status", userId, username);

      if (travelStatus.traveling && travelStatus.arrival_time) {
        await interaction.reply({ embeds: [buildTravelInProgressEmbed(travelStatus, avatarURL)] });
        return;
      }

      const mapData = await api.get<MapResponse>("/api/travel/map", userId, username);
      const { routes } = mapData;
      const rows = buildMapButtons(routes);

      const { resource } = await interaction.reply({
        embeds: [buildMapEmbed(mapData, avatarURL)],
        components: rows,
        withResponse: true,
      });
      const response = resource?.message;
      if (rows.length === 0 || !response) return;

      const collector = response.createMessageComponentCollector({
        componentType: ComponentType.Button,
        filter: (i) => i.user.id === userId && i.customId.startsWith("travel_"),
        time: 60_000,
      });

      collector.on("collect", async (i) => {
        collector.stop("destination_selected");
        await i.deferUpdate();

        const destinationId = i.customId.replace("travel_", "");
        const route = routes.find(r => r.city_to === destinationId);

        if (!route) {
          await i.editReply({ content: "❌ Cette destination n'existe plus.", embeds: [], components: [] });
          return;
        }

        await i.editReply({ embeds: [buildTravelConfirmEmbed(route)], components: [buildTravelConfirmRow()] });

        const confirmCollector = response.createMessageComponentCollector({
          componentType: ComponentType.Button,
          filter: (btn) => btn.user.id === userId && ["confirm_travel", "cancel_travel"].includes(btn.customId),
          time: 30_000,
        });

        confirmCollector.on("collect", async (btn) => {
          await btn.deferUpdate();

          if (btn.customId === "confirm_travel") {
            try {
              const result = await api.post<TravelStartResponse>(
                "/api/travel/start",
                userId,
                username,
                { destination_id: destinationId },
              );
              if (!result.success) {
                await btn.editReply({ content: `❌ ${result.message}`, embeds: [], components: [] });
                return;
              }
              await btn.editReply({ embeds: [buildTravelSuccessEmbed(route, result, avatarURL)], components: [] });
            } catch (error) {
              const msg = error instanceof ApiError ? error.message : "Erreur lors du départ.";
              await btn.editReply({ content: `❌ ${msg}`, embeds: [], components: [] });
            }
            confirmCollector.stop();
          } else {
            await btn.editReply({ content: "❌ Voyage annulé. Vous êtes resté à votre position actuelle.", embeds: [], components: [] });
            confirmCollector.stop();
          }
        });

        confirmCollector.on("end", (_collected, reason) => {
          if (reason === "time") {
            i.editReply({ content: "⏱️ Temps écoulé. Voyage annulé.", components: [] }).catch(console.error);
          }
        });
      });

      collector.on("end", (_collected, reason) => {
        if (reason === "time") {
          interaction.editReply({ components: [] }).catch(console.error);
        }
      });
    } catch (error) {
      console.error("Erreur dans /map:", error);
      const errorMessage = "❌ Une erreur est survenue lors de l'affichage de la carte.";
      if (interaction.deferred || interaction.replied) {
        await interaction.editReply({ content: errorMessage });
      } else {
        await interaction.reply({ content: errorMessage, flags: MessageFlags.Ephemeral });
      }
    }
  },
};

export default map;
