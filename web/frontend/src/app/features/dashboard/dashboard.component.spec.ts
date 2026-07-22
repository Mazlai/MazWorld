import { TestBed } from '@angular/core/testing';
import { of, throwError, NEVER } from 'rxjs';
import { DashboardComponent } from './dashboard.component';
import { AuthService } from '../../core/services/auth.service';
import { ProfileService } from '../../core/services/profile.service';
import { LeaderboardService } from '../../core/services/leaderboard.service';
import type { UserProfile } from '../../core/models/profile.model';

const PROFIL_MAZLAI: UserProfile = {
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

function authMockConnecte() {
  return {
    isAuthenticated: vi.fn().mockReturnValue(true),
    currentUser: vi.fn().mockReturnValue({ username: 'Mazlai' }),
    userAvatar: vi.fn().mockReturnValue(null),
    displayName: vi.fn().mockReturnValue('Mazlai'),
    isLoading: vi.fn().mockReturnValue(false),
  };
}

function monterDashboard(reponses: {
  profil?: 'never' | UserProfile | 'error';
  rang?: 'never' | number | 'error';
} = {}) {
  const profilObs =
    reponses.profil === undefined || reponses.profil === 'never' ? NEVER
    : reponses.profil === 'error' ? throwError(() => new Error('Profile error'))
    : of(reponses.profil);

  const rangObs =
    reponses.rang === undefined || reponses.rang === 'never' ? NEVER
    : reponses.rang === 'error' ? throwError(() => new Error('Rank error'))
    : of({ rank: reponses.rang });

  TestBed.configureTestingModule({
    imports: [DashboardComponent],
    providers: [
      { provide: AuthService, useValue: authMockConnecte() },
      { provide: ProfileService, useValue: { getMyProfile: vi.fn().mockReturnValue(profilObs) } },
      { provide: LeaderboardService, useValue: { getMyRank: vi.fn().mockReturnValue(rangObs) } },
    ],
  });
  const fixture = TestBed.createComponent(DashboardComponent);
  fixture.detectChanges();
  return { component: fixture.componentInstance };
}

afterEach(() => TestBed.resetTestingModule());

describe('Avant la réponse de l\'API (état initial)', () => {
  it('démarre en état de chargement', () => {
    expect(monterDashboard().component.isLoading()).toBe(true);
  });

  it('profil et rang sont null tant que rien n\'est encore arrivé', () => {
    const { component } = monterDashboard();

    expect(component.profile()).toBeNull();
    expect(component.rank()).toBeNull();
  });
});

describe('Chargement réussi du profil et du classement', () => {
  it('sort de l\'état de chargement dès que le profil arrive', () => {
    expect(monterDashboard({ profil: PROFIL_MAZLAI }).component.isLoading()).toBe(false);
  });

  it('affiche le profil reçu', () => {
    expect(monterDashboard({ profil: PROFIL_MAZLAI }).component.profile()?.username).toBe('Mazlai');
  });

  it('affiche le rang reçu', () => {
    expect(monterDashboard({ profil: PROFIL_MAZLAI, rang: 42 }).component.rank()).toBe(42);
  });
});

// Le dashboard mélange une donnée essentielle (le profil, sans quoi la page n'a pas de sens)
// et une donnée secondaire (le rang, un simple bonus d'affichage) — elles doivent donc être
// traitées différemment en cas d'échec : l'une bloque le chargement, l'autre reste silencieuse.
describe('Panne API — le profil est bloquant, le classement ne l\'est pas', () => {
  it('sort quand même de l\'état de chargement si le profil échoue', () => {
    expect(monterDashboard({ profil: 'error' }).component.isLoading()).toBe(false);
  });

  it('le rang reste simplement null si son appel échoue, sans faire planter le dashboard', () => {
    expect(monterDashboard({ profil: PROFIL_MAZLAI, rang: 'error' }).component.rank()).toBeNull();
  });

  it('ne reste pas bloqué en chargement même si le profil échoue et que le rang ne répond jamais', () => {
    expect(monterDashboard({ profil: 'error', rang: 'never' }).component.isLoading()).toBe(false);
  });
});
