import { TestBed } from '@angular/core/testing';
import { of, NEVER } from 'rxjs';
import { StatsComponent } from './stats.component';
import { StatsService } from '../../core/services/stats.service';
import type { GlobalStats, EconomyStats } from '../../core/models/stats.model';

const STATS_GLOBALES: GlobalStats = {
  total_users: 1500,
  total_cities: 6,
  total_coins_circulation: 250000,
  active_users_today: 42,
  active_users_week: 180,
};

const STATS_ECONOMIE: EconomyStats = {
  average_coins_per_user: 166,
  richest_user_coins: 9999,
  total_shop_purchases: 321,
  most_popular_item: 'bg_blue',
};

function monterStats(reponse: 'never' | 'success' = 'never') {
  const statsObs = reponse === 'success' ? of({ global: STATS_GLOBALES, economy: STATS_ECONOMIE }) : NEVER;
  TestBed.configureTestingModule({
    imports: [StatsComponent],
    providers: [{ provide: StatsService, useValue: { getAllStats: vi.fn().mockReturnValue(statsObs) } }],
  });
  const fixture = TestBed.createComponent(StatsComponent);
  fixture.detectChanges();
  return { component: fixture.componentInstance };
}

afterEach(() => TestBed.resetTestingModule());

// fmt() est une réimplémentation quasi identique de RecordsComponent.fmt() (même logique
// K/M) — dette technique à noter (candidat à extraire dans core/utils un jour), mais tant
// que ce n'est pas fait, les deux copies doivent rester couvertes indépendamment.
it('fmt() formate les grands nombres en K/M, comme son équivalent dans RecordsComponent', () => {
  const { component } = monterStats();

  expect(component.fmt(0)).not.toContain('K');
  expect(component.fmt(999)).not.toContain('K');
  expect(component.fmt(1000)).toBe('1.0K');
  expect(component.fmt(2500)).toBe('2.5K');
  expect(component.fmt(1_000_000)).toBe('1.0M');
  expect(component.fmt(2_500_000)).toBe('2.5M');
});

// Les deux catégories de stats (globales et économiques) arrivent dans une seule réponse API
// (AllStatsResponse) — elles doivent donc apparaître ensemble, jamais l'une sans l'autre.
it('peuple les stats globales et économiques ensemble depuis la même réponse', () => {
  const { component } = monterStats('success');

  expect(component.globalStats()).toEqual(STATS_GLOBALES);
  expect(component.economyStats()).toEqual(STATS_ECONOMIE);
  expect(component.isLoading()).toBe(false);
});
