import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { ChatInputCommandInteraction } from 'discord.js';

// api.get() est mocké au niveau du module plutôt que passé en paramètre : travelMiddleware
// l'importe directement depuis ../../../api/client, donc c'est le point d'interception le plus simple.
const { getMock } = vi.hoisted(() => ({ getMock: vi.fn() }));
vi.mock('../../../api/client', () => ({ api: { get: getMock } }));

import { checkTravelingStatus } from './travelMiddleware';

function interactionDe(userId: string, username: string) {
  return {
    user: { id: userId, username },
    reply: vi.fn(),
  } as unknown as ChatInputCommandInteraction & { reply: ReturnType<typeof vi.fn> };
}

beforeEach(() => {
  getMock.mockReset();
  vi.useRealTimers();
});

describe('Joueur pas en déplacement', () => {
  it("laisse la commande s'exécuter normalement", async () => {
    getMock.mockResolvedValue({ traveling: false });
    const interaction = interactionDe('731093847022501978', 'Mazlai');

    const enVoyage = await checkTravelingStatus(interaction);

    expect(enVoyage).toBe(false);
    expect(interaction.reply).not.toHaveBeenCalled();
  });

  it("interroge l'API avec l'identifiant et le pseudo Discord de l'appelant", async () => {
    getMock.mockResolvedValue({ traveling: false });
    const interaction = interactionDe('731093847022501978', 'Mazlai');

    await checkTravelingStatus(interaction);

    expect(getMock).toHaveBeenCalledWith('/api/travel/status', '731093847022501978', 'Mazlai');
  });
});

describe('Joueur actuellement en voyage', () => {
  it('bloque la commande et rappelle la destination', async () => {
    getMock.mockResolvedValue({
      traveling: true,
      destination_name: 'Riverside',
      destination_emoji: '🏞️',
      arrival_time: Math.floor(Date.now() / 1000) + 3600,
    });
    const interaction = interactionDe('731093847022501978', 'Mazlai');

    const enVoyage = await checkTravelingStatus(interaction);

    expect(enVoyage).toBe(true);
    expect(interaction.reply).toHaveBeenCalledTimes(1);
    expect(interaction.reply.mock.calls[0][0].content).toContain('Riverside');
  });

  // Cas limite métier : arrivée dans moins d'une minute, donc ni heures ni minutes
  // entières à afficher. Le message doit quand même rester lisible ("moins d'une minute")
  // plutôt que d'afficher une chaîne vide.
  it("affiche « moins d'une minute » quand l'arrivée est imminente (0h 0m)", async () => {
    getMock.mockResolvedValue({
      traveling: true,
      destination_name: 'Riverside',
      destination_emoji: '🏞️',
      arrival_time: Math.floor(Date.now() / 1000) + 30,
    });
    const interaction = interactionDe('731093847022501978', 'Mazlai');

    await checkTravelingStatus(interaction);

    expect(interaction.reply.mock.calls[0][0].content).toContain("moins d'une minute");
  });
});
