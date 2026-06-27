import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import type { ShopResponse, PurchaseResponse, EquipResponse } from '../models/shop.model';

@Injectable({ providedIn: 'root' })
export class ShopService {
  private readonly http = inject(HttpClient);
  private readonly base = environment.apiUrl;

  getShopItems(): Observable<ShopResponse> {
    return this.http.get<ShopResponse>(`${this.base}/api/shop`);
  }

  purchaseItem(itemId: string): Observable<PurchaseResponse> {
    return this.http.post<PurchaseResponse>(`${this.base}/api/shop/purchase`, { item_id: itemId });
  }

  equipBackground(itemId: string): Observable<EquipResponse> {
    return this.http.post<EquipResponse>(`${this.base}/api/profile/equip/background`, { item_id: itemId });
  }

  equipBadge(badgeId: string, slot: number): Observable<EquipResponse> {
    return this.http.post<EquipResponse>(`${this.base}/api/profile/equip/badge`, { badge_id: badgeId, slot });
  }
}
