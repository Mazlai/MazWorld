import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { lastValueFrom } from 'rxjs';
import { InventoryService } from './inventory.service';

function monterService() {
  TestBed.configureTestingModule({
    providers: [InventoryService, provideHttpClient(), provideHttpClientTesting()],
  });
  return {
    service: TestBed.inject(InventoryService),
    httpMock: TestBed.inject(HttpTestingController),
  };
}

describe('Consultation de l\'inventaire', () => {
  afterEach(() => {
    TestBed.inject(HttpTestingController).verify();
    TestBed.resetTestingModule();
  });

  it('récupère l\'inventaire via GET /api/inventory', () => {
    const { service, httpMock } = monterService();
    service.getInventory().subscribe();

    const req = httpMock.expectOne(r => r.url.includes('/api/inventory'));
    expect(req.request.method).toBe('GET');
    req.flush({ items: [], equipped_background: null, equipped_badges: {}, user_coins: 0 });
  });

  it('propage une erreur HTTP au lieu de l\'avaler silencieusement (ex. session expirée)', async () => {
    const { service, httpMock } = monterService();
    const promesse = lastValueFrom(service.getInventory());

    httpMock.expectOne(r => r.url.includes('/api/inventory')).flush('Unauthorized', { status: 401, statusText: 'Unauthorized' });

    await expect(promesse).rejects.toBeDefined();
  });
});

// Le backend attend du snake_case (item_id, badge_id) alors que le code TS manipule
// itemId/badgeId en camelCase — un renommage oublié ou mal orthographié à cet endroit
// casserait silencieusement l'appel API sans qu'aucune erreur de compilation ne le signale.
describe('Équipement d\'un item — renommage camelCase vers snake_case', () => {
  afterEach(() => {
    TestBed.inject(HttpTestingController).verify();
    TestBed.resetTestingModule();
  });

  it('équipe un background avec item_id dans le payload', () => {
    const { service, httpMock } = monterService();
    service.equipBackground('bg_ocean').subscribe();

    const req = httpMock.expectOne(r => r.url.includes('/api/profile/equip/background'));
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ item_id: 'bg_ocean' });
    req.flush({ success: true, message: 'ok' });
  });

  it('équipe un badge avec badge_id et slot dans le payload', () => {
    const { service, httpMock } = monterService();
    service.equipBadge('badge_founder', 2).subscribe();

    const req = httpMock.expectOne(r => r.url.includes('/api/profile/equip/badge'));
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ badge_id: 'badge_founder', slot: 2 });
    req.flush({ success: true, message: 'ok' });
  });

  it('déséquipe un badge en indiquant simplement le numéro de slot', () => {
    const { service, httpMock } = monterService();
    service.unequipBadge(3).subscribe();

    const req = httpMock.expectOne(r => r.url.includes('/api/profile/unequip/badge'));
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ slot: 3 });
    req.flush({ success: true, message: 'ok' });
  });

  // Un slot 0 est une valeur valide (premier emplacement), pas une absence de valeur —
  // vérifier qu'il n'est pas perdu en route par un test du style `if (slot)` côté service.
  it('transmet bien le slot 0 (premier emplacement), pas seulement les slots > 0', () => {
    const { service, httpMock } = monterService();
    service.unequipBadge(0).subscribe();

    const req = httpMock.expectOne(r => r.url.includes('/api/profile/unequip/badge'));
    expect(req.request.body).toEqual({ slot: 0 });
    req.flush({ success: true, message: 'ok' });
  });
});
