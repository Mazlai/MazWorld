import { describe, it, expect, beforeEach, vi } from 'vitest';
import { checkCooldown, setCooldown, resetCooldown, formatTimeRemaining, COOLDOWN_DURATIONS } from './cooldownManager';

// Les cooldowns reposent sur Date.now(), donc on fige l'horloge pour pouvoir
// avancer le temps de façon déterministe dans les scénarios d'expiration.
beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date('2026-01-01T00:00:00.000Z'));
});

describe('Premier usage d\'une commande à cooldown', () => {
  it("n'affiche aucun blocage pour un joueur qui n'a jamais utilisé la commande", () => {
    const status = checkCooldown('daily', '812340192837465001', COOLDOWN_DURATIONS.DAILY);

    expect(status).toEqual({ isOnCooldown: false, timeLeft: 0, formattedTime: '' });
  });
});

describe('Fenêtre de blocage après usage', () => {
  it('bloque immédiatement après usage, avec le temps restant complet', () => {
    setCooldown('work', '812340192837465002');

    const status = checkCooldown('work', '812340192837465002', COOLDOWN_DURATIONS.WORK);

    expect(status.isOnCooldown).toBe(true);
    expect(status.timeLeft).toBe(COOLDOWN_DURATIONS.WORK);
  });

  // Cas limite métier : à la milliseconde exacte d'expiration, le joueur doit déjà pouvoir
  // rejouer. Un décalage d'une seule milliseconde ici correspondrait à un vrai bug de blocage.
  it('libère la commande à la milliseconde exacte où le cooldown expire', () => {
    setCooldown('coinflip', '812340192837465003');
    vi.advanceTimersByTime(COOLDOWN_DURATIONS.COINFLIP);

    expect(checkCooldown('coinflip', '812340192837465003', COOLDOWN_DURATIONS.COINFLIP).isOnCooldown).toBe(false);
  });

  it('reste bloqué une milliseconde avant expiration', () => {
    setCooldown('coinflip', '812340192837465004');
    vi.advanceTimersByTime(COOLDOWN_DURATIONS.COINFLIP - 1);

    expect(checkCooldown('coinflip', '812340192837465004', COOLDOWN_DURATIONS.COINFLIP).isOnCooldown).toBe(true);
  });
});

describe('Isolation entre joueurs et entre commandes', () => {
  it('ne mélange pas les cooldowns de /daily et /work pour un même joueur', () => {
    setCooldown('daily', 'mazlai_dev');

    expect(checkCooldown('work', 'mazlai_dev', COOLDOWN_DURATIONS.WORK).isOnCooldown).toBe(false);
  });

  it('ne fait pas fuiter le cooldown d\'un joueur vers un autre sur la même commande', () => {
    setCooldown('daily', 'joueur_A');

    expect(checkCooldown('daily', 'joueur_B', COOLDOWN_DURATIONS.DAILY).isOnCooldown).toBe(false);
  });
});

describe('Réinitialisation manuelle du cooldown', () => {
  it('rend la commande disponible immédiatement, avant l\'expiration normale', () => {
    setCooldown('daily', '812340192837465006');
    resetCooldown('daily', '812340192837465006');

    expect(checkCooldown('daily', '812340192837465006', COOLDOWN_DURATIONS.DAILY).isOnCooldown).toBe(false);
  });

  it("ne plante pas si on reset un joueur qui n'a jamais posé de cooldown", () => {
    expect(() => resetCooldown('daily', 'jamais-vu')).not.toThrow();
  });
});

describe('Formatage du temps restant affiché au joueur', () => {
  it('combine heures, minutes et secondes', () => {
    const deuxHeuresQuinzeMinutesTrenteSecondes = (2 * 3600 + 15 * 60 + 30) * 1000;

    expect(formatTimeRemaining(deuxHeuresQuinzeMinutesTrenteSecondes)).toBe('2h 15m 30s');
  });

  it('masque les unités à zéro, sauf si tout est à zéro', () => {
    expect(formatTimeRemaining(45 * 1000)).toBe('45s');
    expect(formatTimeRemaining(5 * 60 * 1000)).toBe('5m');
    expect(formatTimeRemaining(0)).toBe('0s');
  });

  it('omet les secondes quand elles sont nulles mais heures/minutes présentes', () => {
    const uneHeureTrenteExact = (1 * 3600 + 30 * 60) * 1000;

    expect(formatTimeRemaining(uneHeureTrenteExact)).toBe('1h 30m');
  });
});
