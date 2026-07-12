import { TestBed } from '@angular/core/testing';
import { Subject, throwError } from 'rxjs';
import { ServersComponent } from './servers.component';
import { ServersService } from '../../core/services/servers.service';
import type { DiscordServer, BotStatus } from '../../core/models/servers.model';

function makeServer(overrides: Partial<DiscordServer> & { id: string }): DiscordServer {
  return {
    name: overrides.id,
    icon: null,
    owner: false,
    member_count: 100,
    bot_present: false,
    invite_url: null,
    ...overrides,
  };
}

function setup() {
  const botStatusSubject  = new Subject<BotStatus>();
  const serversSubject    = new Subject<DiscordServer[]>();

  const mockService = {
    getBotStatus:  vi.fn().mockReturnValue(botStatusSubject.asObservable()),
    getMyServers: vi.fn().mockReturnValue(serversSubject.asObservable()),
  };

  TestBed.configureTestingModule({
    imports: [ServersComponent],
    providers: [{ provide: ServersService, useValue: mockService }],
  });
  const fixture = TestBed.createComponent(ServersComponent);
  fixture.detectChanges();

  return {
    component: fixture.componentInstance,
    botStatusSubject,
    serversSubject,
    mockService,
  };
}

describe('ServersComponent', () => {
  afterEach(() => TestBed.resetTestingModule());

  // ===== presentCount() =====

  describe('presentCount()', () => {
    it('compte uniquement les serveurs où bot_present est true', () => {
      const { component } = setup();
      component.servers.set([
        makeServer({ id: 's1', bot_present: true }),
        makeServer({ id: 's2', bot_present: false }),
        makeServer({ id: 's3', bot_present: true }),
        makeServer({ id: 's4', bot_present: false }),
      ]);
      expect(component.presentCount()).toBe(2);
    });

    it('retourne 0 si aucun serveur n\'a le bot', () => {
      const { component } = setup();
      component.servers.set([makeServer({ id: 's1' }), makeServer({ id: 's2' })]);
      expect(component.presentCount()).toBe(0);
    });
  });

  // ===== getBotStatus() — fallback silencieux =====

  describe('getBotStatus() — fallback silencieux sur erreur', () => {
    it('set botStatus avec online:false en cas d\'erreur sans déclencher hasError', () => {
      const mockService = {
        getBotStatus: vi.fn().mockReturnValue(throwError(() => new Error('Bot offline'))),
        getMyServers: vi.fn().mockReturnValue(new Subject().asObservable()),
      };
      TestBed.configureTestingModule({
        imports: [ServersComponent],
        providers: [{ provide: ServersService, useValue: mockService }],
      });
      const fixture = TestBed.createComponent(ServersComponent);
      fixture.detectChanges();
      const component = fixture.componentInstance;

      expect(component.botStatus()).toEqual({ online: false, username: null, bot_id: null });
      expect(component.hasError()).toBe(false);
    });

    it('set botStatus à partir de la réponse API quand elle réussit', () => {
      const { component, botStatusSubject } = setup();
      botStatusSubject.next({ online: true, username: 'MazBot#0001', bot_id: '987654' });
      expect(component.botStatus()?.online).toBe(true);
      expect(component.botStatus()?.username).toBe('MazBot#0001');
    });
  });

  // ===== Flux serveurs =====

  describe('Chargement des serveurs', () => {
    it('set les serveurs et passe isLoading à false', () => {
      const { component, serversSubject } = setup();
      serversSubject.next([makeServer({ id: 's1' }), makeServer({ id: 's2' })]);
      expect(component.servers()).toHaveLength(2);
      expect(component.isLoading()).toBe(false);
    });

    it('passe hasError à true en cas d\'erreur sur getMyServers', () => {
      const mockService = {
        getBotStatus:  vi.fn().mockReturnValue(new Subject().asObservable()),
        getMyServers: vi.fn().mockReturnValue(throwError(() => new Error('API error'))),
      };
      TestBed.configureTestingModule({
        imports: [ServersComponent],
        providers: [{ provide: ServersService, useValue: mockService }],
      });
      const fixture = TestBed.createComponent(ServersComponent);
      fixture.detectChanges();
      const component = fixture.componentInstance;

      expect(component.hasError()).toBe(true);
      expect(component.isLoading()).toBe(false);
    });
  });

  // ===== fmtCount() =====

  describe('fmtCount()', () => {
    it('retourne "0" quand la valeur est null', () => {
      const { component } = setup();
      expect(component.fmtCount(null)).toBe('0');
    });

    it('retourne "0" quand la valeur est 0', () => {
      const { component } = setup();
      expect(component.fmtCount(0)).toBe('0');
    });

    it('formate en K pour les milliers', () => {
      const { component } = setup();
      expect(component.fmtCount(1500)).toBe('1.5K');
    });

    it('formate en M pour les millions', () => {
      const { component } = setup();
      expect(component.fmtCount(2_000_000)).toBe('2.0M');
    });
  });

  // ===== openInvite() — sécurité noopener,noreferrer =====

  describe('openInvite()', () => {
    it('ouvre l\'URL avec _blank et noopener,noreferrer', () => {
      const { component } = setup();
      const openSpy = vi.spyOn(window, 'open').mockReturnValue(null as unknown as Window);
      component.openInvite('https://discord.com/invite/abc123');
      expect(openSpy).toHaveBeenCalledWith('https://discord.com/invite/abc123', '_blank', 'noopener,noreferrer');
      openSpy.mockRestore();
    });
  });
});
