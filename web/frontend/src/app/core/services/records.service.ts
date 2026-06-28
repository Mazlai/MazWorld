import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import type { PersonalRecords } from '../models/records.model';

@Injectable({ providedIn: 'root' })
export class RecordsService {
  private readonly http = inject(HttpClient);
  private readonly base = environment.apiUrl;

  getMyRecords(): Observable<PersonalRecords> {
    return this.http.get<PersonalRecords>(`${this.base}/api/records`);
  }
}
