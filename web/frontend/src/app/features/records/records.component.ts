import { Component, OnInit, signal, computed, inject, ChangeDetectionStrategy } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RecordsService } from '../../core/services/records.service';
import type { PersonalRecords } from '../../core/models/records.model';

@Component({
  selector: 'app-records',
  standalone: true,
  imports: [DatePipe],
  templateUrl: './records.component.html',
  styleUrl: './records.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RecordsComponent implements OnInit {
  private readonly recordsService = inject(RecordsService);

  readonly records = signal<PersonalRecords | null>(null);
  readonly isLoading = signal(true);
  readonly hasError = signal(false);

  readonly explorationPct = computed(() => {
    const r = this.records();
    if (!r || r.exploration.total_cities === 0) return 0;
    return Math.round((r.exploration.visited_count / r.exploration.total_cities) * 100);
  });

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.isLoading.set(true);
    this.hasError.set(false);
    this.recordsService.getMyRecords().subscribe({
      next: (data) => {
        this.records.set(data);
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
