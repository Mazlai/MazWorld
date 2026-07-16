import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, NEVER, throwError } from 'rxjs';
import { ProfileComponent } from './profile.component';
import { AuthService } from '../../core/services/auth.service';
import { ProfileService } from '../../core/services/profile.service';
import type { UserProfile } from '../../core/models/profile.model';

const MOCK_PROFILE: UserProfile = {
  user_id: '123',
  username: 'Mazlai',
  discord_avatar: null,
  coins: 500,
  equipped_background: 'bg_blue',
  equipped_badges: ['badge_star', 'badge_verified'],
  current_city: 'willowbrook',
  current_city_name: 'Willowbrook',
  traveling_to: null,
  arrival_time: null,
  created_at: '2024-01-15T00:00:00Z',
  visited_cities_count: 3,
  inventory_count: 5,
};

function makeAuthMock() {
  return {
    isAuthenticated: vi.fn().mockReturnValue(true),
    currentUser: vi.fn().mockReturnValue({ username: 'Mazlai' }),
    userAvatar: vi.fn().mockReturnValue(null),
    displayName: vi.fn().mockReturnValue('Mazlai'),
    isLoading: vi.fn().mockReturnValue(false),
  };
}

function setup(profileResult: 'never' | UserProfile | 'error' = 'never') {
  const profileObs =
    profileResult === 'never' ? NEVER
    : profileResult === 'error' ? throwError(() => new Error('API error'))
    : of(profileResult);

  TestBed.configureTestingModule({
    imports: [ProfileComponent],
    providers: [
      provideRouter([]),
      { provide: AuthService, useValue: makeAuthMock() },
      { provide: ProfileService, useValue: { getMyProfile: vi.fn().mockReturnValue(profileObs) } },
    ],
  });
  const fixture = TestBed.createComponent(ProfileComponent);
  fixture.detectChanges();
  return { component: fixture.componentInstance };
}

describe('ProfileComponent', () => {
  afterEach(() => TestBed.resetTestingModule());

  // ===== Null-safety des computed signals =====

  describe('Computed signals — null-safety (profile non chargé)', () => {
    it('backgroundColor vaut "#2f3136" par défaut', () => {
      const { component } = setup();
      expect(component.backgroundColor()).toBe('#2f3136');
    });

    it('backgroundName vaut "Défaut" par défaut', () => {
      const { component } = setup();
      expect(component.backgroundName()).toBe('Défaut');
    });

    it('memberSince vaut "" par défaut', () => {
      const { component } = setup();
      expect(component.memberSince()).toBe('');
    });

    it('badgeSlots contient 6 éléments null par défaut', () => {
      const { component } = setup();
      const slots = component.badgeSlots();
      expect(slots).toHaveLength(6);
      expect(slots.every(s => s === null)).toBe(true);
    });
  });

  // ===== Computed signals avec profil chargé =====

  describe('Computed signals — avec profil chargé', () => {
    it('backgroundColor retourne la couleur du fond équipé', () => {
      const { component } = setup(MOCK_PROFILE);
      // bg_blue → '#5865f2' d'après les données de l'app
      expect(component.backgroundColor()).not.toBe('#2f3136');
      expect(typeof component.backgroundColor()).toBe('string');
    });

    it('backgroundName retourne le nom du fond équipé', () => {
      const { component } = setup(MOCK_PROFILE);
      expect(component.backgroundName()).not.toBe('Défaut');
    });

    it('memberSince retourne la date formatée en français', () => {
      const { component } = setup(MOCK_PROFILE);
      expect(component.memberSince()).toContain('janvier');
      expect(component.memberSince()).toContain('2024');
    });

    it('badgeSlots remplit les créneaux avec les badges équipés', () => {
      const { component } = setup(MOCK_PROFILE);
      const slots = component.badgeSlots();
      expect(slots).toHaveLength(6);
      expect(slots[0]).toBe('badge_star');
      expect(slots[1]).toBe('badge_verified');
      expect(slots[2]).toBeNull();
    });
  });

  // ===== États chargement / erreur =====

  describe('États isLoading / hasError', () => {
    it('isLoading passe à false après un chargement réussi', () => {
      const { component } = setup(MOCK_PROFILE);
      expect(component.isLoading()).toBe(false);
    });

    it('isLoading passe à false même en cas d\'erreur', () => {
      const { component } = setup('error');
      expect(component.isLoading()).toBe(false);
    });

    it('hasError passe à true en cas d\'erreur API', () => {
      const { component } = setup('error');
      expect(component.hasError()).toBe(true);
    });

    it('hasError reste false après un chargement réussi', () => {
      const { component } = setup(MOCK_PROFILE);
      expect(component.hasError()).toBe(false);
    });
  });

  // ===== load() — retry =====

  describe('load() — retry', () => {
    it('réinitialise isLoading à true et hasError à false au rechargement', () => {
      const { component } = setup('error');
      expect(component.hasError()).toBe(true);
      expect(component.isLoading()).toBe(false);

      // Simulation du retry : on injecte une nouvelle réponse via le service
      const mockProfileService = TestBed.inject(ProfileService);
      (mockProfileService.getMyProfile as ReturnType<typeof vi.fn>).mockReturnValue(NEVER);

      component.load();

      expect(component.isLoading()).toBe(true);
      expect(component.hasError()).toBe(false);
    });
  });
});