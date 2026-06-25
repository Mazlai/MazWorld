import { getBackgroundColor, getBackgroundById } from '../data';

export const MAX_BADGE_SLOTS = 6;

export function getBadgeSlots(equippedBadges: string[] = []): (string | null)[] {
  return Array.from({ length: MAX_BADGE_SLOTS }, (_, i) => equippedBadges[i] ?? null);
}

export function getBackgroundName(backgroundId: string): string {
  return getBackgroundById(backgroundId)?.name ?? 'Défaut';
}

export function getBackgroundStyle(backgroundId: string): Record<string, string> {
  return { 'background-color': getBackgroundColor(backgroundId) };
}

export function formatDateFr(dateString: string): string {
  return new Date(dateString).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}
