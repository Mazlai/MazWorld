import { TestBed } from '@angular/core/testing';
import { Subject } from 'rxjs';
import { LeaderboardComponent } from './leaderboard.component';
import { LeaderboardService } from '../../core/services/leaderboard.service';
import type { LeaderboardEntry, LeaderboardResponse } from '../../core/models/leaderboard.model';

function makeEntry(rank: number, avatar: string | null = null): LeaderboardEntry {
  return { rank, discord_id: `id_${rank}`, username: `User${rank}`, avatar, coins: 1000 - rank * 10 };
}

function setup() {
  const subject = new Subject<LeaderboardResponse>();
  const mockService = { getLeaderboard: vi.fn().mockReturnValue(subject.asObservable()) };
  TestBed.configureTestingModule({
    imports: [LeaderboardComponent],
    providers: [{ provide: LeaderboardService, useValue: mockService }],
  });
  const fixture = TestBed.createComponent(LeaderboardComponent);
  fixture.detectChanges();
  return { component: fixture.componentInstance, mockService, subject };
}

describe('LeaderboardComponent', () => {
  afterEach(() => TestBed.resetTestingModule());

  // ===== getRankEmoji() =====

  describe('getRankEmoji()', () => {
    it('retourne 🥇 pour le rang 1', () => {
      const { component } = setup();
      expect(component.getRankEmoji(1)).toBe('🥇');
    });

    it('retourne 🥈 pour le rang 2', () => {
      const { component } = setup();
      expect(component.getRankEmoji(2)).toBe('🥈');
    });

    it('retourne 🥉 pour le rang 3', () => {
      const { component } = setup();
      expect(component.getRankEmoji(3)).toBe('🥉');
    });

    it('retourne #N pour les rangs supérieurs à 3', () => {
      const { component } = setup();
      expect(component.getRankEmoji(4)).toBe('#4');
      expect(component.getRankEmoji(42)).toBe('#42');
    });
  });

  // ===== getRankClass() =====

  describe('getRankClass()', () => {
    it('retourne les classes CSS correctes pour le podium', () => {
      const { component } = setup();
      expect(component.getRankClass(1)).toBe('row--gold');
      expect(component.getRankClass(2)).toBe('row--silver');
      expect(component.getRankClass(3)).toBe('row--bronze');
    });

    it('retourne une chaîne vide pour les rangs hors podium', () => {
      const { component } = setup();
      expect(component.getRankClass(4)).toBe('');
      expect(component.getRankClass(100)).toBe('');
    });
  });

  // ===== getAvatarUrl() =====

  describe('getAvatarUrl()', () => {
    it('retourne l\'URL CDN Discord quand avatar est défini', () => {
      const { component } = setup();
      const entry = makeEntry(1, 'avatar_hash');
      expect(component.getAvatarUrl(entry)).toContain('cdn.discordapp.com/avatars/id_1/avatar_hash.png');
    });

    it('retourne l\'URL de fallback quand avatar est null', () => {
      const { component } = setup();
      expect(component.getAvatarUrl(makeEntry(1, null))).toContain('cdn.discordapp.com/embed/avatars/0.png');
    });
  });

  // ===== hasPrev / hasNext / pagination =====

  describe('hasPrev() / hasNext()', () => {
    it('hasPrev est false quand on est à la page 1', () => {
      const { component } = setup();
      component.currentPage.set(1);
      component.totalEntries.set(40);
      expect(component.hasPrev()).toBe(false);
    });

    it('hasNext est true quand d\'autres pages existent', () => {
      const { component } = setup();
      component.currentPage.set(1);
      component.totalEntries.set(40);
      expect(component.hasNext()).toBe(true);
    });

    it('hasNext est false à la dernière page', () => {
      const { component } = setup();
      component.currentPage.set(2);
      component.totalEntries.set(40);
      expect(component.hasNext()).toBe(false);
    });

    it('hasPrev est true à partir de la page 2', () => {
      const { component } = setup();
      component.currentPage.set(2);
      component.totalEntries.set(40);
      expect(component.hasPrev()).toBe(true);
    });
  });

  // ===== prevPage() guard =====

  describe('prevPage() — garde hasPrev', () => {
    it('n\'appelle pas le service si hasPrev() est false', () => {
      const { component, mockService } = setup();
      component.currentPage.set(1);
      component.totalEntries.set(40);
      const callsBefore = mockService.getLeaderboard.mock.calls.length;

      component.prevPage();

      expect(mockService.getLeaderboard.mock.calls.length).toBe(callsBefore);
      expect(component.currentPage()).toBe(1);
    });
  });

  // ===== userRank — skip quand null =====

  describe('userRank — skip si user_rank est null/undefined', () => {
    it('ne modifie pas userRank si user_rank est undefined dans la réponse', () => {
      const { component, subject } = setup();
      // Premier appel : initialise userRank à 5
      subject.next({ entries: [makeEntry(1)], total: 1, page: 1, limit: 20, user_rank: 5 });
      expect(component.userRank()).toBe(5);

      // Deuxième appel : user_rank absent (undefined) → ne doit pas écraser 5
      subject.next({ entries: [makeEntry(1)], total: 1, page: 1, limit: 20 });
      expect(component.userRank()).toBe(5);
    });

    it('met à jour userRank si user_rank est un nombre valide', () => {
      const { component, subject } = setup();
      subject.next({ entries: [], total: 0, page: 1, limit: 20, user_rank: 12 });
      expect(component.userRank()).toBe(12);
    });
  });
});