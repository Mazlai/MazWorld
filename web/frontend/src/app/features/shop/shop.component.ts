import { Component, OnInit, signal, computed, inject, ChangeDetectionStrategy } from '@angular/core';
import { ShopService } from '../../core/services/shop.service';
import type { ShopItem, ShopFilter } from '../../core/models/shop.model';

const ITEMS_PER_PAGE = 12;

@Component({
  selector: 'app-shop',
  standalone: true,
  imports: [],
  templateUrl: './shop.component.html',
  styleUrl: './shop.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ShopComponent implements OnInit {
  private readonly shopService = inject(ShopService);

  readonly items = signal<ShopItem[]>([]);
  readonly userCoins = signal(0);
  readonly isLoading = signal(true);
  readonly hasError = signal(false);
  readonly filter = signal<ShopFilter>('all');
  readonly page = signal(1);
  readonly purchasing = signal<string | null>(null);
  readonly notification = signal<{ type: 'success' | 'error'; message: string } | null>(null);

  readonly filters: ShopFilter[] = ['all', 'background', 'badge', 'owned'];

  readonly filteredItems = computed(() => {
    const f = this.filter();
    const all = this.items();
    const filtered = f === 'all' ? all
      : f === 'owned' ? all.filter(i => i.owned)
      : all.filter(i => i.item_type === f);
    return [...filtered].sort((a, b) => {
      if (a.owned !== b.owned) return a.owned ? 1 : -1;
      return a.price - b.price;
    });
  });

  readonly totalPages = computed(() => Math.max(1, Math.ceil(this.filteredItems().length / ITEMS_PER_PAGE)));
  readonly paginatedItems = computed(() => {
    const p = this.page();
    return this.filteredItems().slice((p - 1) * ITEMS_PER_PAGE, p * ITEMS_PER_PAGE);
  });
  readonly canGoPrev = computed(() => this.page() > 1);
  readonly canGoNext = computed(() => this.page() < this.totalPages());

  readonly totalCount = computed(() => this.items().length);
  readonly ownedCount = computed(() => this.items().filter(i => i.owned).length);
  readonly bgCount = computed(() => this.items().filter(i => i.item_type === 'background').length);
  readonly badgeCount = computed(() => this.items().filter(i => i.item_type === 'badge').length);

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.isLoading.set(true);
    this.hasError.set(false);
    this.shopService.getShopItems().subscribe({
      next: ({ items, user_coins }) => {
        this.items.set(items);
        this.userCoins.set(user_coins);
        this.isLoading.set(false);
      },
      error: () => {
        this.hasError.set(true);
        this.isLoading.set(false);
      },
    });
  }

  setFilter(f: ShopFilter): void {
    this.filter.set(f);
    this.page.set(1);
  }

  canBuy(item: ShopItem): boolean {
    return item.available && !item.owned && this.userCoins() >= item.price;
  }

  purchase(item: ShopItem): void {
    if (!this.canBuy(item)) return;
    this.purchasing.set(item.item_id);
    this.shopService.purchaseItem(item.item_id).subscribe({
      next: ({ new_balance, message }) => {
        this.userCoins.set(new_balance);
        this.items.update(list => list.map(i => i.item_id === item.item_id ? { ...i, owned: true } : i));
        this.purchasing.set(null);
        this.notify('success', message);
      },
      error: (err) => {
        this.purchasing.set(null);
        this.notify('error', err.error?.message ?? 'Erreur lors de l\'achat');
      },
    });
  }

  equipBg(item: ShopItem): void {
    this.shopService.equipBackground(item.item_id).subscribe({
      next: ({ message }) => {
        this.items.update(list => list.map(i => ({
          ...i,
          equipped: i.item_type === 'background' ? i.item_id === item.item_id : i.equipped,
        })));
        this.notify('success', message);
      },
      error: (err) => this.notify('error', err.error?.message ?? 'Erreur'),
    });
  }

  equipBadge(item: ShopItem, slot: number): void {
    this.shopService.equipBadge(item.item_id, slot).subscribe({
      next: ({ message }) => {
        this.items.update(list => list.map(i => ({
          ...i,
          equipped: i.item_id === item.item_id ? true : i.equipped,
        })));
        this.notify('success', message);
      },
      error: (err) => this.notify('error', err.error?.message ?? 'Erreur'),
    });
  }

  prevPage(): void { if (this.canGoPrev()) this.page.update(p => p - 1); }
  nextPage(): void { if (this.canGoNext()) this.page.update(p => p + 1); }
  goToPage(p: number): void { this.page.set(p); }

  pagesArray(): number[] { return Array.from({ length: this.totalPages() }, (_, i) => i + 1); }

  getEmoji(item: ShopItem): string {
    return item.emoji ?? (item.item_type === 'background' ? '🖼️' : '🏅');
  }

  filterLabel(f: ShopFilter): string {
    return { all: 'Tous', background: 'Backgrounds', badge: 'Badges', owned: 'Mes achats' }[f];
  }

  filterIcon(f: ShopFilter): string {
    return { all: '🛍️', background: '🖼️', badge: '🏅', owned: '📦' }[f];
  }

  private notify(type: 'success' | 'error', message: string): void {
    this.notification.set({ type, message });
    setTimeout(() => this.notification.set(null), 4000);
  }
}
