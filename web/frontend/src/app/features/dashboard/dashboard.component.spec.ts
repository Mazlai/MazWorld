import { TestBed } from '@angular/core/testing';
import { of, throwError, NEVER } from 'rxjs';
import { DashboardComponent } from './dashboard.component';
import { AuthService } from '../../core/services/auth.service';
import { ProfileService } from '../../core/services/profile.service';
import { LeaderboardService } from '../../core/services/leaderboard.service';
import type { UserProfile } from '../../core/models/profile.model';

const MOCK_PROFILE: UserProfile = {
  user_id: '123',
  username: 'Mazlai',
  discord_avatar: null,
  coins: 500,
  equipped_background: 'bg_default',
  equipped_badges: [],
  current_city: 'willowbrook',
  current_city_name: 'Willowbrook',
  traveling_to: null,
  arrival_time: null,
  created_at: '2024-01-01T00:00:00Z',
  visited_cities_count: 2,
  inventory_count: 3,
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

function setup(opts: {
  profileResult?: 'never' | UserProfile | 'error';
  rankResult?: 'never' | number | 'error';
} = {}) {
  const profileObs =
    opts.profileResult === undefined || opts.profileResult === 'never' ? NEVER
    : opts.profileResult === 'error' ? throwError(() => new Error('Profile error'))
    : of(opts.profileResult);

  const rankObs =
    opts.rankResult === undefined || opts.rankResult === 'never' ? NEVER
    : opts.rankResult === 'error' ? throwError(() => new Error('Rank error'))
    : of({ rank: opts.rankResult });

  TestBed.configureTestingModule({
    imports: [DashboardComponent],
    providers: [
      { provide: AuthService, useValue: makeAuthMock() },
      { provide: ProfileService, useValue: { getMyProfile: vi.fn().mockReturnValue(profileObs) } },
      { provide: LeaderboardService, useValue: { getMyRank: vi.fn().mockReturnValue(rankObs) } },
    ],
  });
  const fixture = TestBed.createComponent(DashboardComponent);
  fixture.detectChanges();
  return { component: fixture.componentInstance };
}

describe('DashboardComponent', () => {
  afterEach(() => TestBed.resetTestingModule());

  // ===== État initial =====

  describe('État initial', () => {
    it('démarre en état de chargement', () => {
      const { component } = setup();
      expect(component.isLoading()).toBe(true);
    });

    it('profile et rank sont null au départ', () => {
      const { component } = setup();
      expect(component.profile()).toBeNull();
      expect(component.rank()).toBeNull();
    });
  });

  // ===== Chargement réussi =====

  describe('Chargement du profil', () => {
    it('passe isLoading à false après la réception du profil', () => {
      const { component } = setup({ profileResult: MOCK_PROFILE });
      expect(component.isLoading()).toBe(false);
    });

    it('set le profil après réception', () => {
      const { component } = setup({ profileResult: MOCK_PROFILE });
      expect(component.profile()?.username).toBe('Mazlai');
    });

    it('set le rang après réception', () => {
      const { component } = setup({ profileResult: MOCK_PROFILE, rankResult: 42 });
      expect(component.rank()).toBe(42);
    });
  });

  // ===== Chemin d'erreur =====

  describe('Gestion des erreurs', () => {
    it('passe isLoading à false même si le profil échoue', () => {
      const { component } = setup({ profileResult: 'error' });
      expect(component.isLoading()).toBe(false);
    });

    it('rank reste null si l\'appel classement échoue (erreur silencieuse)', () => {
      const { component } = setup({ profileResult: MOCK_PROFILE, rankResult: 'error' });
      expect(component.rank()).toBeNull();
    });

    it('isLoading ne reste pas à true en cas d\'erreur profil', () => {
      const { component } = setup({ profileResult: 'error', rankResult: 'never' });
      expect(component.isLoading()).toBe(false);
    });
  });
});