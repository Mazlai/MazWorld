import path from "path";
import { Collection, MessageFlags } from 'discord.js';
import { readdirSync } from "fs";
import { TOKEN } from "./config/config";
import { bot } from './utils/client';
import { Command } from "./models/Command";
import { ExtendedClient } from "./models/ExtendedClient";

import "./utils/discord";

/************| Setup |************/

const loadCommands = async (): Promise<Command[]> => {
  const Commands: Command[] = [];

  const commandsPath = path.join(__dirname, "commands");
  const commandFiles: string[] = [];

  for (const folder of readdirSync(commandsPath)) {
    const folderPath = path.join(commandsPath, folder);
    if (!folder.endsWith(".js") && !folder.endsWith(".ts")) {
      for (const file of readdirSync(folderPath)) {
        if (file.endsWith(".js") || file.endsWith(".ts")) {
          commandFiles.push(path.join(folder, file));
        }
      }
    } else {
      commandFiles.push(folder);
    }
  }

  for (const file of commandFiles) {
    const command = require(path.join(commandsPath, file)).default;

    if (!command) console.warn(`Command ${file} has not a data property`);
    Commands.push(command);
  }

  return Commands;
}

const initializeBot = async () => {
  console.log('🤖 Démarrage de MazWorld...\n');

  const extendedBot = bot as ExtendedClient;
  extendedBot.commands = new Collection<string, Command>();

  const commands = await loadCommands();
  for (const command of commands) {
    if (command.data && command.data.name) {
      extendedBot.commands.set(command.data.name, command);
      console.log(`✅ Commande chargée: ${command.data.name}`);
    }
  }

  console.log(`\n📦 ${extendedBot.commands.size} commande(s) chargée(s)\n`);

  bot.on("interactionCreate", async (interaction) => {
    if (interaction.isChatInputCommand()) {
      const command = extendedBot.commands.get(interaction.commandName);
      if (command) {
        try {
          await command.execute(interaction);
        } catch (error: any) {
          console.error(`Error executing command ${interaction.commandName}:`, error);
          await interaction.reply({
            content: 'There was an error while executing this command!',
            flags: MessageFlags.Ephemeral
          });
        }
      }
    } else if (interaction.isButton()) {
      const fairPriceCommand = extendedBot.commands.get('fairprice');
      if (fairPriceCommand && fairPriceCommand.handleButtons) {
        try {
          await fairPriceCommand.handleButtons(interaction);
        } catch (error: any) {
          await interaction.reply({
            content: 'There was an error while handling this interaction!',
            flags: MessageFlags.Ephemeral
          });
        }
      }
    }
  });

  bot.login(TOKEN);
};

initializeBot();
