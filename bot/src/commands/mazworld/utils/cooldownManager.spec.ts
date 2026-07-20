import { describe, it, expect, beforeEach, vi } from 'vitest';
import { checkCooldown, setCooldown, resetCooldown, formatTimeRemaining, COOLDOWN_DURATIONS } from './cooldownManager';

describe('cooldownManager', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-01T00:00:00.000Z'));
  });

  describe('checkCooldown', () => {
    it('reports no cooldown for a user who never used the command', () => {
      const result = checkCooldown('daily', 'user-never-used', COOLDOWN_DURATIONS.DAILY);

      expect(result.isOnCooldown).toBe(false);
      expect(result.timeLeft).toBe(0);
      expect(result.formattedTime).toBe('');
    });

    it('reports an active cooldown right after use', () => {
      setCooldown('work', 'user-1');

      const result = checkCooldown('work', 'user-1', COOLDOWN_DURATIONS.WORK);

      expect(result.isOnCooldown).toBe(true);
      expect(result.timeLeft).toBe(COOLDOWN_DURATIONS.WORK);
    });

    it('reports the cooldown as expired once the duration has elapsed', () => {
      setCooldown('coinflip', 'user-2');

      vi.advanceTimersByTime(COOLDOWN_DURATIONS.COINFLIP + 1);

      const result = checkCooldown('coinflip', 'user-2', COOLDOWN_DURATIONS.COINFLIP);

      expect(result.isOnCooldown).toBe(false);
    });

    it('keeps cooldowns isolated per command type for the same user', () => {
      setCooldown('daily', 'user-3');

      const workResult = checkCooldown('work', 'user-3', COOLDOWN_DURATIONS.WORK);

      expect(workResult.isOnCooldown).toBe(false);
    });

    it('keeps cooldowns isolated per user for the same command', () => {
      setCooldown('daily', 'user-4');

      const otherUserResult = checkCooldown('daily', 'user-5', COOLDOWN_DURATIONS.DAILY);

      expect(otherUserResult.isOnCooldown).toBe(false);
    });
  });

  describe('resetCooldown', () => {
    it('clears an active cooldown so the user can act again immediately', () => {
      setCooldown('daily', 'user-6');
      resetCooldown('daily', 'user-6');

      const result = checkCooldown('daily', 'user-6', COOLDOWN_DURATIONS.DAILY);

      expect(result.isOnCooldown).toBe(false);
    });

    it('does nothing when the user has no cooldown recorded', () => {
      expect(() => resetCooldown('daily', 'user-never-set')).not.toThrow();
    });
  });

  describe('formatTimeRemaining', () => {
    it('formats hours, minutes and seconds together', () => {
      const ms = (2 * 3600 + 15 * 60 + 30) * 1000;

      expect(formatTimeRemaining(ms)).toBe('2h 15m 30s');
    });

    it('omits zero-value units except when everything is zero', () => {
      expect(formatTimeRemaining(45 * 1000)).toBe('45s');
      expect(formatTimeRemaining(5 * 60 * 1000)).toBe('5m');
      expect(formatTimeRemaining(0)).toBe('0s');
    });

    it('omits seconds when hours and minutes are both present but seconds are zero', () => {
      const ms = (1 * 3600 + 30 * 60) * 1000;

      expect(formatTimeRemaining(ms)).toBe('1h 30m');
    });
  });
});
