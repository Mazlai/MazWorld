import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { RecordsService } from './records.service';

describe('Consultation des records personnels', () => {
  afterEach(() => {
    TestBed.inject(HttpTestingController).verify();
    TestBed.resetTestingModule();
  });

  it('récupère les records via GET /api/records', () => {
    TestBed.configureTestingModule({
      providers: [RecordsService, provideHttpClient(), provideHttpClientTesting()],
    });

    TestBed.inject(RecordsService).getMyRecords().subscribe();

    const req = TestBed.inject(HttpTestingController).expectOne(r => r.url.includes('/api/records'));
    expect(req.request.method).toBe('GET');
    req.flush({
      coins: { current: 0, rank: 0, total_users: 0, percentile: 0 },
      exploration: { visited_count: 0, total_cities: 0, cities: [] },
      collection: { inventory_count: 0, badges_count: 0, recent_item: null },
      activity: { joined_at: '', last_activity: '', days_active: 0 },
    });
  });
});
