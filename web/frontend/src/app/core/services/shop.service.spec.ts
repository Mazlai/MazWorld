import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { lastValueFrom } from 'rxjs';
import { ShopService } from './shop.service';

function monterService() {
  TestBed.configureTestingModule({
    providers: [ShopService, provideHttpClient(), provideHttpClientTesting()],
  });
  return {
    service: TestBed.inject(ShopService),
    httpMock: TestBed.inject(HttpTestingController),
  };
}

describe('Catalogue de la boutique', () => {
  afterEach(() => {
    TestBed.inject(HttpTestingController).verify();
    TestBed.resetTestingModule();
  });

  it('liste les items via GET /api/shop', () => {
    const { service, httpMock } = monterService();
    service.getShopItems().subscribe();

    const req = httpMock.expectOne(r => r.url.includes('/api/shop'));
    expect(req.request.method).toBe('GET');
    req.flush({ items: [], user_coins: 0 });
  });
});

// Les trois méthodes suivantes postent toutes un renommage camelCase → snake_case
// vers le backend Symfony ; on vérifie chaque forme de payload séparément.
describe('Achat et équipement — payloads snake_case', () => {
  afterEach(() => {
    TestBed.inject(HttpTestingController).verify();
    TestBed.resetTestingModule();
  });

  it('achète un item avec item_id dans le corps', () => {
    const { service, httpMock } = monterService();
    service.purchaseItem('bg_ocean').subscribe();

    const req = httpMock.expectOne(r => r.url.includes('/api/shop/purchase'));
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ item_id: 'bg_ocean' });
    req.flush({ success: true, message: 'ok', new_balance: 0, item: {} });
  });

  it('rejette la promesse quand l\'achat échoue côté serveur (solde insuffisant, 402)', async () => {
    const { service, httpMock } = monterService();
    const promesse = lastValueFrom(service.purchaseItem('bg_ocean'));

    httpMock.expectOne(r => r.url.includes('/api/shop/purchase')).flush('Payment Required', { status: 402, statusText: 'Payment Required' });

    await expect(promesse).rejects.toBeDefined();
  });

  it('équipe un background avec item_id dans le corps', () => {
    const { service, httpMock } = monterService();
    service.equipBackground('bg_ocean').subscribe();

    const req = httpMock.expectOne(r => r.url.includes('/api/profile/equip/background'));
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ item_id: 'bg_ocean' });
    req.flush({ success: true, message: 'ok' });
  });

  it('équipe un badge avec badge_id et slot dans le corps', () => {
    const { service, httpMock } = monterService();
    service.equipBadge('badge_founder', 1).subscribe();

    const req = httpMock.expectOne(r => r.url.includes('/api/profile/equip/badge'));
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ badge_id: 'badge_founder', slot: 1 });
    req.flush({ success: true, message: 'ok' });
  });
});
