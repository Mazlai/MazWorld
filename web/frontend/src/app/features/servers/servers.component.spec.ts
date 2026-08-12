import { TestBed } from '@angular/core/testing';
import { Subject, throwError } from 'rxjs';
import { ServersComponent } from './servers.component';
import { ServersService } from '../../core/services/servers.service';
import type { DiscordServer, BotStatus } from '../../core/models/servers.model';

function serveurDiscord(overrides: Partial<DiscordServer> & { id: string }): DiscordServer {
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

function monterAvecService(service: Pick<ServersService, 'getBotStatus' | 'getMyServers'>) {
  TestBed.configureTestingModule({
    imports: [ServersComponent],
    providers: [{ provide: ServersService, useValue: service }],
  });
  const fixture = TestBed.createComponent(ServersComponent);
  fixture.detectChanges();
  return { component: fixture.componentInstance };
}

function monterPage() {
  const botStatus$ = new Subject<BotStatus>();
  const servers$ = new Subject<DiscordServer[]>();
  const serviceMock = {
    getBotStatus: vi.fn().mockReturnValue(botStatus$.asObservable()),
    getMyServers: vi.fn().mockReturnValue(servers$.asObservable()),
  };

  return { ...monterAvecService(serviceMock), botStatus$, servers$, serviceMock };
}

afterEach(() => TestBed.resetTestingModule());

it('presentCount() ne compte que les serveurs où le bot est effectivement présent', () => {
  const { component } = monterPage();
  component.servers.set([
    serveurDiscord({ id: 's1', bot_present: true }),
    serveurDiscord({ id: 's2', bot_present: false }),
    serveurDiscord({ id: 's3', bot_present: true }),
    serveurDiscord({ id: 's4', bot_present: false }),
  ]);

  expect(component.presentCount()).toBe(2);
});

describe('Statut du bot — l\'API bot/status peut échouer sans casser la page', () => {
  it('retombe sur un statut "hors ligne" plutôt que de déclencher hasError si l\'appel échoue', () => {
    const { component } = monterAvecService({
      getBotStatus: vi.fn().mockReturnValue(throwError(() => new Error('Bot offline'))),
      getMyServers: vi.fn().mockReturnValue(new Subject().asObservable()),
    });

    expect(component.botStatus()).toEqual({ online: false, username: null, bot_id: null });
    expect(component.hasError()).toBe(false);
  });

  it('reflète le vrai statut une fois la réponse reçue', () => {
    const { component, botStatus$ } = monterPage();

    botStatus$.next({ online: true, username: 'MazBot#0001', bot_id: '987654' });

    expect(component.botStatus()?.online).toBe(true);
    expect(component.botStatus()?.username).toBe('MazBot#0001');
  });
});

describe('Chargement de la liste des serveurs', () => {
  it('affiche les serveurs reçus et sort de l\'état de chargement', () => {
    const { component, servers$ } = monterPage();

    servers$.next([serveurDiscord({ id: 's1' }), serveurDiscord({ id: 's2' })]);

    expect(component.servers()).toHaveLength(2);
    expect(component.isLoading()).toBe(false);
  });

  it('déclenche hasError (contrairement au statut bot) si /api/servers échoue', () => {
    const { component } = monterAvecService({
      getBotStatus: vi.fn().mockReturnValue(new Subject().asObservable()),
      getMyServers: vi.fn().mockReturnValue(throwError(() => new Error('API error'))),
    });

    expect(component.hasError()).toBe(true);
    expect(component.isLoading()).toBe(false);
  });
});

it('fmtCount() traite null et 0 comme un simple "0", puis abrège en K/M au-delà', () => {
  const { component } = monterPage();

  expect(component.fmtCount(null)).toBe('0');
  expect(component.fmtCount(0)).toBe('0');
  expect(component.fmtCount(1500)).toBe('1.5K');
  expect(component.fmtCount(2_000_000)).toBe('2.0M');
});

// noopener,noreferrer empêche la page ouverte (l'invite Discord) d'accéder à window.opener —
// une négligence classique lors de l'ouverture de liens externes en nouvel onglet.
it('openInvite() ouvre le lien Discord avec les protections noopener/noreferrer', () => {
  const { component } = monterPage();
  const openSpy = vi.spyOn(window, 'open').mockReturnValue(null as unknown as Window);

  component.openInvite('https://discord.com/invite/abc123');

  expect(openSpy).toHaveBeenCalledWith('https://discord.com/invite/abc123', '_blank', 'noopener,noreferrer');
  openSpy.mockRestore();
});
