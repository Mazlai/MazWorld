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

function routeVers(destination: string, overrides: Partial<MapRoute> = {}): MapRoute {
  return {
    city_to: destination.toLowerCase(), destination_name: destination, destination_emoji: '🏞️',
    cost: 100, duration: 600, visited: false, effective_cost: 100, ...overrides,
  };
}

describe('Sélection des boutons de trajet', () => {
  it("ne construit aucune ligne de boutons s'il n'y a aucune route", () => {
    expect(buildMapButtons([])).toHaveLength(0);
  });

  // Discord limite une ActionRow à 5 composants : au-delà, les routes supplémentaires
  // restent visibles dans le texte de l'embed (cf. embeds.spec.ts) mais perdent leur bouton.
  it('affiche un bouton par route tant qu\'on reste à 5 ou moins', () => {
    const cinqRoutes = Array.from({ length: 5 }, (_, i) => routeVers(`Ville ${i}`, { city_to: `ville-${i}` }));

    const [ligne] = buildMapButtons(cinqRoutes);

    expect(ligne.toJSON().components).toHaveLength(5);
  });

  it('tronque à 5 boutons dès la 6e route, sans erreur', () => {
    const huitRoutes = Array.from({ length: 8 }, (_, i) => routeVers(`Ville ${i}`, { city_to: `ville-${i}` }));

    const [ligne] = buildMapButtons(huitRoutes);

    expect(ligne.toJSON().components).toHaveLength(5);
  });
});

describe('Confirmation d\'achat — cas bloquants combinés', () => {
  it('désactive le bouton si l\'item est déjà possédé', () => {
    const [boutonAcheter] = buildPurchaseConfirmRow(true, true).toJSON().components as any[];

    expect(boutonAcheter.disabled).toBe(true);
  });

  it('désactive le bouton si le solde est insuffisant', () => {
    const [boutonAcheter] = buildPurchaseConfirmRow(false, false).toJSON().components as any[];

    expect(boutonAcheter.disabled).toBe(true);
  });

  // Cas réel fréquent : un joueur fauché qui recroise un item déjà possédé (les deux
  // conditions bloquantes sont vraies en même temps) — le bouton doit rester désactivé.
  it('reste désactivé quand l\'item est possédé ET le solde insuffisant à la fois', () => {
    const [boutonAcheter] = buildPurchaseConfirmRow(true, false).toJSON().components as any[];

    expect(boutonAcheter.disabled).toBe(true);
  });

  it('active le bouton uniquement si le joueur peut réellement acheter', () => {
    const [boutonAcheter] = buildPurchaseConfirmRow(false, true).toJSON().components as any[];

    expect(boutonAcheter.disabled).toBe(false);
  });
});

describe('Actions disponibles depuis l\'inventaire', () => {
  it("ne propose que l'action background si le joueur ne possède que des backgrounds", () => {
    const lignes = buildInventoryButtons(true, false);

    expect(lignes).toHaveLength(1);
    expect((lignes[0].toJSON().components[0] as any).custom_id).toBe('equip_background');
  });

  it('propose équiper + retirer quand le joueur ne possède que des badges', () => {
    const idsBoutons = (buildInventoryButtons(false, true)[0].toJSON().components as any[]).map(c => c.custom_id);

    expect(idsBoutons).toEqual(['equip_badge', 'unequip_badge']);
  });

  // Cas le plus courant en pratique une fois le joueur un peu avancé : il possède
  // à la fois des backgrounds et des badges, les deux lignes doivent coexister.
  it('affiche les deux lignes (background et badges) quand le joueur possède les deux', () => {
    const lignes = buildInventoryButtons(true, true);

    expect(lignes).toHaveLength(2);
    const tousLesIds = lignes.flatMap(l => (l.toJSON().components as any[]).map(c => c.custom_id));
    expect(tousLesIds).toEqual(['equip_background', 'equip_badge', 'unequip_badge']);
  });

  it('renvoie vers la boutique (bouton désactivé) quand l\'inventaire est vide', () => {
    const bouton = buildInventoryButtons(false, false)[0].toJSON().components[0] as any;

    expect(bouton.custom_id).toBe('goto_shop');
    expect(bouton.disabled).toBe(true);
  });
});

it('marque le background actuellement équipé dans son libellé et sa description', () => {
  const backgrounds: ShopItem[] = [
    { item_id: 'bg_ocean', item_type: 'background', name: 'Ocean', price: 100, owned: true, equipped: true },
    { item_id: 'bg_lava', item_type: 'background', name: 'Lava', price: 100, owned: true, equipped: false },
  ];

  const menu = buildBackgroundSelectMenu(backgrounds, 'bg_ocean').toJSON().components[0] as any;
  const [ocean, lava] = menu.options;

  expect(ocean.label).toBe('Ocean (équipé)');
  expect(ocean.description).toBe('✅ Actuellement équipé');
  expect(lava.label).toBe('Lava');
});

describe('Choix du slot pour équiper un badge (6 emplacements)', () => {
  it('affiche "Vide" pour un slot que personne n\'occupe', () => {
    const menu = buildSlotSelectMenu('badge_nouveau', [], []).toJSON().components[0] as any;

    expect(menu.options[0].description).toBe('Vide');
    expect(menu.options[0].emoji.name).toBe('⚫');
  });

  it("prévient qu'équiper ce badge remplacera celui déjà présent dans le slot", () => {
    const founder: ShopItem = { item_id: 'badge_founder', item_type: 'badge', name: 'Founder', emoji: '👑', price: 0, owned: true, equipped: true };

    const menu = buildSlotSelectMenu('badge_nouveau', [founder], ['badge_founder']).toJSON().components[0] as any;

    expect(menu.options[0].description).toContain('Founder');
    expect(menu.options[0].description).toContain('sera remplacé');
  });

  // Joueur en fin de progression avec sa collection complète équipée : les 6 slots
  // doivent tous rester proposés (avec leur contenu respectif), aucun ne disparaît.
  it('propose toujours les 6 slots même quand ils sont tous déjà occupés', () => {
    const sixBadges: ShopItem[] = Array.from({ length: 6 }, (_, i) => ({
      item_id: `badge_${i}`, item_type: 'badge', name: `Badge ${i}`, price: 0, owned: true, equipped: true,
    }));
    const sixSlotsRemplis = sixBadges.map(b => b.item_id);

    const menu = buildSlotSelectMenu('badge_nouveau', sixBadges, sixSlotsRemplis).toJSON().components[0] as any;

    expect(menu.options).toHaveLength(6);
    expect(menu.options.every((o: any) => o.description.includes('sera remplacé'))).toBe(true);
  });
});

describe('Retrait d\'un badge équipé', () => {
  it('ne liste que les slots réellement occupés', () => {
    const founder: ShopItem = { item_id: 'badge_founder', item_type: 'badge', name: 'Founder', price: 0, owned: true, equipped: true };

    const menu = buildUnequipSelectMenu(['badge_founder', '', '', '', '', ''], [founder]).toJSON().components[0] as any;

    expect(menu.options).toHaveLength(1);
    expect(menu.options[0].label).toContain('Founder');
  });

  it('gère un mélange de slots occupés et vides dispersés (pas seulement en début de liste)', () => {
    const founder: ShopItem = { item_id: 'badge_founder', item_type: 'badge', name: 'Founder', price: 0, owned: true, equipped: true };
    const star: ShopItem = { item_id: 'badge_star', item_type: 'badge', name: 'Star', price: 0, owned: true, equipped: true };

    const menu = buildUnequipSelectMenu(['', 'badge_founder', '', '', 'badge_star', ''], [founder, star]).toJSON().components[0] as any;

    expect(menu.options).toHaveLength(2);
    expect(menu.options.map((o: any) => o.label)).toEqual(
      expect.arrayContaining([expect.stringContaining('Founder'), expect.stringContaining('Star')]),
    );
  });

  it("ne propose aucune option si le joueur n'a rien équipé", () => {
    const menu = buildUnequipSelectMenu(['', '', '', '', '', ''], []).toJSON().components[0] as any;

    expect(menu.options ?? []).toHaveLength(0);
  });
});
