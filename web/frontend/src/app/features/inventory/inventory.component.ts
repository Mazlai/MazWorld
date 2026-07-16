import { Component, OnInit, signal, computed, inject, ChangeDetectionStrategy } from '@angular/core';
import { InventoryService } from '../../core/services/inventory.service';
import type { InventoryItem } from '../../core/models/inventory.model';

@Component({
  selector: 'app-inventory',
  standalone: true,
  imports: [],
  templateUrl: './inventory.component.html',
  styleUrl: './inventory.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InventoryComponent implements OnInit {
  private readonly inventoryService = inject(InventoryService);

  readonly items = signal<InventoryItem[]>([]);
  readonly equippedBackground = signal<string | null>(null);
  readonly equippedBadges = signal<Record<number, string>>({});
  readonly userCoins = signal(0);
  readonly isLoading = signal(true);
  readonly hasError = signal(false);
  readonly notification = signal<{ type: 'success' | 'error'; message: string } | null>(null);
  readonly activeTab = signal<'background' | 'badge'>('background');

  readonly backgrounds = computed(() => this.items().filter(i => i.item_type === 'background'));
  readonly badges = computed(() => this.items().filter(i => i.item_type === 'badge'));
  readonly slots = [0, 1, 2, 3, 4, 5];

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.isLoading.set(true);
    this.hasError.set(false);
    this.inventoryService.getInventory().subscribe({
      next: ({ items, equipped_background, equipped_badges, user_coins }) => {
        this.items.set(items);
        this.equippedBackground.set(equipped_background);
        this.equippedBadges.set(equipped_badges);
        this.userCoins.set(user_coins);
        this.isLoading.set(false);
      },
      error: () => {
        this.hasError.set(true);
        this.isLoading.set(false);
      },
    });
  }

  equipBg(item: InventoryItem): void {
    if (item.equipped) return;
    this.inventoryService.equipBackground(item.item_id).subscribe({
      next: ({ message }) => {
        this.equippedBackground.set(item.item_id);
        this.items.update(list => list.map(i => ({
          ...i,
          equipped: i.item_type === 'background' ? i.item_id === item.item_id : i.equipped,
        })));
        this.notify('success', message);
      },
      error: (err) => this.notify('error', err.error?.message ?? 'Erreur'),
    });
  }

  equipBadge(item: InventoryItem, slot: number): void {
    this.inventoryService.equipBadge(item.item_id, slot).subscribe({
      next: ({ message }) => {
        const badges = { ...this.equippedBadges(), [slot]: item.item_id };
        this.equippedBadges.set(badges);
        this.items.update(list => list.map(i => {
          if (i.item_type !== 'badge') return i;
          if (i.item_id === item.item_id) return { ...i, equipped: true, slot };
          if (i.slot === slot) return { ...i, equipped: false, slot: null };
          return i;
        }));
        this.notify('success', message);
      },
      error: (err) => this.notify('error', err.error?.message ?? 'Erreur'),
    });
  }

  unequipBadge(slot: number): void {
    this.inventoryService.unequipBadge(slot).subscribe({
      next: ({ message }) => {
        const badges = { ...this.equippedBadges() };
        delete badges[slot];
        this.equippedBadges.set(badges);
        this.items.update(list => list.map(i =>
          i.item_type === 'badge' && i.slot === slot ? { ...i, equipped: false, slot: null } : i
        ));
        this.notify('success', message);
      },
      error: (err) => this.notify('error', err.error?.message ?? 'Erreur'),
    });
  }

  getBadgeInSlot(slot: number): InventoryItem | undefined {
    const id = this.equippedBadges()[slot];
    return id ? this.badges().find(b => b.item_id === id) : undefined;
  }

  getEmoji(item: InventoryItem): string {
    return item.emoji ?? (item.item_type === 'background' ? '🖼️' : '🏅');
  }

  private notify(type: 'success' | 'error', message: string): void {
    this.notification.set({ type, message });
    setTimeout(() => this.notification.set(null), 4000);
  }
}
