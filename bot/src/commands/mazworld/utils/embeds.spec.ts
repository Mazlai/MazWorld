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

// Ces fonctions ne font que construire un EmbedBuilder à partir de données déjà
// résolues côté API — pas d'appel réseau ni de dépendance Discord live.
const AVATAR_MAZLAI = 'https://cdn.discordapp.com/avatars/731093847022501978/hash.png';

function routeVers(destination: string, overrides: Partial<MapRoute> = {}): MapRoute {
  return {
    city_to: destination.toLowerCase(),
    destination_name: destination,
    destination_emoji: '🏞️',
    cost: 100,
    duration: 600,
    visited: false,
    effective_cost: 100,
    ...overrides,
  };
}

it('affiche le compte à rebours en heures/minutes pendant un trajet en cours', () => {
  const now = Math.floor(Date.now() / 1000);
  const enVoyage = {
    traveling: true as const,
    destination_emoji: '🏞️',
    destination_name: 'Riverside',
    arrival_time: now + 3600 + 15 * 60,
  };

  const embed = buildTravelInProgressEmbed(enVoyage as any, AVATAR_MAZLAI);

  expect(embed.data.fields?.[0].value).toContain('1h 15m');
});

describe('Carte du monde — affichage des destinations', () => {
  it('distingue les routes déjà visitées (gratuites) des routes payantes', () => {
    const carte: MapResponse = {
      current_city: { city_id: 'willowbrook', name: 'Willowbrook', description: '...', emoji: '🏙️', theme: 'Village' },
      coins: 500,
      routes: [routeVers('Riverside', { visited: true }), routeVers('Ironpeak', { city_to: 'ironpeak', visited: false, effective_cost: 250 })],
    };

    const destinations = buildMapEmbed(carte, AVATAR_MAZLAI).data.fields?.find(f => f.name.includes('Destinations'))?.value;

    expect(destinations).toContain('Riverside');
    expect(destinations).toContain('✅ Gratuit');
    expect(destinations).toContain('Ironpeak');
    expect(destinations).toContain('250€');
  });

  // Contrairement aux boutons de la carte (limités à 5 par ActionRow, cf. components.ts),
  // la liste textuelle de l'embed n'a aucune limite Discord à respecter : toutes les
  // routes connues doivent apparaître, même celles qui ne sont pas cliquables directement.
  it("n'écrête pas la liste textuelle des destinations, contrairement aux boutons", () => {
    const septRoutes = Array.from({ length: 7 }, (_, i) => routeVers(`Ville ${i}`, { city_to: `ville-${i}` }));
    const carte: MapResponse = {
      current_city: { city_id: 'willowbrook', name: 'Willowbrook', description: '...', emoji: '🏙️', theme: 'Village' },
      coins: 0,
      routes: septRoutes,
    };

    const destinations = buildMapEmbed(carte, AVATAR_MAZLAI).data.fields?.find(f => f.name.includes('Destinations'))?.value;

    expect(destinations?.split('\n')).toHaveLength(7);
  });

  it("prévient qu'aucune route n'est disponible plutôt que d'afficher une liste vide", () => {
    const carteIsolee: MapResponse = {
      current_city: { city_id: 'willowbrook', name: 'Willowbrook', description: '...', emoji: '🏙️', theme: 'Village' },
      coins: 0,
      routes: [],
    };

    expect(buildMapEmbed(carteIsolee, AVATAR_MAZLAI).data.fields?.find(f => f.name.includes('Destinations'))?.value)
      .toBe('Aucune route disponible depuis cette ville.');
  });
});

describe('Confirmation de départ en voyage', () => {
  it('propose le trajet gratuitement pour une ville déjà visitée', () => {
    const embed = buildTravelConfirmEmbed(routeVers('Riverside', { visited: true }));

    expect(embed.data.fields?.[0].value).toContain('Gratuit');
    expect(embed.data.color).toBe(0x00ff00);
  });

  it('affiche le coût réel pour une ville jamais visitée', () => {
    const embed = buildTravelConfirmEmbed(routeVers('Riverside', { visited: false, effective_cost: 150 }));

    expect(embed.data.fields?.[0].value).toBe('150€');
    expect(embed.data.color).toBe(0x5865f2);
  });
});

describe('Fiche d\'information ville', () => {
  const willowbrook: MapResponse = {
    current_city: { city_id: 'willowbrook', name: 'Willowbrook', description: '...', emoji: '🏙️', theme: 'Forêt' },
    coins: 0,
    routes: [],
    jobs: [],
  };

  it('reprend la couleur associée au thème de la ville', () => {
    expect(buildCityinfoEmbed(willowbrook, AVATAR_MAZLAI).data.color).toBe(0x4caf50);
  });

  it('retombe sur la couleur Discord par défaut pour un thème non répertorié', () => {
    const villeThemeInconnu = { ...willowbrook, current_city: { ...willowbrook.current_city, theme: 'Steampunk' } };

    expect(buildCityinfoEmbed(villeThemeInconnu, AVATAR_MAZLAI).data.color).toBe(0x5865f2);
  });

  it("indique qu'aucun métier n'est disponible plutôt que de laisser le champ vide", () => {
    const jobsField = buildCityinfoEmbed(willowbrook, AVATAR_MAZLAI).data.fields?.find(f => f.name.includes('Métiers'));

    expect(jobsField?.value).toBe('Aucun métier disponible dans cette ville.');
  });

  it("liste les 3 tâches de chaque métier proposé par la ville", () => {
    const willowbrookAvecMetier = {
      ...willowbrook,
      jobs: [{ job_id: 1, job_name: 'Boulanger', job_emoji: '🥖', task_1: 'Pétrir', task_2: 'Cuire', task_3: 'Vendre' }],
    };

    const jobsField = buildCityinfoEmbed(willowbrookAvecMetier, AVATAR_MAZLAI).data.fields?.find(f => f.name.includes('Métiers'));

    expect(jobsField?.value).toContain('Pétrir');
    expect(jobsField?.value).toContain('Cuire');
    expect(jobsField?.value).toContain('Vendre');
  });

  it("n'ajoute pas de champ Destinations quand la ville n'a aucune route sortante", () => {
    const champs = buildCityinfoEmbed(willowbrook, AVATAR_MAZLAI).data.fields ?? [];

    expect(champs.some(f => f.name.includes('Destinations'))).toBe(false);
  });
});

it("n'affiche le compte à rebours du prochain /daily que si l'API a fourni next_daily", () => {
  const avecCompteARebours = buildDailyAlreadyClaimedEmbed({ success: false, message: 'déjà réclamé', next_daily: 12345 }, AVATAR_MAZLAI);
  const sansCompteARebours = buildDailyAlreadyClaimedEmbed({ success: false, message: 'déjà réclamé' }, AVATAR_MAZLAI);

  expect(avecCompteARebours.data.fields).toHaveLength(1);
  expect(sansCompteARebours.data.fields ?? []).toHaveLength(0);
});

describe('Résultat d\'un pari /coinflip', () => {
  it('met en avant une victoire sur pile', () => {
    const embed = buildCoinflipResultEmbed({ success: true, won: true, result: 'pile', amount: 100, coins: 600, message: 'Bravo' }, AVATAR_MAZLAI);

    expect(embed.data.title).toBe('🎉 VICTOIRE !');
    expect(embed.data.color).toBe(0x00ff00);
    expect(embed.data.fields?.[0].value).toContain('PILE');
    expect(embed.data.fields?.[1].value).toBe('+100€');
  });

  it('affiche une défaite sur face avec le montant perdu', () => {
    const embed = buildCoinflipResultEmbed({ success: true, won: false, result: 'face', amount: 50, coins: 450, message: 'Perdu' }, AVATAR_MAZLAI);

    expect(embed.data.title).toBe('💔 DÉFAITE');
    expect(embed.data.color).toBe(0xff0000);
    expect(embed.data.fields?.[0].value).toContain('FACE');
    expect(embed.data.fields?.[1].value).toBe('-50€');
  });
});

describe('Confirmation d\'achat — solde vs prix de l\'item', () => {
  const backgroundOcean = (overrides: Partial<ShopItem> = {}): ShopItem => ({
    item_id: 'bg_ocean', item_type: 'background', name: 'Ocean', price: 200, owned: false, equipped: false, ...overrides,
  });

  it('affiche "déjà possédé" même si le joueur a un solde nul', () => {
    const embed = buildShopItemConfirmEmbed(backgroundOcean({ owned: true }), 0);

    expect(embed.data.fields?.[2].value).toBe('✅ Déjà possédé');
    expect(embed.data.color).toBe(0xffaa00);
  });

  // Cas limite métier : solde exactement égal au prix. Un bug classique consiste à comparer
  // avec > au lieu de >=, ce qui bloquerait injustement un achat pourtant finançable.
  it('autorise l\'achat quand le solde est exactement égal au prix', () => {
    const embed = buildShopItemConfirmEmbed(backgroundOcean({ price: 100 }), 100);

    expect(embed.data.fields?.[2].value).toBe('✅ Vous pouvez acheter');
    expect(embed.data.color).toBe(0x00ff00);
  });

  it('bloque l\'achat dès que le solde manque ne serait-ce que d\'1€', () => {
    const embed = buildShopItemConfirmEmbed(backgroundOcean({ price: 100 }), 99);

    expect(embed.data.fields?.[2].value).toBe("❌ Pas assez d'argent");
    expect(embed.data.color).toBe(0xff0000);
  });
});

it('n\'affiche le nouveau solde qu\'en cas d\'achat réussi', () => {
  const achatReussi = buildShopPurchaseResultEmbed({ success: true, message: 'ok', new_balance: 300 });
  const achatEchoue = buildShopPurchaseResultEmbed({ success: false, message: 'insuffisant' });

  expect(achatReussi.data.title).toBe('✅ Achat réussi !');
  expect(achatReussi.data.fields?.[0].value).toBe('300€');
  expect(achatEchoue.data.title).toBe('❌ Achat échoué');
  expect(achatEchoue.data.fields ?? []).toHaveLength(0);
});

describe('Carte d\'inventaire — 6 slots de badges', () => {
  const itemsPossedes: ShopItem[] = [
    { item_id: 'badge_founder', item_type: 'badge', name: 'Founder', emoji: '👑', price: 500, owned: true, equipped: true },
    { item_id: 'badge_star', item_type: 'badge', name: 'Star', emoji: '⭐', price: 300, owned: true, equipped: true },
  ];

  it('retombe sur "Défaut" quand le background équipé ne correspond à aucun item connu (item retiré du shop depuis)', () => {
    const profil: ProfileData = {
      user_id: '731093847022501978', username: 'Mazlai', coins: 1000,
      equipped_background: 'bg_disparu', equipped_badges: ['badge_founder', '', '', '', '', ''],
    };

    expect(buildInventoryEmbed(profil, [], [], itemsPossedes, 'Mazlai', AVATAR_MAZLAI).data.fields?.find(f => f.name.includes('actuel'))?.value)
      .toBe('⬜ Défaut');
  });

  it('affiche les 6 slots simultanément : occupés avec leur nom, vides avec "Vide"', () => {
    // Cas du joueur complétionniste avec plusieurs badges équipés à la fois, pas un seul.
    const profilCollectionneur: ProfileData = {
      user_id: '731093847022501978', username: 'Mazlai', coins: 1000,
      equipped_background: 'bg_disparu', equipped_badges: ['badge_founder', 'badge_star', '', '', '', ''],
    };

    const badgesField = buildInventoryEmbed(profilCollectionneur, [], [], itemsPossedes, 'Mazlai', AVATAR_MAZLAI)
      .data.fields?.find(f => f.name.includes('Badges équipés'));

    expect(badgesField?.value).toContain('👑 Founder');
    expect(badgesField?.value).toContain('⭐ Star');
    expect(badgesField?.value?.match(/Vide/g)).toHaveLength(4);
  });

  it('affiche "Inconnu" pour un badge équipé qui a disparu du catalogue', () => {
    const profilAvecBadgeOrphelin: ProfileData = {
      user_id: '731093847022501978', username: 'Mazlai', coins: 1000,
      equipped_background: 'bg_disparu', equipped_badges: ['badge_disparu', '', '', '', '', ''],
    };

    const badgesField = buildInventoryEmbed(profilAvecBadgeOrphelin, [], [], itemsPossedes, 'Mazlai', AVATAR_MAZLAI)
      .data.fields?.find(f => f.name.includes('Badges équipés'));

    expect(badgesField?.value).toContain('❓ Inconnu');
  });
});

describe('Menu de sélection de slot pour un badge', () => {
  it('reprend le nom réel du badge quand il est trouvé dans le catalogue', () => {
    const founder: ShopItem = { item_id: 'badge_founder', item_type: 'badge', name: 'Founder', emoji: '👑', price: 0, owned: true, equipped: false };

    expect(buildSlotMenuEmbed(founder, 'badge_founder').data.title).toContain('Founder');
  });

  it("retombe sur l'identifiant brut si le badge n'existe plus dans le catalogue", () => {
    expect(buildSlotMenuEmbed(undefined, 'badge_disparu').data.title).toContain('badge_disparu');
  });
});
