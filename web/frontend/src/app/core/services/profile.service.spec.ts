import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { lastValueFrom } from 'rxjs';
import { ProfileService } from './profile.service';
import type { UserProfile } from '../models/profile.model';

const MOCK_PROFILE: UserProfile = {
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

function setup() {
  TestBed.configureTestingModule({
    providers: [ProfileService, provideHttpClient(), provideHttpClientTesting()],
  });
  return {
    service: TestBed.inject(ProfileService),
    httpMock: TestBed.inject(HttpTestingController),
  };
}

describe('ProfileService', () => {
  afterEach(() => {
    TestBed.inject(HttpTestingController).verify();
    TestBed.resetTestingModule();
  });

  describe('getMyProfile()', () => {
    it('envoie une requête GET vers /api/profile/me', () => {
      const { httpMock } = setup();
      TestBed.inject(ProfileService).getMyProfile().subscribe();

      const req = httpMock.expectOne(r => r.url.includes('/api/profile/me'));
      expect(req.request.method).toBe('GET');
      req.flush({ profile: MOCK_PROFILE });
    });

    it('extrait res.profile de la réponse enveloppée (mapping)', async () => {
      const { service, httpMock } = setup();
      const promise = lastValueFrom(service.getMyProfile());

      httpMock.expectOne(r => r.url.includes('/api/profile/me'))
        .flush({ profile: MOCK_PROFILE });

      const result = await promise;
      expect(result.username).toBe('Mazlai');
      expect(result.coins).toBe(500);
      expect((result as unknown as { profile?: unknown }).profile).toBeUndefined();
    });

    it('propage les erreurs HTTP au subscriber', async () => {
      const { service, httpMock } = setup();
      const promise = lastValueFrom(service.getMyProfile());

      httpMock.expectOne(r => r.url.includes('/api/profile/me'))
        .flush('Not found', { status: 404, statusText: 'Not Found' });

      await expect(promise).rejects.toBeDefined();
    });
  });
});
