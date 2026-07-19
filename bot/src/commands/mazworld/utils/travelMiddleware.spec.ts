import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { ChatInputCommandInteraction } from 'discord.js';

const { getMock } = vi.hoisted(() => ({ getMock: vi.fn() }));
vi.mock('../../../api/client', () => ({ api: { get: getMock } }));

import { checkTravelingStatus } from './travelMiddleware';

function fakeInteraction() {
  return {
    user: { id: 'user-1', username: 'Maz' },
    reply: vi.fn(),
  } as unknown as ChatInputCommandInteraction & { reply: ReturnType<typeof vi.fn> };
}

describe('checkTravelingStatus', () => {
  beforeEach(() => {
    getMock.mockReset();
    vi.useRealTimers();
  });

  it('returns false and does not reply when the user is not traveling', async () => {
    getMock.mockResolvedValue({ traveling: false });
    const interaction = fakeInteraction();

    const result = await checkTravelingStatus(interaction);

    expect(result).toBe(false);
    expect(interaction.reply).not.toHaveBeenCalled();
  });

  it('calls the API with the interacting user id and username', async () => {
    getMock.mockResolvedValue({ traveling: false });
    const interaction = fakeInteraction();

    await checkTravelingStatus(interaction);

    expect(getMock).toHaveBeenCalledWith('/api/travel/status', 'user-1', 'Maz');
  });

  it('returns true and replies with the destination when the user is traveling', async () => {
    getMock.mockResolvedValue({
      traveling: true,
      destination_name: 'Riverside',
      destination_emoji: '🏞️',
      arrival_time: Math.floor(Date.now() / 1000) + 3600,
    });
    const interaction = fakeInteraction();

    const result = await checkTravelingStatus(interaction);

    expect(result).toBe(true);
    expect(interaction.reply).toHaveBeenCalledTimes(1);
    const replyArg = interaction.reply.mock.calls[0][0];
    expect(replyArg.content).toContain('Riverside');
  });
});
