import { MessageFlags } from 'discord.js';
import { ApiError } from '../api/client';

const COOLDOWN_STATUSES = new Set([409, 429]);

interface Replyable {
  deferred: boolean;
  replied: boolean;
  editReply(options: { content: string; embeds?: any[]; components?: any[] }): Promise<unknown>;
  reply(options: { content: string; flags?: number }): Promise<unknown>;
}

function buildMessage(error: unknown): string {
  if (error instanceof ApiError) {
    const prefix = COOLDOWN_STATUSES.has(error.status) ? '⏱️' : '❌';
    return `${prefix} ${error.message}`;
  }
  return '❌ Une erreur inattendue est survenue. Réessayez dans un instant.';
}

export async function handleCommandError(
  error: unknown,
  interaction: Replyable,
): Promise<void> {
  const content = buildMessage(error);
  try {
    if (interaction.deferred || interaction.replied) {
      await interaction.editReply({ content, embeds: [], components: [] });
    } else {
      await interaction.reply({ content, flags: MessageFlags.Ephemeral });
    }
  } catch {
    // Interaction expirée ou déjà traitée
  }
}