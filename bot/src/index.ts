import path from "path";
import { Collection, MessageFlags } from 'discord.js';
import { readdirSync, existsSync } from "fs";
import { TOKEN } from "./config/config";
import { bot } from './utils/client';
import { Command } from "./models/Command";
import { ExtendedClient } from "./models/ExtendedClient";

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
      else console.warn(`⚠️  Pas d'export default valide dans ${folder}/${file}`);
    }
  }

  return commands;
};

const initializeBot = async () => {
  console.log('🤖 Démarrage de MazWorld...\n');

  const extendedBot = bot as ExtendedClient;
  extendedBot.commands = new Collection<string, Command>();

  const commands = await loadCommands();
  for (const command of commands) {
    extendedBot.commands.set(command.data.name, command);
    console.log(`✅ Commande chargée : /${command.data.name}`);
  }

  console.log(`\n📦 ${extendedBot.commands.size} commande(s) chargée(s)\n`);

  bot.on("interactionCreate", async (interaction) => {
    if (interaction.isChatInputCommand()) {
      const command = extendedBot.commands.get(interaction.commandName);
      if (!command) return;
      try {
        await command.execute(interaction);
      } catch (error: any) {
        console.error(`Erreur lors de /${interaction.commandName} :`, error);
        const errorMsg = "❌ Une erreur est survenue lors de l'exécution de cette commande.";
        if (interaction.replied || interaction.deferred) {
          await interaction.editReply({ content: errorMsg });
        } else {
          await interaction.reply({ content: errorMsg, flags: MessageFlags.Ephemeral });
        }
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
