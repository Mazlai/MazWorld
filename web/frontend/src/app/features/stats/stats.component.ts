import { Component, OnInit, signal, inject, ChangeDetectionStrategy } from '@angular/core';
import { StatsService } from '../../core/services/stats.service';
import { StatCardComponent } from '../../shared/components/ui/stat-card/stat-card.component';
import type { GlobalStats, EconomyStats } from '../../core/models/stats.model';

@Component({
  selector: 'app-stats',
  standalone: true,
  imports: [StatCardComponent],
  templateUrl: './stats.component.html',
  styleUrl: './stats.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StatsComponent implements OnInit {
  private readonly statsService = inject(StatsService);

  readonly globalStats = signal<GlobalStats | null>(null);
  readonly economyStats = signal<EconomyStats | null>(null);
  readonly isLoading = signal(true);
  readonly hasError = signal(false);

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.isLoading.set(true);
    this.hasError.set(false);
    this.statsService.getAllStats().subscribe({
      next: ({ global, economy }) => {
        this.globalStats.set(global);
        this.economyStats.set(economy);
        this.isLoading.set(false);
      },
      error: () => {
        this.hasError.set(true);
        this.isLoading.set(false);
      },
    });
  }

  fmt(value: number): string {
    if (value >= 1_000_000) return (value / 1_000_000).toFixed(1) + 'M';
    if (value >= 1_000) return (value / 1_000).toFixed(1) + 'K';
    return value.toLocaleString('fr-FR');
  }
}
