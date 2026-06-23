import { ChatInputCommandInteraction, SlashCommandBuilder, ButtonInteraction } from 'discord.js';

interface Command {
  data: SlashCommandBuilder | SlashCommandOptionsOnlyBuilder;
  execute: (interaction: ChatInputCommandInteraction) => Promise<void>;
  handleButtons?: (interaction: ButtonInteraction) => Promise<void>;
  autocomplete?: (interaction: AutocompleteInteraction) => Promise<void>;
}