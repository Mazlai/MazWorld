import { TestBed } from '@angular/core/testing';
import { Subject } from 'rxjs';
import { LeaderboardComponent } from './leaderboard.component';
import { LeaderboardService } from '../../core/services/leaderboard.service';
import type { LeaderboardEntry, LeaderboardResponse } from '../../core/models/leaderboard.model';

function entreeClassement(rang: number, avatar: string | null = null): LeaderboardEntry {
  return { rank: rang, discord_id: `id_${rang}`, username: `User${rang}`, avatar, coins: 1000 - rang * 10 };
}

function monterClassement() {
  const reponses = new Subject<LeaderboardResponse>();
  const serviceMock = { getLeaderboard: vi.fn().mockReturnValue(reponses.asObservable()) };
  TestBed.configureTestingModule({
    imports: [LeaderboardComponent],
    providers: [{ provide: LeaderboardService, useValue: serviceMock }],
  });
  const fixture = TestBed.createComponent(LeaderboardComponent);
  fixture.detectChanges();
  return { component: fixture.componentInstance, serviceMock, reponses };
}

afterEach(() => TestBed.resetTestingModule());

it('getRankEmoji() réserve les médailles au podium et bascule sur #N ensuite', () => {
  const { component } = monterClassement();

  expect(component.getRankEmoji(1)).toBe('🥇');
  expect(component.getRankEmoji(2)).toBe('🥈');
  expect(component.getRankEmoji(3)).toBe('🥉');
  expect(component.getRankEmoji(4)).toBe('#4');
  expect(component.getRankEmoji(42)).toBe('#42');
});

it('getRankClass() applique une classe CSS dorée/argentée/bronze uniquement au podium', () => {
  const { component } = monterClassement();

  expect(component.getRankClass(1)).toBe('row--gold');
  expect(component.getRankClass(2)).toBe('row--silver');
  expect(component.getRankClass(3)).toBe('row--bronze');
  expect(component.getRankClass(4)).toBe('');
  expect(component.getRankClass(100)).toBe('');
});

describe('getAvatarUrl()', () => {
  it('pointe vers le CDN Discord quand le joueur a un avatar personnalisé', () => {
    const { component } = monterClassement();

    expect(component.getAvatarUrl(entreeClassement(1, 'avatar_hash'))).toContain('cdn.discordapp.com/avatars/id_1/avatar_hash.png');
  });

  it('retombe sur l\'avatar Discord par défaut quand le joueur n\'en a pas défini', () => {
    const { component } = monterClassement();

    expect(component.getAvatarUrl(entreeClassement(1, null))).toContain('cdn.discordapp.com/embed/avatars/0.png');
  });
});

describe('Pagination — bornes hasPrev()/hasNext()', () => {
  it('n\'autorise pas de page précédente depuis la première page', () => {
    const { component } = monterClassement();
    component.currentPage.set(1);
    component.totalEntries.set(40);

    expect(component.hasPrev()).toBe(false);
    expect(component.hasNext()).toBe(true); // il reste bien d'autres pages à explorer
  });

  it('n\'autorise plus de page suivante une fois la dernière atteinte', () => {
    const { component } = monterClassement();
    component.currentPage.set(2);
    component.totalEntries.set(40);

    expect(component.hasNext()).toBe(false);
    expect(component.hasPrev()).toBe(true);
  });

  it('prevPage() n\'appelle pas l\'API quand on est déjà sur la première page', () => {
    const { component, serviceMock } = monterClassement();
    component.currentPage.set(1);
    component.totalEntries.set(40);
    const appelsAvant = serviceMock.getLeaderboard.mock.calls.length;

    component.prevPage();

    expect(serviceMock.getLeaderboard.mock.calls.length).toBe(appelsAvant);
    expect(component.currentPage()).toBe(1);
  });
});

// user_rank n'est présent dans la réponse API que si le rang du joueur courant a pu être
// calculé côté backend — quand il est absent d'un rafraîchissement (undefined, pas null),
// la valeur précédemment connue doit être conservée plutôt qu'écrasée par du vide.
describe('Rang du joueur courant — ne pas perdre la valeur sur une réponse partielle', () => {
  it('conserve le dernier rang connu si une réponse ultérieure ne renvoie pas user_rank', () => {
    const { component, reponses } = monterClassement();

    reponses.next({ entries: [entreeClassement(1)], total: 1, page: 1, limit: 20, user_rank: 5 });
    expect(component.userRank()).toBe(5);

    reponses.next({ entries: [entreeClassement(1)], total: 1, page: 1, limit: 20 });
    expect(component.userRank()).toBe(5);
  });

  it('met à jour le rang dès qu\'une valeur valide arrive', () => {
    const { component, reponses } = monterClassement();

    reponses.next({ entries: [], total: 0, page: 1, limit: 20, user_rank: 12 });

    expect(component.userRank()).toBe(12);
  });
});
