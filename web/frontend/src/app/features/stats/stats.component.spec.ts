import { TestBed } from '@angular/core/testing';
import { of, NEVER } from 'rxjs';
import { StatsComponent } from './stats.component';
import { StatsService } from '../../core/services/stats.service';
import type { GlobalStats, EconomyStats } from '../../core/models/stats.model';

const MOCK_GLOBAL: GlobalStats = {
  total_users: 1500,
  total_cities: 6,
  total_coins_circulation: 250000,
  active_users_today: 42,
  active_users_week: 180,
};

const MOCK_ECONOMY: EconomyStats = {
  average_coins_per_user: 166,
  richest_user_coins: 9999,
  total_shop_purchases: 321,
  most_popular_item: 'bg_blue',
};

function setup(result: 'never' | 'success' = 'never') {
  const statsObs = result === 'success'
    ? of({ global: MOCK_GLOBAL, economy: MOCK_ECONOMY })
    : NEVER;
  TestBed.configureTestingModule({
    imports: [StatsComponent],
    providers: [{ provide: StatsService, useValue: { getAllStats: vi.fn().mockReturnValue(statsObs) } }],
  });
  const fixture = TestBed.createComponent(StatsComponent);
  fixture.detectChanges();
  return { component: fixture.componentInstance };
}

describe('StatsComponent', () => {
  afterEach(() => TestBed.resetTestingModule());

  // ===== fmt() — implémentation dupliquée de RecordsComponent =====

  describe('fmt()', () => {
    it('retourne la valeur locale pour les nombres < 1000', () => {
      const { component } = setup();
      expect(component.fmt(0)).not.toContain('K');
      expect(component.fmt(999)).not.toContain('K');
    });

    it('formate en K pour les milliers', () => {
      const { component } = setup();
      expect(component.fmt(1000)).toBe('1.0K');
      expect(component.fmt(2500)).toBe('2.5K');
    });

    it('formate en M pour les millions', () => {
      const { component } = setup();
      expect(component.fmt(1_000_000)).toBe('1.0M');
      expect(component.fmt(2_500_000)).toBe('2.5M');
    });
  });

  // ===== globalStats et economyStats set simultanément depuis la même réponse =====

  describe('Chargement réussi — set atomique des deux signaux', () => {
    it('popule globalStats et economyStats depuis le même appel API', () => {
      const { component } = setup('success');
      expect(component.globalStats()).toEqual(MOCK_GLOBAL);
      expect(component.economyStats()).toEqual(MOCK_ECONOMY);
      expect(component.isLoading()).toBe(false);
    });
  });
});
