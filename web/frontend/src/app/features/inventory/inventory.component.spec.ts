import { TestBed } from '@angular/core/testing';
import { of, NEVER } from 'rxjs';
import { InventoryComponent } from './inventory.component';
import { InventoryService } from '../../core/services/inventory.service';
import type { InventoryItem } from '../../core/models/inventory.model';

function makeBadge(overrides: Partial<InventoryItem> & { item_id: string }): InventoryItem {
  return {
    item_type: 'badge',
    name: overrides.item_id,
    description: null,
    emoji: null,
    equipped: false,
    slot: null,
    purchased_at: '2024-01-01T00:00:00Z',
    ...overrides,
  };
}

function makeBg(overrides: Partial<InventoryItem> & { item_id: string }): InventoryItem {
  return {
    item_type: 'background',
    name: overrides.item_id,
    description: null,
    emoji: null,
    equipped: false,
    slot: null,
    purchased_at: '2024-01-01T00:00:00Z',
    ...overrides,
  };
}

function setup() {
  const mockService = {
    getInventory: vi.fn().mockReturnValue(NEVER),
    equipBackground: vi.fn().mockReturnValue(of({ success: true, message: 'OK' })),
    equipBadge: vi.fn().mockReturnValue(of({ success: true, message: 'OK' })),
    unequipBadge: vi.fn().mockReturnValue(of({ success: true, message: 'OK' })),
  };
  TestBed.configureTestingModule({
    imports: [InventoryComponent],
    providers: [{ provide: InventoryService, useValue: mockService }],
  });
  const fixture = TestBed.createComponent(InventoryComponent);
  fixture.detectChanges();
  return { component: fixture.componentInstance, mockService };
}

describe('InventoryComponent', () => {
  afterEach(() => TestBed.resetTestingModule());

  // ===== equipBadge() — éviction de slot =====

  describe('equipBadge()', () => {
    it('équipe le badge dans le slot et évince l\'ancien badge', () => {
      const { component } = setup();
      const badgeA = makeBadge({ item_id: 'badge_a', equipped: true, slot: 2 });
      const badgeB = makeBadge({ item_id: 'badge_b', equipped: false, slot: null });
      component.items.set([badgeA, badgeB]);
      component.equippedBadges.set({ 2: 'badge_a' });

      component.equipBadge(badgeB, 2);

      const items = component.items();
      expect(items.find(i => i.item_id === 'badge_a')?.equipped).toBe(false);
      expect(items.find(i => i.item_id === 'badge_a')?.slot).toBeNull();
      expect(items.find(i => i.item_id === 'badge_b')?.equipped).toBe(true);
      expect(items.find(i => i.item_id === 'badge_b')?.slot).toBe(2);
    });

    it('met à jour equippedBadges avec le nouvel ID dans le slot', () => {
      const { component } = setup();
      const badgeA = makeBadge({ item_id: 'badge_a', equipped: true, slot: 1 });
      const badgeB = makeBadge({ item_id: 'badge_b' });
      component.items.set([badgeA, badgeB]);
      component.equippedBadges.set({ 1: 'badge_a' });

      component.equipBadge(badgeB, 1);

      expect(component.equippedBadges()[1]).toBe('badge_b');
    });

    it('n\'affecte pas les badges des autres slots', () => {
      const { component } = setup();
      const badgeA = makeBadge({ item_id: 'badge_a', equipped: true, slot: 0 });
      const badgeB = makeBadge({ item_id: 'badge_b', equipped: true, slot: 3 });
      const badgeC = makeBadge({ item_id: 'badge_c' });
      component.items.set([badgeA, badgeB, badgeC]);
      component.equippedBadges.set({ 0: 'badge_a', 3: 'badge_b' });

      component.equipBadge(badgeC, 0);

      const items = component.items();
      expect(items.find(i => i.item_id === 'badge_b')?.equipped).toBe(true);
      expect(items.find(i => i.item_id === 'badge_b')?.slot).toBe(3);
    });
  });

  // ===== unequipBadge() — suppression de clé =====

  describe('unequipBadge()', () => {
    it('supprime la clé du slot dans equippedBadges', () => {
      const { component } = setup();
      component.equippedBadges.set({ 2: 'badge_a', 4: 'badge_b' });
      component.items.set([makeBadge({ item_id: 'badge_a', equipped: true, slot: 2 })]);

      component.unequipBadge(2);

      expect(component.equippedBadges()[2]).toBeUndefined();
      expect(component.equippedBadges()[4]).toBe('badge_b');
    });

    it('passe le badge déséquipé à equipped=false et slot=null', () => {
      const { component } = setup();
      component.items.set([makeBadge({ item_id: 'badge_a', equipped: true, slot: 2 })]);
      component.equippedBadges.set({ 2: 'badge_a' });

      component.unequipBadge(2);

      const badge = component.items().find(i => i.item_id === 'badge_a');
      expect(badge?.equipped).toBe(false);
      expect(badge?.slot).toBeNull();
    });
  });

  // ===== equipBg() — garde no-op =====

  describe('equipBg()', () => {
    it('ne fait pas d\'appel service si le background est déjà équipé', () => {
      const { component, mockService } = setup();
      const bg = makeBg({ item_id: 'bg_blue', equipped: true });
      component.items.set([bg]);

      component.equipBg(bg);

      expect(mockService.equipBackground).not.toHaveBeenCalled();
    });

    it('appelle le service et met à jour equippedBackground si non équipé', () => {
      const { component, mockService } = setup();
      const bg = makeBg({ item_id: 'bg_purple', equipped: false });
      component.items.set([bg]);

      component.equipBg(bg);

      expect(mockService.equipBackground).toHaveBeenCalledWith('bg_purple');
      expect(component.equippedBackground()).toBe('bg_purple');
    });
  });

  // ===== getBadgeInSlot() =====

  describe('getBadgeInSlot()', () => {
    it('retourne le badge correspondant au slot', () => {
      const { component } = setup();
      const badge = makeBadge({ item_id: 'badge_star', equipped: true, slot: 3 });
      component.items.set([badge]);
      component.equippedBadges.set({ 3: 'badge_star' });

      expect(component.getBadgeInSlot(3)?.item_id).toBe('badge_star');
    });

    it('retourne undefined si le slot est vide', () => {
      const { component } = setup();
      component.items.set([]);
      component.equippedBadges.set({});

      expect(component.getBadgeInSlot(0)).toBeUndefined();
    });
  });

  // ===== Computed backgrounds/badges =====

  describe('backgrounds() et badges()', () => {
    it('filtre correctement les backgrounds et badges', () => {
      const { component } = setup();
      component.items.set([
        makeBg({ item_id: 'bg1' }),
        makeBadge({ item_id: 'b1' }),
        makeBadge({ item_id: 'b2' }),
      ]);
      expect(component.backgrounds()).toHaveLength(1);
      expect(component.badges()).toHaveLength(2);
    });
  });
});