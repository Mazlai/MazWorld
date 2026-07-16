import { REST } from "@discordjs/rest";
import { Routes } from "discord.js";
import { TOKEN, BOT_ID, GUILD_ID } from "../config/config";
import fs from "fs";
import { pathToFileURL } from 'url';
import { join } from 'path';

const commands: object[] = [];
const clientId: string = BOT_ID;
const guildId: string = GUILD_ID;

async function deployCommands() {
  try {
    console.log('\n🎯 Déploiement des commandes sur UN serveur spécifique\n');
    console.log(`   Serveur cible : ${guildId}\n`);

    const commandsPath = join(__dirname, "../commands");

    const folders = fs.readdirSync(commandsPath).filter(item => {
      const itemPath = join(commandsPath, item);
      return fs.statSync(itemPath).isDirectory();
    });

    for (const folder of folders) {
      const folderPath = join(commandsPath, folder);

      const files = fs
        .readdirSync(folderPath)
        .filter((file) => file.endsWith(".ts") || file.endsWith(".js"));

      for (const file of files) {
        const filePath = join(folderPath, file);

        try {
          const fileURL = pathToFileURL(filePath);
          const command = await import(fileURL.href);

          if (command.default && command.default.data) {
            commands.push(command.default.data.toJSON());
            console.log(`✅ ${command.default.data.name}`);
          } else if (command.data && typeof command.data.toJSON === "function") {
            commands.push(command.data.toJSON());
            console.log(`✅ ${command.data.name}`);
          }
        } catch (error: any) {
          console.error(`❌ ${file}: ${error.message}`);
        }
      }
    }

    const rest = new REST({ version: "10" }).setToken(TOKEN);

    console.log(`\n🚀 Déploiement de ${commands.length} commande(s)...\n`);

    const data = await rest.put(
      Routes.applicationGuildCommands(clientId, guildId),
      { body: commands }
    );

    console.log(`✅ ${(data as any[]).length} commande(s) déployée(s) avec succès !\n`);

    console.log('📋 Commandes disponibles sur votre serveur :');
    (data as any[]).forEach((cmd: any) => {
      console.log(`   • /${cmd.name}`);
    });

    process.exit(0);

  } catch (error: any) {
    console.error("\n❌ Erreur lors du déploiement:", error.message);
    process.exit(1);
  }
}

deployCommands();
