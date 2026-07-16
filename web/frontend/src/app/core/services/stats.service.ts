import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import type { AllStatsResponse } from '../models/stats.model';

@Injectable({ providedIn: 'root' })
export class StatsService {
  private readonly http = inject(HttpClient);
  private readonly base = environment.apiUrl;

  getAllStats(): Observable<AllStatsResponse> {
    return this.http.get<AllStatsResponse>(`${this.base}/api/stats`);
  }
}
