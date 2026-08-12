import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { StatsService } from './stats.service';

describe('Dashboard admin — statistiques globales', () => {
  afterEach(() => {
    TestBed.inject(HttpTestingController).verify();
    TestBed.resetTestingModule();
  });

  it('récupère les statistiques via GET /api/stats', () => {
    TestBed.configureTestingModule({
      providers: [StatsService, provideHttpClient(), provideHttpClientTesting()],
    });

    TestBed.inject(StatsService).getAllStats().subscribe();

    const req = TestBed.inject(HttpTestingController).expectOne(r => r.url.includes('/api/stats'));
    expect(req.request.method).toBe('GET');
    req.flush({
      global: { total_users: 0, total_cities: 0, total_coins_circulation: 0, active_users_today: 0, active_users_week: 0 },
      economy: { average_coins_per_user: 0, richest_user_coins: 0, total_shop_purchases: 0, most_popular_item: '' },
    });
  });
});
