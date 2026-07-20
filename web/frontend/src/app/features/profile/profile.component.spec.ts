import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, NEVER, throwError } from 'rxjs';
import { ProfileComponent } from './profile.component';
import { AuthService } from '../../core/services/auth.service';
import { ProfileService } from '../../core/services/profile.service';
import type { UserProfile } from '../../core/models/profile.model';

const PROFIL_MAZLAI: UserProfile = {
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

function authMockConnecte() {
  return {
    isAuthenticated: vi.fn().mockReturnValue(true),
    currentUser: vi.fn().mockReturnValue({ username: 'Mazlai' }),
    userAvatar: vi.fn().mockReturnValue(null),
    displayName: vi.fn().mockReturnValue('Mazlai'),
    isLoading: vi.fn().mockReturnValue(false),
  };
}

function monterProfil(reponse: 'never' | UserProfile | 'error' = 'never') {
  const profilObs =
    reponse === 'never' ? NEVER
    : reponse === 'error' ? throwError(() => new Error('API error'))
    : of(reponse);

  TestBed.configureTestingModule({
    imports: [ProfileComponent],
    providers: [
      provideRouter([]),
      { provide: AuthService, useValue: authMockConnecte() },
      { provide: ProfileService, useValue: { getMyProfile: vi.fn().mockReturnValue(profilObs) } },
    ],
  });
  const fixture = TestBed.createComponent(ProfileComponent);
  fixture.detectChanges();
  return { component: fixture.componentInstance };
}

afterEach(() => TestBed.resetTestingModule());

// Entre le montage du composant et la réponse de l'API, les computed signals doivent
// afficher des valeurs de repli propres plutôt que undefined/crash (écran de chargement).
describe('Avant que le profil ne soit chargé — valeurs de repli', () => {
  it('backgroundColor et backgroundName retombent sur les valeurs par défaut', () => {
    const { component } = monterProfil();

    expect(component.backgroundColor()).toBe('#2f3136');
    expect(component.backgroundName()).toBe('Défaut');
  });

  it('memberSince est une chaîne vide tant que la date d\'inscription n\'est pas connue', () => {
    expect(monterProfil().component.memberSince()).toBe('');
  });

  it('badgeSlots affiche 6 emplacements vides plutôt qu\'un tableau vide ou undefined', () => {
    const slots = monterProfil().component.badgeSlots();

    expect(slots).toHaveLength(6);
    expect(slots.every(s => s === null)).toBe(true);
  });
});

describe('Une fois le profil chargé', () => {
  it('reflète le background équipé (bg_blue) plutôt que la couleur par défaut', () => {
    const { component } = monterProfil(PROFIL_MAZLAI);

    expect(component.backgroundColor()).not.toBe('#2f3136');
    expect(typeof component.backgroundColor()).toBe('string');
  });

  it('affiche le nom du background équipé plutôt que "Défaut"', () => {
    expect(monterProfil(PROFIL_MAZLAI).component.backgroundName()).not.toBe('Défaut');
  });

  it('formate la date d\'inscription en français', () => {
    const { component } = monterProfil(PROFIL_MAZLAI);

    expect(component.memberSince()).toContain('janvier');
    expect(component.memberSince()).toContain('2024');
  });

  it('place les badges équipés dans l\'ordre, laisse les slots restants vides', () => {
    const slots = monterProfil(PROFIL_MAZLAI).component.badgeSlots();

    expect(slots).toHaveLength(6);
    expect(slots[0]).toBe('badge_star');
    expect(slots[1]).toBe('badge_verified');
    expect(slots[2]).toBeNull();
  });
});

describe('États de chargement et d\'erreur', () => {
  it('sort de l\'état de chargement en cas de succès', () => {
    expect(monterProfil(PROFIL_MAZLAI).component.isLoading()).toBe(false);
  });

  it('sort aussi de l\'état de chargement en cas d\'échec (pas de blocage indéfini)', () => {
    expect(monterProfil('error').component.isLoading()).toBe(false);
  });

  it('hasError se déclenche sur un échec réel de l\'API', () => {
    expect(monterProfil('error').component.hasError()).toBe(true);
  });

  it('hasError reste false quand le chargement réussit', () => {
    expect(monterProfil(PROFIL_MAZLAI).component.hasError()).toBe(false);
  });
});

it('load() réarme isLoading et efface hasError pour permettre un nouvel essai après échec', () => {
  const { component } = monterProfil('error');
  expect(component.hasError()).toBe(true);
  expect(component.isLoading()).toBe(false);

  // Le joueur clique sur "Réessayer" : le service est réinterrogé, réponse pas encore arrivée.
  const profileServiceMock = TestBed.inject(ProfileService);
  (profileServiceMock.getMyProfile as ReturnType<typeof vi.fn>).mockReturnValue(NEVER);

  component.load();

  expect(component.isLoading()).toBe(true);
  expect(component.hasError()).toBe(false);
});
