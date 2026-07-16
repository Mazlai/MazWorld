import { REST } from '@discordjs/rest';
import { Routes } from 'discord.js';
import { BOT_ID, TOKEN } from '../config/config';

const rest = new REST({ version: '10' }).setToken(TOKEN);

async function cleanCommands() {
  console.log('\n🧹 Nettoyage des commandes Discord...\n');

  try {
    console.log('🌐 Suppression des commandes globales...')
    await rest.put(Routes.applicationCommands(BOT_ID), { body: [] });
    console.log('✅ Commandes globales supprimées.');

    console.log('📋 Récupération des serveurs...')
    const guilds = await rest.get(Routes.userGuilds()) as any[];
    console.log(`✅ ${guilds.length} serveurs récupérés.`);

    for (const guild of guilds) {
      console.log(`🗑️ Suppression des commandes sur : ${guild.name} (${guild.id})...`);
      try {
        await rest.put(Routes.applicationGuildCommands(BOT_ID, guild.id), { body: [] });
        console.log(`✅ Commandes supprimées sur : ${guild.name}.`);
      } catch (error: any) {
        console.error(`❌ Erreur sur : ${guild.name}.`, error);
      }
    }

    console.log('✅ Nettoyage terminé.');
  } catch (error) {
    console.error('❌ Erreur lors du nettoyage :', error);
  }

  process.exit(0);
}

cleanCommands();
