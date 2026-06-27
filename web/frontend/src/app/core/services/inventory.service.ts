import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import type { InventoryResponse, UnequipResponse } from '../models/inventory.model';
import type { EquipResponse } from '../models/shop.model';

@Injectable({ providedIn: 'root' })
export class InventoryService {
  private readonly http = inject(HttpClient);
  private readonly base = environment.apiUrl;

  getInventory(): Observable<InventoryResponse> {
    return this.http.get<InventoryResponse>(`${this.base}/api/inventory`);
  }

  equipBackground(itemId: string): Observable<EquipResponse> {
    return this.http.post<EquipResponse>(`${this.base}/api/profile/equip/background`, { item_id: itemId });
  }

  equipBadge(badgeId: string, slot: number): Observable<EquipResponse> {
    return this.http.post<EquipResponse>(`${this.base}/api/profile/equip/badge`, { badge_id: badgeId, slot });
  }

  unequipBadge(slot: number): Observable<UnequipResponse> {
    return this.http.post<UnequipResponse>(`${this.base}/api/profile/unequip/badge`, { slot });
  }
}
