import { TestBed } from '@angular/core/testing';
import { NEVER } from 'rxjs';
import { MapComponent } from './map.component';
import { TravelService } from '../../core/services/travel.service';
import type { City, RouteData, TravelRoute, TravelMapData } from '../../core/models/travel.model';

function villeSurLaCarte(overrides: Partial<City> & { city_id: string }): City {
  return { name: overrides.city_id, position_x: 100, position_y: 200, ...overrides };
}

function routeVersDestination(overrides: Partial<TravelRoute> & { city_to: string }): TravelRoute {
  return {
    route_id: 1,
    destination_name: overrides.city_to,
    destination_emoji: '🏙️',
    cost: 100,
    duration: 30,
    visited: false,
    effective_cost: 100,
    ...overrides,
  };
}

function monterCarte() {
  const serviceMock = {
    getAllCities: vi.fn().mockReturnValue(NEVER),
    getAllRoutes: vi.fn().mockReturnValue(NEVER),
    getMap: vi.fn().mockReturnValue(NEVER),
    getStatus: vi.fn().mockReturnValue(NEVER),
    startTravel: vi.fn().mockReturnValue(NEVER),
  };
  TestBed.configureTestingModule({
    imports: [MapComponent],
    providers: [{ provide: TravelService, useValue: serviceMock }],
  });
  const fixture = TestBed.createComponent(MapComponent);
  fixture.detectChanges();
  return { component: fixture.componentInstance, serviceMock };
}

afterEach(() => TestBed.resetTestingModule());

it('formatDuration() bascule proprement entre minutes, heures rondes et heures+minutes', () => {
  const { component } = monterCarte();

  expect(component.formatDuration(45)).toBe('45 min');
  expect(component.formatDuration(59)).toBe('59 min');
  expect(component.formatDuration(60)).toBe('1h');
  expect(component.formatDuration(120)).toBe('2h');
  expect(component.formatDuration(90)).toBe('1h30');
  expect(component.formatDuration(65)).toBe('1h05'); // zéro de remplissage sur les minutes
});

it('formatCountdown() affiche un compte à rebours MM:SS avec zéro de remplissage', () => {
  const { component } = monterCarte();

  expect(component.formatCountdown(65)).toBe('1:05');
  expect(component.formatCountdown(3600)).toBe('60:00');
  expect(component.formatCountdown(0)).toBe('0:00');
  expect(component.formatCountdown(9)).toBe('0:09');
});

describe('getThemeColor()', () => {
  it('associe chaque thème de ville à sa couleur de fond', () => {
    const { component } = monterCarte();

    expect(component.getThemeColor('nature')).toBe('rgba(139, 195, 74, 0.4)');
    expect(component.getThemeColor('maritime')).toBe('rgba(3, 169, 244, 0.4)');
    expect(component.getThemeColor('cyber')).toBe('rgba(156, 39, 176, 0.4)');
  });

  it('retombe sur la couleur orange de la charte pour un thème non répertorié ou absent', () => {
    const { component } = monterCarte();

    expect(component.getThemeColor('inexistant')).toBe('rgba(255, 107, 53, 0.4)');
    expect(component.getThemeColor(undefined)).toBe('rgba(255, 107, 53, 0.4)');
  });
});

describe('canAffordTravel() — le joueur peut-il financer ce trajet ?', () => {
  it('refuse si aucune route n\'existe vers la ville cible', () => {
    const { component } = monterCarte();
    (component as unknown as { travelMapData: TravelMapData | null }).travelMapData = {
      current_city: { city_id: 'a', name: 'A', description: '', emoji: '', theme: '' },
      coins: 500, routes: [], jobs: [],
    };

    expect(component.canAffordTravel('inexistant')).toBe(false);
  });

  it('autorise un trajet gratuit (coût effectif 0) même sans le moindre coin', () => {
    const { component } = monterCarte();
    (component as unknown as { travelMapData: TravelMapData | null }).travelMapData = {
      current_city: { city_id: 'a', name: 'A', description: '', emoji: '', theme: '' },
      coins: 0, routes: [routeVersDestination({ city_to: 'dest', effective_cost: 0 })], jobs: [],
    };
    component.coins.set(0);

    expect(component.canAffordTravel('dest')).toBe(true);
  });

  it('autorise le trajet quand le solde couvre le coût', () => {
    const { component } = monterCarte();
    (component as unknown as { travelMapData: TravelMapData | null }).travelMapData = {
      current_city: { city_id: 'a', name: 'A', description: '', emoji: '', theme: '' },
      coins: 500, routes: [routeVersDestination({ city_to: 'dest', effective_cost: 200 })], jobs: [],
    };
    component.coins.set(500);

    expect(component.canAffordTravel('dest')).toBe(true);
  });

  it('refuse le trajet quand le solde est insuffisant', () => {
    const { component } = monterCarte();
    (component as unknown as { travelMapData: TravelMapData | null }).travelMapData = {
      current_city: { city_id: 'a', name: 'A', description: '', emoji: '', theme: '' },
      coins: 50, routes: [routeVersDestination({ city_to: 'dest', effective_cost: 200 })], jobs: [],
    };
    component.coins.set(50);

    expect(component.canAffordTravel('dest')).toBe(false);
  });
});

// Deux villes parfaitement alignées horizontalement ou verticalement donneraient un
// segment SVG de longueur nulle sur un axe — invisible ou mal rendu par certains navigateurs.
// Le nudge de 0.001px force un segment techniquement non nul sans impact visuel perceptible.
describe('visualRoutes() — évite les segments SVG de longueur nulle', () => {
  it('décale légèrement x2 quand deux villes partagent exactement la même abscisse', () => {
    const { component } = monterCarte();
    component.cities.set([villeSurLaCarte({ city_id: 'a', position_x: 300, position_y: 100 }), villeSurLaCarte({ city_id: 'b', position_x: 300, position_y: 400 })]);
    component.allRoutes.set([{ route_id: 1, city_from: 'a', city_to: 'b', from_name: 'A', from_emoji: '', to_name: 'B', to_emoji: '', cost: 0, duration: 10 }]);

    expect(component.visualRoutes()[0].x2).toBeCloseTo(300.001);
  });

  it('décale légèrement y2 quand deux villes partagent exactement la même ordonnée', () => {
    const { component } = monterCarte();
    component.cities.set([villeSurLaCarte({ city_id: 'a', position_x: 100, position_y: 200 }), villeSurLaCarte({ city_id: 'b', position_x: 400, position_y: 200 })]);
    component.allRoutes.set([{ route_id: 1, city_from: 'a', city_to: 'b', from_name: 'A', from_emoji: '', to_name: 'B', to_emoji: '', cost: 0, duration: 10 }]);

    expect(component.visualRoutes()[0].y2).toBeCloseTo(200.001);
  });

  it('exclut une route dont la ville de départ ou d\'arrivée n\'a pas de coordonnées connues', () => {
    const { component } = monterCarte();
    component.cities.set([villeSurLaCarte({ city_id: 'a' })]);
    component.allRoutes.set([{ route_id: 1, city_from: 'a', city_to: 'inexistant', from_name: 'A', from_emoji: '', to_name: '?', to_emoji: '', cost: 0, duration: 0 }]);

    expect(component.visualRoutes()).toHaveLength(0);
  });

  it('calcule les coordonnées exactes pour une route reliant deux villes distinctes', () => {
    const { component } = monterCarte();
    component.cities.set([villeSurLaCarte({ city_id: 'a', position_x: 100, position_y: 200 }), villeSurLaCarte({ city_id: 'b', position_x: 500, position_y: 300 })]);
    component.allRoutes.set([{ route_id: 1, city_from: 'a', city_to: 'b', from_name: 'A', from_emoji: '', to_name: 'B', to_emoji: '', cost: 0, duration: 0 } satisfies RouteData]);

    expect(component.visualRoutes()[0]).toEqual({ x1: 100, y1: 200, x2: 500, y2: 300 });
  });
});

it('getCityPosition() convertit les coordonnées absolues en pourcentage sur une grille 1000x600', () => {
  const { component } = monterCarte();

  const position = component.getCityPosition(villeSurLaCarte({ city_id: 'a', position_x: 500, position_y: 300 }));

  expect(position.x).toBeCloseTo(50);
  expect(position.y).toBeCloseTo(50);
});
