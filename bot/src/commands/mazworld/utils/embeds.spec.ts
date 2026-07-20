import { describe, it, expect } from 'vitest';
import {
  buildTravelInProgressEmbed,
  buildMapEmbed,
  buildTravelConfirmEmbed,
  buildCityinfoEmbed,
  buildDailyAlreadyClaimedEmbed,
  buildCoinflipResultEmbed,
  buildShopItemConfirmEmbed,
  buildShopPurchaseResultEmbed,
  buildInventoryEmbed,
  buildSlotMenuEmbed,
} from './embeds';
import type { MapRoute, MapResponse, ShopItem, ProfileData } from '../data';

const AVATAR = 'https://cdn.discordapp.com/avatars/1/1.png';

function route(overrides: Partial<MapRoute> = {}): MapRoute {
  return {
    city_to: 'riverside',
    destination_name: 'Riverside',
    destination_emoji: '🏞️',
    cost: 100,
    duration: 600,
    visited: false,
    effective_cost: 100,
    ...overrides,
  };
}

describe('embeds', () => {
  describe('buildTravelInProgressEmbed', () => {
    it('computes remaining hours and minutes from arrival_time', () => {
      const now = Math.floor(Date.now() / 1000);
      const status = {
        traveling: true as const,
        destination_emoji: '🏞️',
        destination_name: 'Riverside',
        arrival_time: now + 3600 + 15 * 60,
      };

      const embed = buildTravelInProgressEmbed(status as any, AVATAR);

      expect(embed.data.fields?.[0].value).toContain('1h 15m');
    });
  });

  describe('buildMapEmbed', () => {
    it('marks already-visited routes as free and unvisited ones with their cost', () => {
      const data: MapResponse = {
        current_city: { city_id: 'a', name: 'Alpha', description: '...', emoji: '🏙️', theme: 'Village' },
        coins: 500,
        routes: [route({ visited: true, destination_name: 'Free City' }), route({ visited: false, destination_name: 'Paid City', effective_cost: 250 })],
      };

      const embed = buildMapEmbed(data, AVATAR);
      const destinationsField = embed.data.fields?.find(f => f.name.includes('Destinations'));

      expect(destinationsField?.value).toContain('Free City');
      expect(destinationsField?.value).toContain('✅ Gratuit');
      expect(destinationsField?.value).toContain('Paid City');
      expect(destinationsField?.value).toContain('250€');
    });

    it('falls back to an explicit message when no route is available', () => {
      const data: MapResponse = {
        current_city: { city_id: 'a', name: 'Alpha', description: '...', emoji: '🏙️', theme: 'Village' },
        coins: 0,
        routes: [],
      };

      const embed = buildMapEmbed(data, AVATAR);
      const destinationsField = embed.data.fields?.find(f => f.name.includes('Destinations'));

      expect(destinationsField?.value).toBe('Aucune route disponible depuis cette ville.');
    });
  });

  describe('buildTravelConfirmEmbed', () => {
    it('shows the route as free when already visited', () => {
      const embed = buildTravelConfirmEmbed(route({ visited: true }));

      expect(embed.data.fields?.[0].value).toContain('Gratuit');
      expect(embed.data.color).toBe(0x00ff00);
    });

    it('shows the effective cost when not yet visited', () => {
      const embed = buildTravelConfirmEmbed(route({ visited: false, effective_cost: 150 }));

      expect(embed.data.fields?.[0].value).toBe('150€');
      expect(embed.data.color).toBe(0x5865f2);
    });
  });

  describe('buildCityinfoEmbed', () => {
    const baseData: MapResponse = {
      current_city: { city_id: 'a', name: 'Alpha', description: '...', emoji: '🏙️', theme: 'Forêt' },
      coins: 0,
      routes: [],
      jobs: [],
    };

    it('uses the theme color mapping when the theme is known', () => {
      const embed = buildCityinfoEmbed(baseData, AVATAR);

      expect(embed.data.color).toBe(0x4caf50);
    });

    it('falls back to the default color for an unmapped theme', () => {
      const embed = buildCityinfoEmbed({ ...baseData, current_city: { ...baseData.current_city, theme: 'Inconnu' } }, AVATAR);

      expect(embed.data.color).toBe(0x5865f2);
    });

    it('shows a fallback message when no job is available', () => {
      const embed = buildCityinfoEmbed(baseData, AVATAR);
      const jobsField = embed.data.fields?.find(f => f.name.includes('Métiers'));

      expect(jobsField?.value).toBe('Aucun métier disponible dans cette ville.');
    });

    it('does not add a destinations field when there is no route', () => {
      const embed = buildCityinfoEmbed(baseData, AVATAR);

      expect(embed.data.fields?.some(f => f.name.includes('Destinations'))).toBe(false);
    });
  });

  describe('buildDailyAlreadyClaimedEmbed', () => {
    it('adds the next-claim field only when next_daily is provided', () => {
      const withNext = buildDailyAlreadyClaimedEmbed({ success: false, message: 'déjà réclamé', next_daily: 12345 }, AVATAR);
      const withoutNext = buildDailyAlreadyClaimedEmbed({ success: false, message: 'déjà réclamé' }, AVATAR);

      expect(withNext.data.fields?.length).toBe(1);
      expect(withoutNext.data.fields ?? []).toHaveLength(0);
    });
  });

  describe('buildCoinflipResultEmbed', () => {
    it('renders a victory embed with the pile result', () => {
      const embed = buildCoinflipResultEmbed({ success: true, won: true, result: 'pile', amount: 100, coins: 600, message: 'Bravo' }, AVATAR);

      expect(embed.data.title).toBe('🎉 VICTOIRE !');
      expect(embed.data.color).toBe(0x00ff00);
      expect(embed.data.fields?.[0].value).toContain('PILE');
      expect(embed.data.fields?.[1].value).toBe('+100€');
    });

    it('renders a defeat embed with the face result', () => {
      const embed = buildCoinflipResultEmbed({ success: true, won: false, result: 'face', amount: 50, coins: 450, message: 'Perdu' }, AVATAR);

      expect(embed.data.title).toBe('💔 DÉFAITE');
      expect(embed.data.color).toBe(0xff0000);
      expect(embed.data.fields?.[0].value).toContain('FACE');
      expect(embed.data.fields?.[1].value).toBe('-50€');
    });
  });

  describe('buildShopItemConfirmEmbed', () => {
    const item = (overrides: Partial<ShopItem> = {}): ShopItem => ({
      item_id: 'bg_blue', item_type: 'background', name: 'Blue', price: 200, owned: false, equipped: false, ...overrides,
    });

    it('shows "already owned" regardless of balance', () => {
      const embed = buildShopItemConfirmEmbed(item({ owned: true }), 0);

      expect(embed.data.fields?.[2].value).toBe('✅ Déjà possédé');
      expect(embed.data.color).toBe(0xffaa00);
    });

    it('shows purchasable when balance covers the price', () => {
      const embed = buildShopItemConfirmEmbed(item({ price: 100 }), 150);

      expect(embed.data.fields?.[2].value).toBe('✅ Vous pouvez acheter');
      expect(embed.data.color).toBe(0x00ff00);
    });

    it('shows insufficient funds when balance is below the price', () => {
      const embed = buildShopItemConfirmEmbed(item({ price: 100 }), 50);

      expect(embed.data.fields?.[2].value).toBe('❌ Pas assez d\'argent');
      expect(embed.data.color).toBe(0xff0000);
    });
  });

  describe('buildShopPurchaseResultEmbed', () => {
    it('adds the new balance field only on success', () => {
      const success = buildShopPurchaseResultEmbed({ success: true, message: 'ok', new_balance: 300 });
      const failure = buildShopPurchaseResultEmbed({ success: false, message: 'insuffisant' });

      expect(success.data.title).toBe('✅ Achat réussi !');
      expect(success.data.fields?.[0].value).toBe('300€');
      expect(failure.data.title).toBe('❌ Achat échoué');
      expect(failure.data.fields ?? []).toHaveLength(0);
    });
  });

  describe('buildInventoryEmbed', () => {
    const profile: ProfileData = {
      user_id: '1', username: 'Maz', coins: 1000, equipped_background: 'bg_missing', equipped_badges: ['badge_1', '', '', '', '', ''],
    };
    const items: ShopItem[] = [
      { item_id: 'badge_1', item_type: 'badge', name: 'Founder', emoji: '👑', price: 500, owned: true, equipped: true },
    ];

    it('falls back to "Défaut" when the equipped background is not found in allItems', () => {
      const embed = buildInventoryEmbed(profile, [], [], items, 'Maz', AVATAR);
      const bgField = embed.data.fields?.find(f => f.name.includes('actuel'));

      expect(bgField?.value).toBe('⬜ Défaut');
    });

    it('renders known badge slots with their name and empty slots as "Vide"', () => {
      const embed = buildInventoryEmbed(profile, [], [], items, 'Maz', AVATAR);
      const badgesField = embed.data.fields?.find(f => f.name.includes('Badges équipés'));

      expect(badgesField?.value).toContain('👑 Founder');
      expect(badgesField?.value).toContain('⚫ Vide');
    });

    it('falls back to "Inconnu" for a badge id not present in allItems', () => {
      const orphanProfile: ProfileData = { ...profile, equipped_badges: ['badge_ghost', '', '', '', '', ''] };
      const embed = buildInventoryEmbed(orphanProfile, [], [], items, 'Maz', AVATAR);
      const badgesField = embed.data.fields?.find(f => f.name.includes('Badges équipés'));

      expect(badgesField?.value).toContain('❓ Inconnu');
    });
  });

  describe('buildSlotMenuEmbed', () => {
    it('uses the shop item name when found', () => {
      const embed = buildSlotMenuEmbed({ item_id: 'badge_1', item_type: 'badge', name: 'Founder', emoji: '👑', price: 0, owned: true, equipped: false }, 'badge_1');

      expect(embed.data.title).toContain('Founder');
    });

    it('falls back to the raw badge id when the shop item is not found', () => {
      const embed = buildSlotMenuEmbed(undefined, 'badge_ghost');

      expect(embed.data.title).toContain('badge_ghost');
    });
  });
});
