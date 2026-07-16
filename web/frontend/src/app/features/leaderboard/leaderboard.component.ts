import { Component, OnInit, signal, computed, inject, ChangeDetectionStrategy } from '@angular/core';
import { LeaderboardService } from '../../core/services/leaderboard.service';
import type { LeaderboardEntry } from '../../core/models/leaderboard.model';

@Component({
  selector: 'app-leaderboard',
  standalone: true,
  imports: [],
  templateUrl: './leaderboard.component.html',
  styleUrl: './leaderboard.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LeaderboardComponent implements OnInit {
  private readonly leaderboardService = inject(LeaderboardService);

  readonly entries = signal<LeaderboardEntry[]>([]);
  readonly isLoading = signal(true);
  readonly hasError = signal(false);
  readonly currentPage = signal(1);
  readonly totalEntries = signal(0);
  readonly userRank = signal<number | null>(null);

  readonly limit = 20;

  readonly totalPages = computed(() => Math.ceil(this.totalEntries() / this.limit));
  readonly hasPrev = computed(() => this.currentPage() > 1);
  readonly hasNext = computed(() => this.currentPage() < this.totalPages());

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.isLoading.set(true);
    this.hasError.set(false);
    this.leaderboardService.getLeaderboard('coins', this.currentPage(), this.limit).subscribe({
      next: ({ entries, total, user_rank }) => {
        this.entries.set(entries);
        this.totalEntries.set(total);
        if (user_rank != null) this.userRank.set(user_rank);
        this.isLoading.set(false);
      },
      error: () => {
        this.hasError.set(true);
        this.isLoading.set(false);
      },
    });
  }

  prevPage(): void {
    if (this.hasPrev()) {
      this.currentPage.update(p => p - 1);
      this.load();
    }
  }

  nextPage(): void {
    if (this.hasNext()) {
      this.currentPage.update(p => p + 1);
      this.load();
    }
  }

  getRankEmoji(rank: number): string {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return `#${rank}`;
  }

  getRankClass(rank: number): string {
    if (rank === 1) return 'row--gold';
    if (rank === 2) return 'row--silver';
    if (rank === 3) return 'row--bronze';
    return '';
  }

  getAvatarUrl(entry: LeaderboardEntry): string {
    if (entry.avatar) {
      return `https://cdn.discordapp.com/avatars/${entry.discord_id}/${entry.avatar}.png?size=64`;
    }
    return 'https://cdn.discordapp.com/embed/avatars/0.png';
  }
}
