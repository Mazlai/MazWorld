import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { lastValueFrom } from 'rxjs';
import { ProfileService } from './profile.service';
import type { UserProfile } from '../models/profile.model';

const PROFIL_MAZLAI: UserProfile = {
  user_id: '123456',
  username: 'Mazlai',
  discord_avatar: 'avatar_hash',
  coins: 500,
  equipped_background: 'bg_blue',
  equipped_badges: ['badge_star'],
  current_city: 'willowbrook',
  current_city_name: 'Willowbrook',
  traveling_to: null,
  arrival_time: null,
  created_at: '2024-01-15T00:00:00Z',
  visited_cities_count: 3,
  inventory_count: 7,
};

function monterService() {
  TestBed.configureTestingModule({
    providers: [ProfileService, provideHttpClient(), provideHttpClientTesting()],
  });
  return {
    service: TestBed.inject(ProfileService),
    httpMock: TestBed.inject(HttpTestingController),
  };
}

describe('getMyProfile() — GET /api/profile/me', () => {
  afterEach(() => {
    TestBed.inject(HttpTestingController).verify();
    TestBed.resetTestingModule();
  });

  it('interroge le bon endpoint en GET', () => {
    const { httpMock } = monterService();
    TestBed.inject(ProfileService).getMyProfile().subscribe();

    const req = httpMock.expectOne(r => r.url.includes('/api/profile/me'));
    expect(req.request.method).toBe('GET');
    req.flush({ profile: PROFIL_MAZLAI });
  });

  // La réponse API est enveloppée dans { profile: {...} } — le service doit déballer
  // cette enveloppe pour que les composants consomment directement le profil, sans avoir
  // à connaître ce détail de format de réponse à chaque appel.
  it('déballe le champ profile de la réponse plutôt que de le laisser imbriqué', async () => {
    const { service, httpMock } = monterService();
    const promesse = lastValueFrom(service.getMyProfile());

    httpMock.expectOne(r => r.url.includes('/api/profile/me')).flush({ profile: PROFIL_MAZLAI });

    const resultat = await promesse;
    expect(resultat.username).toBe('Mazlai');
    expect(resultat.coins).toBe(500);
    expect((resultat as unknown as { profile?: unknown }).profile).toBeUndefined();
  });

  it('propage une erreur HTTP au lieu de renvoyer un profil vide silencieusement', async () => {
    const { service, httpMock } = monterService();
    const promesse = lastValueFrom(service.getMyProfile());

    httpMock.expectOne(r => r.url.includes('/api/profile/me')).flush('Not found', { status: 404, statusText: 'Not Found' });

    await expect(promesse).rejects.toBeDefined();
  });
});
