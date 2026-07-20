import { describe, it, expect } from 'vitest';
import {
  buildMapButtons,
  buildPurchaseConfirmRow,
  buildInventoryButtons,
  buildBackgroundSelectMenu,
  buildSlotSelectMenu,
  buildUnequipSelectMenu,
} from './components';
import type { MapRoute, ShopItem } from '../data';

function route(overrides: Partial<MapRoute> = {}): MapRoute {
  return {
    city_to: 'riverside', destination_name: 'Riverside', destination_emoji: '🏞️',
    cost: 100, duration: 600, visited: false, effective_cost: 100, ...overrides,
  };
}

function item(overrides: Partial<ShopItem> = {}): ShopItem {
  return { item_id: 'bg_blue', item_type: 'background', name: 'Blue', price: 100, owned: false, equipped: false, ...overrides };
}

describe('components', () => {
  describe('buildMapButtons', () => {
    it('returns no row when there is no route', () => {
      expect(buildMapButtons([])).toHaveLength(0);
    });

    it('caps buttons to the first 5 routes', () => {
      const routes = Array.from({ length: 8 }, (_, i) => route({ city_to: `city-${i}`, destination_name: `City ${i}` }));

      const [row] = buildMapButtons(routes);

      expect(row.toJSON().components).toHaveLength(5);
    });
  });

  describe('buildPurchaseConfirmRow', () => {
    it('disables the purchase button when the item is already owned', () => {
      const [buyButton] = buildPurchaseConfirmRow(true, true).toJSON().components as any[];

      expect(buyButton.disabled).toBe(true);
    });

    it('disables the purchase button when the balance is insufficient', () => {
      const [buyButton] = buildPurchaseConfirmRow(false, false).toJSON().components as any[];

      expect(buyButton.disabled).toBe(true);
    });

    it('enables the purchase button when affordable and not owned', () => {
      const [buyButton] = buildPurchaseConfirmRow(false, true).toJSON().components as any[];

      expect(buyButton.disabled).toBe(false);
    });
  });

  describe('buildInventoryButtons', () => {
    it('shows only the background action when only backgrounds are owned', () => {
      const rows = buildInventoryButtons(true, false);

      expect(rows).toHaveLength(1);
      expect((rows[0].toJSON().components[0] as any).custom_id).toBe('equip_background');
    });

    it('shows badge actions (equip + unequip) when only badges are owned', () => {
      const rows = buildInventoryButtons(false, true);
      const ids = (rows[0].toJSON().components as any[]).map(c => c.custom_id);

      expect(ids).toEqual(['equip_badge', 'unequip_badge']);
    });

    it('falls back to a disabled shop link when the inventory is empty', () => {
      const rows = buildInventoryButtons(false, false);
      const button = rows[0].toJSON().components[0] as any;

      expect(button.custom_id).toBe('goto_shop');
      expect(button.disabled).toBe(true);
    });
  });

  describe('buildBackgroundSelectMenu', () => {
    it('marks the currently equipped background in its label and description', () => {
      const backgrounds = [item({ item_id: 'bg_blue', name: 'Blue' }), item({ item_id: 'bg_red', name: 'Red' })];

      const menu = buildBackgroundSelectMenu(backgrounds, 'bg_blue').toJSON().components[0] as any;
      const [blue, red] = menu.options;

      expect(blue.label).toBe('Blue (équipé)');
      expect(blue.description).toBe('✅ Actuellement équipé');
      expect(red.label).toBe('Red');
    });
  });

  describe('buildSlotSelectMenu', () => {
    it('shows a slot as empty when no badge occupies it', () => {
      const menu = buildSlotSelectMenu('badge_new', [], []).toJSON().components[0] as any;

      expect(menu.options[0].description).toBe('Vide');
      expect(menu.options[0].emoji.name).toBe('⚫');
    });

    it('shows the occupying badge name when a slot is already used', () => {
      const badge = item({ item_id: 'badge_founder', item_type: 'badge', name: 'Founder', emoji: '👑' });

      const menu = buildSlotSelectMenu('badge_new', [badge], ['badge_founder']).toJSON().components[0] as any;

      expect(menu.options[0].description).toContain('Founder');
      expect(menu.options[0].description).toContain('sera remplacé');
    });

    it('always exposes exactly 6 slots', () => {
      const menu = buildSlotSelectMenu('badge_new', [], []).toJSON().components[0] as any;

      expect(menu.options).toHaveLength(6);
    });
  });

  describe('buildUnequipSelectMenu', () => {
    it('only lists slots that are actually occupied', () => {
      const badge = item({ item_id: 'badge_founder', item_type: 'badge', name: 'Founder' });

      const menu = buildUnequipSelectMenu(['badge_founder', '', '', '', '', ''], [badge]).toJSON().components[0] as any;

      expect(menu.options).toHaveLength(1);
      expect(menu.options[0].label).toContain('Founder');
    });

    it('produces no options when nothing is equipped', () => {
      const menu = buildUnequipSelectMenu(['', '', '', '', '', ''], []).toJSON().components[0] as any;

      expect(menu.options ?? []).toHaveLength(0);
    });
  });
});
