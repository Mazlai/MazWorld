import { TestBed } from '@angular/core/testing';
import { of, NEVER } from 'rxjs';
import { InventoryComponent } from './inventory.component';
import { InventoryService } from '../../core/services/inventory.service';
import type { InventoryItem } from '../../core/models/inventory.model';

function badgeDeCollection(overrides: Partial<InventoryItem> & { item_id: string }): InventoryItem {
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

function backgroundDeCollection(overrides: Partial<InventoryItem> & { item_id: string }): InventoryItem {
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

function monterInventaire() {
  const serviceMock = {
    getInventory: vi.fn().mockReturnValue(NEVER),
    equipBackground: vi.fn().mockReturnValue(of({ success: true, message: 'OK' })),
    equipBadge: vi.fn().mockReturnValue(of({ success: true, message: 'OK' })),
    unequipBadge: vi.fn().mockReturnValue(of({ success: true, message: 'OK' })),
  };
  TestBed.configureTestingModule({
    imports: [InventoryComponent],
    providers: [{ provide: InventoryService, useValue: serviceMock }],
  });
  const fixture = TestBed.createComponent(InventoryComponent);
  fixture.detectChanges();
  return { component: fixture.componentInstance, serviceMock };
}

afterEach(() => TestBed.resetTestingModule());

describe('Équiper un badge dans un slot déjà occupé (éviction)', () => {
  it('équipe le nouveau badge et évince l\'ancien du même slot', () => {
    const { component } = monterInventaire();
    const badgeA = badgeDeCollection({ item_id: 'badge_a', equipped: true, slot: 2 });
    const badgeB = badgeDeCollection({ item_id: 'badge_b', equipped: false, slot: null });
    component.items.set([badgeA, badgeB]);
    component.equippedBadges.set({ 2: 'badge_a' });

    component.equipBadge(badgeB, 2);

    const items = component.items();
    expect(items.find(i => i.item_id === 'badge_a')?.equipped).toBe(false);
    expect(items.find(i => i.item_id === 'badge_a')?.slot).toBeNull();
    expect(items.find(i => i.item_id === 'badge_b')?.equipped).toBe(true);
    expect(items.find(i => i.item_id === 'badge_b')?.slot).toBe(2);
  });

  it('met à jour la table des slots équipés avec le nouvel identifiant', () => {
    const { component } = monterInventaire();
    component.items.set([badgeDeCollection({ item_id: 'badge_a', equipped: true, slot: 1 }), badgeDeCollection({ item_id: 'badge_b' })]);
    component.equippedBadges.set({ 1: 'badge_a' });

    component.equipBadge(component.items()[1], 1);

    expect(component.equippedBadges()[1]).toBe('badge_b');
  });

  it('ne touche pas aux badges équipés dans les autres slots', () => {
    const { component } = monterInventaire();
    const badgeB = badgeDeCollection({ item_id: 'badge_b', equipped: true, slot: 3 });
    component.items.set([badgeDeCollection({ item_id: 'badge_a', equipped: true, slot: 0 }), badgeB, badgeDeCollection({ item_id: 'badge_c' })]);
    component.equippedBadges.set({ 0: 'badge_a', 3: 'badge_b' });

    component.equipBadge(component.items()[2], 0);

    const badgeBApres = component.items().find(i => i.item_id === 'badge_b');
    expect(badgeBApres?.equipped).toBe(true);
    expect(badgeBApres?.slot).toBe(3);
  });
});

describe('Retirer un badge d\'un slot', () => {
  it('libère la clé du slot dans la table des équipés, sans toucher aux autres slots', () => {
    const { component } = monterInventaire();
    component.equippedBadges.set({ 2: 'badge_a', 4: 'badge_b' });
    component.items.set([badgeDeCollection({ item_id: 'badge_a', equipped: true, slot: 2 })]);

    component.unequipBadge(2);

    expect(component.equippedBadges()[2]).toBeUndefined();
    expect(component.equippedBadges()[4]).toBe('badge_b');
  });

  it('remet le badge à equipped=false et slot=null dans la liste des items', () => {
    const { component } = monterInventaire();
    component.items.set([badgeDeCollection({ item_id: 'badge_a', equipped: true, slot: 2 })]);
    component.equippedBadges.set({ 2: 'badge_a' });

    component.unequipBadge(2);

    const badge = component.items().find(i => i.item_id === 'badge_a');
    expect(badge?.equipped).toBe(false);
    expect(badge?.slot).toBeNull();
  });
});

describe('Équiper un background — garde contre les appels inutiles', () => {
  it('n\'appelle pas l\'API si le background cliqué est déjà celui équipé', () => {
    const { component, serviceMock } = monterInventaire();
    const bleuDejaEquipe = backgroundDeCollection({ item_id: 'bg_blue', equipped: true });
    component.items.set([bleuDejaEquipe]);

    component.equipBg(bleuDejaEquipe);

    expect(serviceMock.equipBackground).not.toHaveBeenCalled();
  });

  it('appelle l\'API et met à jour le background équipé quand il change réellement', () => {
    const { component, serviceMock } = monterInventaire();
    const violetNonEquipe = backgroundDeCollection({ item_id: 'bg_purple', equipped: false });
    component.items.set([violetNonEquipe]);

    component.equipBg(violetNonEquipe);

    expect(serviceMock.equipBackground).toHaveBeenCalledWith('bg_purple');
    expect(component.equippedBackground()).toBe('bg_purple');
  });
});

it('getBadgeInSlot() retrouve le badge occupant un slot donné, ou undefined si le slot est vide', () => {
  const { component } = monterInventaire();
  component.items.set([badgeDeCollection({ item_id: 'badge_star', equipped: true, slot: 3 })]);
  component.equippedBadges.set({ 3: 'badge_star' });

  expect(component.getBadgeInSlot(3)?.item_id).toBe('badge_star');
  expect(component.getBadgeInSlot(0)).toBeUndefined();
});

it('backgrounds() et badges() séparent correctement les deux types d\'items de la collection', () => {
  const { component } = monterInventaire();
  component.items.set([
    backgroundDeCollection({ item_id: 'bg1' }),
    badgeDeCollection({ item_id: 'b1' }),
    badgeDeCollection({ item_id: 'b2' }),
  ]);

  expect(component.backgrounds()).toHaveLength(1);
  expect(component.badges()).toHaveLength(2);
});
