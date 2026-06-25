import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import type { City, RouteData, TravelMapData, TravelStatus, TravelStartResult } from '../models/travel.model';

@Injectable({ providedIn: 'root' })
export class TravelService {
  private readonly http = inject(HttpClient);
  private readonly base = environment.apiUrl;

  getAllCities(): Observable<City[]> {
    return this.http.get<City[]>(`${this.base}/api/cities`);
  }

  getAllRoutes(): Observable<RouteData[]> {
    return this.http.get<RouteData[]>(`${this.base}/api/routes`);
  }

  getMap(): Observable<TravelMapData> {
    return this.http.get<TravelMapData>(`${this.base}/api/travel/map`);
  }

  getStatus(): Observable<TravelStatus> {
    return this.http.get<TravelStatus>(`${this.base}/api/travel/status`);
  }

  startTravel(destinationId: string): Observable<TravelStartResult> {
    return this.http.post<TravelStartResult>(`${this.base}/api/travel/start`, { destination_id: destinationId });
  }
}
