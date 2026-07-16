import { getBadgeSlots, getBackgroundName, getBackgroundStyle, formatDateFr, MAX_BADGE_SLOTS } from './profile.utils';

describe('profile.utils', () => {

  // ===== MAX_BADGE_SLOTS =====

  describe('MAX_BADGE_SLOTS', () => {
    it('vaut 6', () => {
      expect(MAX_BADGE_SLOTS).toBe(6);
    });
  });

  // ===== getBadgeSlots() =====

  describe('getBadgeSlots()', () => {
    it('retourne 6 slots null quand aucun badge équipé', () => {
      expect(getBadgeSlots([])).toEqual([null, null, null, null, null, null]);
    });

    it('retourne 6 slots null par défaut (sans argument)', () => {
      expect(getBadgeSlots()).toEqual([null, null, null, null, null, null]);
    });

    it('remplit les premiers slots avec les badges fournis', () => {
      expect(getBadgeSlots(['badge_verified', 'badge_star'])).toEqual([
        'badge_verified', 'badge_star', null, null, null, null,
      ]);
    });

    it('remplit exactement 6 slots quand 6 badges fournis', () => {
      const badges = ['a', 'b', 'c', 'd', 'e', 'f'];
      expect(getBadgeSlots(badges)).toEqual(['a', 'b', 'c', 'd', 'e', 'f']);
    });

    it('tronque à 6 quand plus de 6 badges fournis', () => {
      const result = getBadgeSlots(['a', 'b', 'c', 'd', 'e', 'f', 'g']);
      expect(result.length).toBe(6);
      expect(result).not.toContain('g');
    });
  });

  // ===== getBackgroundName() =====

  describe('getBackgroundName()', () => {
    it('retourne le nom du background pour un ID valide', () => {
      expect(getBackgroundName('bg_blue')).toBe('Bleu Discord');
    });

    it('retourne "Défaut" pour un ID inconnu', () => {
      expect(getBackgroundName('bg_inexistant')).toBe('Défaut');
    });

    it('retourne le nom du background par défaut pour bg_default', () => {
      expect(getBackgroundName('bg_default')).toBe('Défaut');
    });
  });

  // ===== getBackgroundStyle() =====

  describe('getBackgroundStyle()', () => {
    it('retourne la couleur du background pour un ID valide', () => {
      expect(getBackgroundStyle('bg_blue')).toEqual({ 'background-color': '#5865f2' });
    });

    it('retourne la couleur de fallback (#2f3136) pour un ID inconnu', () => {
      expect(getBackgroundStyle('bg_inexistant')).toEqual({ 'background-color': '#2f3136' });
    });

    it('retourne un objet avec la clé background-color', () => {
      const style = getBackgroundStyle('bg_purple');
      expect(style).toHaveProperty('background-color');
    });
  });

  // ===== formatDateFr() =====

  describe('formatDateFr()', () => {
    it('formate une date en français (jour mois année)', () => {
      expect(formatDateFr('2024-01-15')).toBe('15 janvier 2024');
    });

    it('formate le 31 décembre correctement', () => {
      expect(formatDateFr('2023-12-31')).toBe('31 décembre 2023');
    });

    it('formate le 1er mars correctement', () => {
      expect(formatDateFr('2025-03-01')).toBe('1 mars 2025');
    });
  });
});