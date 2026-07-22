import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { ServersService } from './servers.service';

function monterService() {
  TestBed.configureTestingModule({
    providers: [ServersService, provideHttpClient(), provideHttpClientTesting()],
  });
  return {
    service: TestBed.inject(ServersService),
    httpMock: TestBed.inject(HttpTestingController),
  };
}

describe('Page "Mes serveurs"', () => {
  afterEach(() => {
    TestBed.inject(HttpTestingController).verify();
    TestBed.resetTestingModule();
  });

  it('liste les serveurs Discord du joueur via GET /api/servers', () => {
    const { service, httpMock } = monterService();
    service.getMyServers().subscribe();

    const req = httpMock.expectOne(r => r.url.includes('/api/servers'));
    expect(req.request.method).toBe('GET');
    req.flush([]);
  });

  it('récupère le statut de présence du bot via GET /api/bot/status, indépendamment de la liste des serveurs', () => {
    const { service, httpMock } = monterService();
    service.getBotStatus().subscribe();

    const req = httpMock.expectOne(r => r.url.includes('/api/bot/status'));
    expect(req.request.method).toBe('GET');
    req.flush({ online: true, username: 'MazWorld', bot_id: '1' });
  });
});
