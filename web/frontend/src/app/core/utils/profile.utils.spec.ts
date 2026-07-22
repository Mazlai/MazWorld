import { getBadgeSlots, getBackgroundName, getBackgroundStyle, formatDateFr, MAX_BADGE_SLOTS } from './profile.utils';

it('MAX_BADGE_SLOTS correspond aux 6 emplacements de badges affichés sur le profil', () => {
  expect(MAX_BADGE_SLOTS).toBe(6);
});

describe('getBadgeSlots() — normalisation vers exactement 6 emplacements', () => {
  it('retourne 6 slots vides quand le joueur n\'a encore rien équipé', () => {
    expect(getBadgeSlots([])).toEqual([null, null, null, null, null, null]);
  });

  it('retourne 6 slots vides même sans argument (nouveau compte)', () => {
    expect(getBadgeSlots()).toEqual([null, null, null, null, null, null]);
  });

  it('place les badges équipés dans les premiers slots, le reste à null', () => {
    expect(getBadgeSlots(['badge_verified', 'badge_star'])).toEqual([
      'badge_verified', 'badge_star', null, null, null, null,
    ]);
  });

  it('remplit exactement les 6 slots quand le joueur a sa collection complète équipée', () => {
    expect(getBadgeSlots(['a', 'b', 'c', 'd', 'e', 'f'])).toEqual(['a', 'b', 'c', 'd', 'e', 'f']);
  });

  // En théorie le backend ne devrait jamais renvoyer plus de 6 badges équipés (contrainte
  // de 6 slots imposée côté API), mais le frontend ne doit pas planter si ça arrivait quand même.
  it('tronque à 6 plutôt que de planter si l\'API renvoie un 7e badge par erreur', () => {
    const slots = getBadgeSlots(['a', 'b', 'c', 'd', 'e', 'f', 'g']);

    expect(slots).toHaveLength(6);
    expect(slots).not.toContain('g');
  });
});

describe('getBackgroundName() — libellé affiché du background équipé', () => {
  it('retourne le nom lisible pour un identifiant connu', () => {
    expect(getBackgroundName('bg_blue')).toBe('Bleu Discord');
  });

  it('retourne "Défaut" pour un identifiant qui ne correspond à aucun background', () => {
    expect(getBackgroundName('bg_inexistant')).toBe('Défaut');
  });

  it('retourne "Défaut" explicitement pour bg_default', () => {
    expect(getBackgroundName('bg_default')).toBe('Défaut');
  });
});

describe('getBackgroundStyle() — couleur CSS appliquée derrière le profil', () => {
  it('retourne la couleur associée à un identifiant connu', () => {
    expect(getBackgroundStyle('bg_blue')).toEqual({ 'background-color': '#5865f2' });
  });

  it('retombe sur le gris Discord par défaut pour un identifiant inconnu', () => {
    expect(getBackgroundStyle('bg_inexistant')).toEqual({ 'background-color': '#2f3136' });
  });

  it('expose toujours la clé background-color, quel que soit le background', () => {
    expect(getBackgroundStyle('bg_purple')).toHaveProperty('background-color');
  });
});

describe('formatDateFr() — affichage localisé des dates (ex. date d\'inscription)', () => {
  it('formate au format "jour mois année"', () => {
    expect(formatDateFr('2024-01-15')).toBe('15 janvier 2024');
  });

  it('gère correctement le changement d\'année (31 décembre)', () => {
    expect(formatDateFr('2023-12-31')).toBe('31 décembre 2023');
  });

  it('n\'ajoute pas de zéro superflu devant un jour à un chiffre (1er mars, pas 01 mars)', () => {
    expect(formatDateFr('2025-03-01')).toBe('1 mars 2025');
  });
});
