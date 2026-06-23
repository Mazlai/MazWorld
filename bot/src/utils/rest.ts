import { REST } from "@discordjs/rest";
import { Routes } from "discord.js";
import { TOKEN, BOT_ID } from "../config/config";
import fs from "fs";
import { pathToFileURL } from 'url';
import { join } from 'path';

const commands: object[] = [];
const clientId: string = BOT_ID;

async function deployCommands() {
  try {
    const commandsPath = join(__dirname, "../commands");

    const folders = fs.readdirSync(commandsPath).filter(item => {
      const itemPath = join(commandsPath, item);
      return fs.statSync(itemPath).isDirectory();
    });

    console.log(`📁 Scanning ${folders.length} folders in commands directory\n`);

    for (const folder of folders) {
      const folderPath = join(commandsPath, folder);

      const files = fs
        .readdirSync(folderPath)
        .filter((file) => file.endsWith(".ts") || file.endsWith(".js"));

      console.log(`📄 Found ${files.length} command files in ${folder}/`);

      for (const file of files) {
        const filePath = join(folderPath, file);

        try {
          const fileURL = pathToFileURL(filePath);
          const command = await import(fileURL.href);

          if (command.default && command.default.data) {
            commands.push(command.default.data.toJSON());
            console.log(`✅ Loaded command: ${command.default.data.name}`);
          } else if (command.data && typeof command.data.toJSON === "function") {
            commands.push(command.data.toJSON());
            console.log(`✅ Loaded command: ${command.data.name}`);
          } else {
            console.log(`⚠️  Invalid command structure in: ${file}`);
          }
        } catch (error: any) {
          console.error(`❌ Error loading ${file}:`, error);
        }
      }
    }

    const rest = new REST({ version: "10" }).setToken(TOKEN);

    console.log(`🚀 Started refreshing ${commands.length} application (/) commands.`);

    const data = await rest.put(Routes.applicationCommands(clientId), {
      body: commands,
    });

    console.log(`✅ Successfully reloaded ${(data as any[]).length} application (/) commands.`);

    process.exit(0);

  } catch (error: any) {
    console.error("❌ Error deploying commands:", error);
    process.exit(1);
  }
}

deployCommands();
