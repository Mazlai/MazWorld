import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { TravelService } from './travel.service';

function monterService() {
  TestBed.configureTestingModule({
    providers: [TravelService, provideHttpClient(), provideHttpClientTesting()],
  });
  return {
    service: TestBed.inject(TravelService),
    httpMock: TestBed.inject(HttpTestingController),
  };
}

describe('Chargement des données de la carte du monde', () => {
  afterEach(() => {
    TestBed.inject(HttpTestingController).verify();
    TestBed.resetTestingModule();
  });

  it('récupère la liste des villes via GET /api/cities', () => {
    const { service, httpMock } = monterService();
    service.getAllCities().subscribe();

    const req = httpMock.expectOne(r => r.url.includes('/api/cities'));
    expect(req.request.method).toBe('GET');
    req.flush([]);
  });

  it('récupère la liste des routes via GET /api/routes', () => {
    const { service, httpMock } = monterService();
    service.getAllRoutes().subscribe();

    const req = httpMock.expectOne(r => r.url.includes('/api/routes'));
    expect(req.request.method).toBe('GET');
    req.flush([]);
  });

  it('récupère l\'état complet de la carte (ville actuelle + routes + métiers) via GET /api/travel/map', () => {
    const { service, httpMock } = monterService();
    service.getMap().subscribe();

    const req = httpMock.expectOne(r => r.url.includes('/api/travel/map'));
    expect(req.request.method).toBe('GET');
    req.flush({
      current_city: { city_id: 'willowbrook', name: 'Willowbrook', description: '', emoji: '', theme: '' },
      coins: 0,
      routes: [],
      jobs: [],
    });
  });
});

describe('Suivi d\'un voyage en cours', () => {
  afterEach(() => {
    TestBed.inject(HttpTestingController).verify();
    TestBed.resetTestingModule();
  });

  it('récupère le statut de voyage via GET /api/travel/status', () => {
    const { service, httpMock } = monterService();
    service.getStatus().subscribe();

    const req = httpMock.expectOne(r => r.url.includes('/api/travel/status'));
    expect(req.request.method).toBe('GET');
    req.flush({ traveling: false });
  });

  // Le backend attend destination_id (snake_case) alors que le paramètre TS est destinationId :
  // même risque de faute de frappe silencieuse que côté ShopService/InventoryService.
  it('démarre un voyage en renommant destinationId → destination_id dans le payload', () => {
    const { service, httpMock } = monterService();
    service.startTravel('riverside').subscribe();

    const req = httpMock.expectOne(r => r.url.includes('/api/travel/start'));
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ destination_id: 'riverside' });
    req.flush({ success: true, message: 'ok' });
  });
});
