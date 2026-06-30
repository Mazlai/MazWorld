import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import type { DiscordServer, BotStatus } from '../models/servers.model';

@Injectable({ providedIn: 'root' })
export class ServersService {
  private readonly http = inject(HttpClient);
  private readonly base = environment.apiUrl;

  getMyServers(): Observable<DiscordServer[]> {
    return this.http.get<DiscordServer[]>(`${this.base}/api/servers`);
  }

  getBotStatus(): Observable<BotStatus> {
    return this.http.get<BotStatus>(`${this.base}/api/bot/status`);
  }
}
