const cooldownMaps = new Map<string, Map<string, number>>();

function getCooldownMap(commandType: string): Map<string, number> {
  if (!cooldownMaps.has(commandType)) {
    cooldownMaps.set(commandType, new Map<string, number>());
  }
  return cooldownMaps.get(commandType)!;
}

export function checkCooldown(
  commandType: string,
  userId: string,
  cooldownMs: number,
): { isOnCooldown: boolean; timeLeft: number; formattedTime: string } {
  const cooldowns = getCooldownMap(commandType);
  const now = Date.now();
  const lastUsed = cooldowns.get(userId);

  if (lastUsed) {
    const expirationTime = lastUsed + cooldownMs;
    if (now < expirationTime) {
      const timeLeft = expirationTime - now;
      return { isOnCooldown: true, timeLeft, formattedTime: formatTimeRemaining(timeLeft) };
    }
  }

  return { isOnCooldown: false, timeLeft: 0, formattedTime: '' };
}

export function setCooldown(commandType: string, userId: string): void {
  getCooldownMap(commandType).set(userId, Date.now());
}

export function resetCooldown(commandType: string, userId: string): void {
  getCooldownMap(commandType).delete(userId);
}

export function formatTimeRemaining(ms: number): string {
  const hours   = Math.floor(ms / 3600000);
  const minutes = Math.floor((ms % 3600000) / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);

  const parts: string[] = [];
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  if (seconds > 0 || parts.length === 0) parts.push(`${seconds}s`);

  return parts.join(' ');
}

export const COOLDOWN_DURATIONS = {
  WORK:     3600000,
  COINFLIP: 30000,
  DAILY:    86400000,
} as const;
