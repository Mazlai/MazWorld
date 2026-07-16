import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import type { LeaderboardResponse, LeaderboardCategory } from '../models/leaderboard.model';

@Injectable({ providedIn: 'root' })
export class LeaderboardService {
  private readonly http = inject(HttpClient);
  private readonly base = environment.apiUrl;

  getLeaderboard(
    category: LeaderboardCategory = 'coins',
    page: number = 1,
    limit: number = 20
  ): Observable<LeaderboardResponse> {
    const params = new HttpParams()
      .set('category', category)
      .set('page', page)
      .set('limit', limit);
    return this.http.get<LeaderboardResponse>(`${this.base}/api/leaderboard`, { params });
  }

  getMyRank(): Observable<{ rank: number }> {
    return this.http.get<{ rank: number }>(`${this.base}/api/leaderboard/me`);
  }
}
