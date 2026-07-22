import { TestBed } from '@angular/core/testing';
import { NEVER } from 'rxjs';
import { RecordsComponent } from './records.component';
import { RecordsService } from '../../core/services/records.service';
import type { PersonalRecords } from '../../core/models/records.model';

function recordsAvecExploration(villesVisitees: number, totalVilles: number): PersonalRecords {
  return {
    coins: { current: 0, rank: 1, total_users: 10, percentile: 100 },
    exploration: { visited_count: villesVisitees, total_cities: totalVilles, cities: [] },
    collection: { inventory_count: 0, badges_count: 0, recent_item: null },
    activity: { joined_at: '2024-01-01', last_activity: '2024-01-01', days_active: 1 },
  };
}

function monterRecords() {
  TestBed.configureTestingModule({
    imports: [RecordsComponent],
    providers: [{ provide: RecordsService, useValue: { getMyRecords: vi.fn().mockReturnValue(NEVER) } }],
  });
  const fixture = TestBed.createComponent(RecordsComponent);
  fixture.detectChanges();
  return { component: fixture.componentInstance };
}

afterEach(() => TestBed.resetTestingModule());

it('fmt() abrège les grands nombres en K/M mais laisse les petits nombres tels quels', () => {
  const { component } = monterRecords();

  expect(component.fmt(999)).not.toContain('K');
  expect(component.fmt(1000)).toBe('1.0K');
  expect(component.fmt(1500)).toBe('1.5K');
  expect(component.fmt(999000)).toBe('999.0K');
  expect(component.fmt(1_000_000)).toBe('1.0M');
  expect(component.fmt(2_000_000)).toBe('2.0M');
});

describe('explorationPct() — pourcentage de villes découvertes', () => {
  it('vaut 0 tant que les records ne sont pas encore chargés', () => {
    const { component } = monterRecords();
    component.records.set(null);

    expect(component.explorationPct()).toBe(0);
  });

  // total_cities ne devrait jamais être 0 en pratique (le monde a toujours au moins une
  // ville), mais une division par zéro ferait planter l'affichage plutôt que 0% — à couvrir.
  it('vaut 0 plutôt que NaN si total_cities est 0 (garde-fou division par zéro)', () => {
    const { component } = monterRecords();
    component.records.set(recordsAvecExploration(5, 0));

    expect(component.explorationPct()).toBe(0);
  });

  it('calcule le pourcentage exact quand la division tombe juste', () => {
    const { component } = monterRecords();
    component.records.set(recordsAvecExploration(3, 10));

    expect(component.explorationPct()).toBe(30);
  });

  it('arrondit un résultat non entier (1/3 → 33%, pas 33.33...%)', () => {
    const { component } = monterRecords();
    component.records.set(recordsAvecExploration(1, 3));

    expect(component.explorationPct()).toBe(33);
  });

  it('atteint 100% une fois toutes les villes visitées', () => {
    const { component } = monterRecords();
    component.records.set(recordsAvecExploration(6, 6));

    expect(component.explorationPct()).toBe(100);
  });
});

it('démarre en chargement, sans erreur, avant toute réponse de l\'API', () => {
  const { component } = monterRecords();

  expect(component.isLoading()).toBe(true);
  expect(component.hasError()).toBe(false);
});
