import { Component, OnInit, signal, computed, inject, ChangeDetectionStrategy } from '@angular/core';
import { ServersService } from '../../core/services/servers.service';
import type { DiscordServer, BotStatus } from '../../core/models/servers.model';

@Component({
  selector: 'app-servers',
  standalone: true,
  templateUrl: './servers.component.html',
  styleUrl: './servers.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ServersComponent implements OnInit {
  private readonly serversService = inject(ServersService);

  readonly servers    = signal<DiscordServer[]>([]);
  readonly botStatus  = signal<BotStatus | null>(null);
  readonly isLoading  = signal(true);
  readonly hasError   = signal(false);

  readonly presentCount = computed(() => this.servers().filter(s => s.bot_present).length);
  readonly totalCount   = computed(() => this.servers().length);

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.isLoading.set(true);
    this.hasError.set(false);

    this.serversService.getBotStatus().subscribe({
      next: status => this.botStatus.set(status),
      error: () => this.botStatus.set({ online: false, username: null, bot_id: null }),
    });

    this.serversService.getMyServers().subscribe({
      next: data => {
        this.servers.set(data);
        this.isLoading.set(false);
      },
      error: () => {
        this.hasError.set(true);
        this.isLoading.set(false);
      },
    });
  }

  fmtCount(n: number | null): string {
    if (!n) return '0';
    if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
    if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K';
    return n.toLocaleString('fr-FR');
  }

  openInvite(url: string): void {
    window.open(url, '_blank', 'noopener,noreferrer');
  }
}
