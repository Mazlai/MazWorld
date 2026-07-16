import { TestBed } from '@angular/core/testing';
import { NEVER } from 'rxjs';
import { RecordsComponent } from './records.component';
import { RecordsService } from '../../core/services/records.service';
import type { PersonalRecords } from '../../core/models/records.model';

function makeRecords(visited_count: number, total_cities: number): PersonalRecords {
  return {
    coins: { current: 0, rank: 1, total_users: 10, percentile: 100 },
    exploration: { visited_count, total_cities, cities: [] },
    collection: { inventory_count: 0, badges_count: 0, recent_item: null },
    activity: { joined_at: '2024-01-01', last_activity: '2024-01-01', days_active: 1 },
  };
}

function setup() {
  TestBed.configureTestingModule({
    imports: [RecordsComponent],
    providers: [{ provide: RecordsService, useValue: { getMyRecords: vi.fn().mockReturnValue(NEVER) } }],
  });
  const fixture = TestBed.createComponent(RecordsComponent);
  fixture.detectChanges();
  return { component: fixture.componentInstance };
}

describe('RecordsComponent', () => {
  afterEach(() => TestBed.resetTestingModule());

  // ===== fmt() =====

  describe('fmt()', () => {
    it('utilise toLocaleString pour les valeurs < 1000', () => {
      const { component } = setup();
      expect(component.fmt(999)).not.toContain('K');
      expect(component.fmt(999)).not.toContain('M');
    });

    it('formate en K pour les milliers', () => {
      const { component } = setup();
      expect(component.fmt(1000)).toBe('1.0K');
      expect(component.fmt(1500)).toBe('1.5K');
      expect(component.fmt(999000)).toBe('999.0K');
    });

    it('formate en M pour les millions', () => {
      const { component } = setup();
      expect(component.fmt(1_000_000)).toBe('1.0M');
      expect(component.fmt(1_500_000)).toBe('1.5M');
      expect(component.fmt(2_000_000)).toBe('2.0M');
    });
  });

  // ===== explorationPct() =====

  describe('explorationPct()', () => {
    it('retourne 0 si records est null', () => {
      const { component } = setup();
      component.records.set(null);
      expect(component.explorationPct()).toBe(0);
    });

    it('retourne 0 si total_cities est 0 (garde division par zéro)', () => {
      const { component } = setup();
      component.records.set(makeRecords(5, 0));
      expect(component.explorationPct()).toBe(0);
    });

    it('calcule le pourcentage arrondi correctement', () => {
      const { component } = setup();
      component.records.set(makeRecords(3, 10));
      expect(component.explorationPct()).toBe(30);
    });

    it('arrondit le résultat (Math.round)', () => {
      const { component } = setup();
      component.records.set(makeRecords(1, 3)); // 33.33... → 33
      expect(component.explorationPct()).toBe(33);
    });

    it('retourne 100 si toutes les villes ont été visitées', () => {
      const { component } = setup();
      component.records.set(makeRecords(6, 6));
      expect(component.explorationPct()).toBe(100);
    });
  });

  // ===== États de chargement =====

  describe('États isLoading / hasError', () => {
    it('démarre en état de chargement', () => {
      const { component } = setup();
      expect(component.isLoading()).toBe(true);
    });

    it('hasError est false par défaut', () => {
      const { component } = setup();
      expect(component.hasError()).toBe(false);
    });
  });
});