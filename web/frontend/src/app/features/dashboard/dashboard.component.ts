import { Component, OnInit, signal, inject, ChangeDetectionStrategy } from '@angular/core';
import { AuthService } from '../../core/services/auth.service';
import { ProfileService } from '../../core/services/profile.service';
import { LeaderboardService } from '../../core/services/leaderboard.service';
import { StatCardComponent } from '../../shared/components/ui/stat-card/stat-card.component';
import { AvatarComponent } from '../../shared/components/ui/avatar/avatar.component';
import type { UserProfile } from '../../core/models/profile.model';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [StatCardComponent, AvatarComponent],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardComponent implements OnInit {
  protected readonly auth = inject(AuthService);
  private readonly profileService = inject(ProfileService);
  private readonly leaderboardService = inject(LeaderboardService);

  readonly profile = signal<UserProfile | null>(null);
  readonly rank = signal<number | null>(null);
  readonly isLoading = signal(true);

  ngOnInit(): void {
    this.profileService.getMyProfile().subscribe({
      next: (p) => {
        this.profile.set(p);
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false),
    });

    this.leaderboardService.getMyRank().subscribe({
      next: ({ rank }) => this.rank.set(rank),
      error: () => {},
    });
  }
}
