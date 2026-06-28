import path from "path";
import { Collection } from 'discord.js';
import { readdirSync, existsSync } from "fs";
import { TOKEN } from "./config/config";
import { bot } from './utils/client';
import { Command } from "./models/Command";
import { ExtendedClient } from "./models/ExtendedClient";
import { handleCommandError } from "./utils/errorHandler";
import { logger } from "./utils/logger";

import "./utils/discord";

const loadCommands = async (): Promise<Command[]> => {
  const commands: Command[] = [];
  const commandsPath = path.join(__dirname, "commands");

  if (!existsSync(commandsPath)) return commands;

  for (const folder of readdirSync(commandsPath)) {
    const folderPath = path.join(commandsPath, folder);
    if (folder.endsWith(".js") || folder.endsWith(".ts")) {
      const cmd = require(path.join(commandsPath, folder)).default;
      if (cmd) commands.push(cmd);
      continue;
    }
    for (const file of readdirSync(folderPath)) {
      if (!file.endsWith(".js") && !file.endsWith(".ts")) continue;
      const cmd = require(path.join(folderPath, file)).default;
      if (cmd?.data?.name) commands.push(cmd);
      else logger.warn(`Pas d'export default valide dans ${folder}/${file}`);
    }
  }

  return commands;
};

const initializeBot = async () => {
  logger.info('Démarrage de MazWorld...');

  const extendedBot = bot as ExtendedClient;
  extendedBot.commands = new Collection<string, Command>();

  const commands = await loadCommands();
  for (const command of commands) {
    extendedBot.commands.set(command.data.name, command);
    logger.info(`Commande chargée : /${command.data.name}`);
  }

  logger.info(`${extendedBot.commands.size} commande(s) chargée(s)`);

  bot.on("interactionCreate", async (interaction) => {
    if (interaction.isChatInputCommand()) {
      const command = extendedBot.commands.get(interaction.commandName);
      if (!command) return;

      const start = Date.now();
      try {
        await command.execute(interaction);
        logger.command(
          interaction.commandName,
          interaction.user.id,
          interaction.user.username,
          interaction.guildId,
          true,
          Date.now() - start,
        );
      } catch (error) {
        logger.command(
          interaction.commandName,
          interaction.user.id,
          interaction.user.username,
          interaction.guildId,
          false,
          Date.now() - start,
        );
        logger.error(`Erreur non gérée dans /${interaction.commandName}`, error);
        await handleCommandError(error, interaction);
      }
    } else if (interaction.isButton() || interaction.isStringSelectMenu()) {
      for (const command of extendedBot.commands.values()) {
        if (command.handleButtons) {
          try {
            await command.handleButtons(interaction as any);
          } catch { /* laisse les autres commandes gérer */ }
        }
      }
    }
  });

  bot.login(TOKEN);
};

initializeBot();
