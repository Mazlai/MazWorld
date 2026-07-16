export * from './data.types';

import backgroundsJson from './backgrounds.json';
import badgesJson from './badges.json';
import type { Background, Badge } from './data.types';

export const BACKGROUNDS: Background[] = backgroundsJson.backgrounds;
export const BADGES: Badge[] = badgesJson.badges;

export function getBackgroundById(id: string): Background | undefined {
  return BACKGROUNDS.find(bg => bg.id === id);
}

export function getBackgroundColor(id: string): string {
  return getBackgroundById(id)?.color ?? '#2f3136';
}

export function getBadgeById(id: string): Badge | undefined {
  return BADGES.find(b => b.id === id);
}

export function getBadgeEmoji(id: string): string {
  return getBadgeById(id)?.emoji ?? '❓';
}