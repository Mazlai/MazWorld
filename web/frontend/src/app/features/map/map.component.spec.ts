import { TestBed } from '@angular/core/testing';
import { NEVER } from 'rxjs';
import { MapComponent } from './map.component';
import { TravelService } from '../../core/services/travel.service';
import type { City, RouteData, TravelRoute, TravelMapData } from '../../core/models/travel.model';

function makeCity(overrides: Partial<City> & { city_id: string }): City {
  return { name: overrides.city_id, position_x: 100, position_y: 200, ...overrides };
}

function makeRoute(overrides: Partial<TravelRoute> & { city_to: string }): TravelRoute {
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

function setup() {
  const mockService = {
    getAllCities: vi.fn().mockReturnValue(NEVER),
    getAllRoutes: vi.fn().mockReturnValue(NEVER),
    getMap: vi.fn().mockReturnValue(NEVER),
    getStatus: vi.fn().mockReturnValue(NEVER),
    startTravel: vi.fn().mockReturnValue(NEVER),
  };
  TestBed.configureTestingModule({
    imports: [MapComponent],
    providers: [{ provide: TravelService, useValue: mockService }],
  });
  const fixture = TestBed.createComponent(MapComponent);
  fixture.detectChanges();
  return { component: fixture.componentInstance, mockService };
}

describe('MapComponent', () => {
  afterEach(() => TestBed.resetTestingModule());

  // ===== formatDuration() =====

  describe('formatDuration()', () => {
    it('affiche en minutes si < 60', () => {
      const { component } = setup();
      expect(component.formatDuration(45)).toBe('45 min');
      expect(component.formatDuration(1)).toBe('1 min');
      expect(component.formatDuration(59)).toBe('59 min');
    });

    it('affiche en heures entières si multiple de 60', () => {
      const { component } = setup();
      expect(component.formatDuration(60)).toBe('1h');
      expect(component.formatDuration(120)).toBe('2h');
    });

    it('affiche heures et minutes avec zéro padding si minutes > 0', () => {
      const { component } = setup();
      expect(component.formatDuration(90)).toBe('1h30');
      expect(component.formatDuration(65)).toBe('1h05');
      expect(component.formatDuration(75)).toBe('1h15');
    });
  });

  // ===== formatCountdown() =====

  describe('formatCountdown()', () => {
    it('formate les secondes en MM:SS avec zéro padding', () => {
      const { component } = setup();
      expect(component.formatCountdown(65)).toBe('1:05');
      expect(component.formatCountdown(3600)).toBe('60:00');
      expect(component.formatCountdown(0)).toBe('0:00');
      expect(component.formatCountdown(9)).toBe('0:09');
    });
  });

  // ===== getThemeColor() =====

  describe('getThemeColor()', () => {
    it('retourne la couleur correcte pour les thèmes connus', () => {
      const { component } = setup();
      expect(component.getThemeColor('nature')).toBe('rgba(139, 195, 74, 0.4)');
      expect(component.getThemeColor('maritime')).toBe('rgba(3, 169, 244, 0.4)');
      expect(component.getThemeColor('cyber')).toBe('rgba(156, 39, 176, 0.4)');
    });

    it('retourne la couleur de fallback pour un thème inconnu', () => {
      const { component } = setup();
      expect(component.getThemeColor('inexistant')).toBe('rgba(255, 107, 53, 0.4)');
    });

    it('retourne la couleur de fallback si theme est undefined', () => {
      const { component } = setup();
      expect(component.getThemeColor(undefined)).toBe('rgba(255, 107, 53, 0.4)');
    });
  });

  // ===== canAffordTravel() =====

  describe('canAffordTravel()', () => {
    it('retourne false si la route n\'existe pas pour la ville cible', () => {
      const { component } = setup();
      (component as unknown as { travelMapData: TravelMapData | null }).travelMapData = {
        current_city: { city_id: 'a', name: 'A', description: '', emoji: '', theme: '' },
        coins: 500,
        routes: [],
        jobs: [],
      };
      expect(component.canAffordTravel('inexistant')).toBe(false);
    });

    it('retourne true si le coût effectif est 0 (peu importe les coins)', () => {
      const { component } = setup();
      (component as unknown as { travelMapData: TravelMapData | null }).travelMapData = {
        current_city: { city_id: 'a', name: 'A', description: '', emoji: '', theme: '' },
        coins: 0,
        routes: [makeRoute({ city_to: 'dest', effective_cost: 0 })],
        jobs: [],
      };
      component.coins.set(0);
      expect(component.canAffordTravel('dest')).toBe(true);
    });

    it('retourne true si les coins sont suffisants', () => {
      const { component } = setup();
      (component as unknown as { travelMapData: TravelMapData | null }).travelMapData = {
        current_city: { city_id: 'a', name: 'A', description: '', emoji: '', theme: '' },
        coins: 500,
        routes: [makeRoute({ city_to: 'dest', effective_cost: 200 })],
        jobs: [],
      };
      component.coins.set(500);
      expect(component.canAffordTravel('dest')).toBe(true);
    });

    it('retourne false si les coins sont insuffisants', () => {
      const { component } = setup();
      (component as unknown as { travelMapData: TravelMapData | null }).travelMapData = {
        current_city: { city_id: 'a', name: 'A', description: '', emoji: '', theme: '' },
        coins: 50,
        routes: [makeRoute({ city_to: 'dest', effective_cost: 200 })],
        jobs: [],
      };
      component.coins.set(50);
      expect(component.canAffordTravel('dest')).toBe(false);
    });
  });

  // ===== visualRoutes — garde longueur zéro =====

  describe('visualRoutes — garde SVG longueur zéro', () => {
    it('ajoute 0.001 à x2 si les positions X sont identiques', () => {
      const { component } = setup();
      component.cities.set([
        makeCity({ city_id: 'a', position_x: 300, position_y: 100 }),
        makeCity({ city_id: 'b', position_x: 300, position_y: 400 }),
      ]);
      component.allRoutes.set([{ route_id: 1, city_from: 'a', city_to: 'b', from_name: 'A', from_emoji: '', to_name: 'B', to_emoji: '', cost: 0, duration: 10 }]);
      expect(component.visualRoutes()[0].x2).toBeCloseTo(300.001);
    });

    it('ajoute 0.001 à y2 si les positions Y sont identiques', () => {
      const { component } = setup();
      component.cities.set([
        makeCity({ city_id: 'a', position_x: 100, position_y: 200 }),
        makeCity({ city_id: 'b', position_x: 400, position_y: 200 }),
      ]);
      component.allRoutes.set([{ route_id: 1, city_from: 'a', city_to: 'b', from_name: 'A', from_emoji: '', to_name: 'B', to_emoji: '', cost: 0, duration: 10 }]);
      expect(component.visualRoutes()[0].y2).toBeCloseTo(200.001);
    });

    it('exclut les routes dont la ville d\'origine ou de destination est introuvable', () => {
      const { component } = setup();
      component.cities.set([makeCity({ city_id: 'a' })]);
      component.allRoutes.set([{ route_id: 1, city_from: 'a', city_to: 'inexistant', from_name: 'A', from_emoji: '', to_name: '?', to_emoji: '', cost: 0, duration: 0 }]);
      expect(component.visualRoutes()).toHaveLength(0);
    });

    it('retourne les coordonnées correctes pour une route valide', () => {
      const { component } = setup();
      component.cities.set([
        makeCity({ city_id: 'a', position_x: 100, position_y: 200 }),
        makeCity({ city_id: 'b', position_x: 500, position_y: 300 }),
      ]);
      component.allRoutes.set([{ route_id: 1, city_from: 'a', city_to: 'b', from_name: 'A', from_emoji: '', to_name: 'B', to_emoji: '', cost: 0, duration: 0 }]);
      const route = component.visualRoutes()[0];
      expect(route).toEqual({ x1: 100, y1: 200, x2: 500, y2: 300 });
    });
  });

  // ===== getCityPosition() =====

  describe('getCityPosition()', () => {
    it('convertit les coordonnées en pourcentage de la grille (1000x600)', () => {
      const { component } = setup();
      const pos = component.getCityPosition(makeCity({ city_id: 'a', position_x: 500, position_y: 300 }));
      expect(pos.x).toBeCloseTo(50);
      expect(pos.y).toBeCloseTo(50);
    });
  });
});