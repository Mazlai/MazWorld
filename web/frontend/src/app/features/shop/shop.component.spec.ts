import { TestBed } from '@angular/core/testing';
import { of, NEVER } from 'rxjs';
import { ShopComponent } from './shop.component';
import { ShopService } from '../../core/services/shop.service';
import type { ShopItem, ShopFilter } from '../../core/models/shop.model';

function makeItem(overrides: Partial<ShopItem> & { item_id: string }): ShopItem {
  return {
    item_type: 'badge',
    name: overrides.item_id,
    description: null,
    price: 100,
    emoji: null,
    available: true,
    owned: false,
    equipped: false,
    ...overrides,
  };
}

function setup() {
  const mockService = {
    getShopItems: vi.fn().mockReturnValue(NEVER),
    purchaseItem: vi.fn().mockReturnValue(NEVER),
    equipBackground: vi.fn().mockReturnValue(NEVER),
    equipBadge: vi.fn().mockReturnValue(NEVER),
  };
  TestBed.configureTestingModule({
    imports: [ShopComponent],
    providers: [{ provide: ShopService, useValue: mockService }],
  });
  const fixture = TestBed.createComponent(ShopComponent);
  fixture.detectChanges();
  return { component: fixture.componentInstance, mockService };
}

describe('ShopComponent', () => {
  afterEach(() => TestBed.resetTestingModule());

  // ===== filteredItems — tri =====

  describe('filteredItems() — tri (non-possédés d\'abord, puis par prix)', () => {
    it('trie les articles non-possédés avant les possédés', () => {
      const { component } = setup();
      component.items.set([
        makeItem({ item_id: 'a', owned: true, price: 50 }),
        makeItem({ item_id: 'b', owned: false, price: 200 }),
        makeItem({ item_id: 'c', owned: false, price: 100 }),
      ]);
      const sorted = component.filteredItems();
      expect(sorted[0].item_id).toBe('c');
      expect(sorted[1].item_id).toBe('b');
      expect(sorted[2].item_id).toBe('a');
    });

    it('trie par prix croissant à l\'intérieur du groupe non-possédé', () => {
      const { component } = setup();
      component.items.set([
        makeItem({ item_id: 'x', price: 500, owned: false }),
        makeItem({ item_id: 'y', price: 100, owned: false }),
        makeItem({ item_id: 'z', price: 300, owned: false }),
      ]);
      const sorted = component.filteredItems();
      expect(sorted.map(i => i.item_id)).toEqual(['y', 'z', 'x']);
    });

    it('filtre uniquement les badges quand filter="badge"', () => {
      const { component } = setup();
      component.items.set([
        makeItem({ item_id: 'bg1', item_type: 'background', price: 100 }),
        makeItem({ item_id: 'badge1', item_type: 'badge', price: 50 }),
      ]);
      component.filter.set('badge');
      expect(component.filteredItems().every(i => i.item_type === 'badge')).toBe(true);
    });

    it('filtre uniquement les articles possédés quand filter="owned"', () => {
      const { component } = setup();
      component.items.set([
        makeItem({ item_id: 'a', owned: true }),
        makeItem({ item_id: 'b', owned: false }),
      ]);
      component.filter.set('owned');
      expect(component.filteredItems()).toHaveLength(1);
      expect(component.filteredItems()[0].item_id).toBe('a');
    });
  });

  // ===== canBuy() — 3 conditions indépendantes =====

  describe('canBuy()', () => {
    it('retourne true quand disponible, non-possédé et assez de coins', () => {
      const { component } = setup();
      component.userCoins.set(500);
      expect(component.canBuy(makeItem({ item_id: 'i1', price: 100, available: true, owned: false }))).toBe(true);
    });

    it('retourne false quand l\'article est déjà possédé', () => {
      const { component } = setup();
      component.userCoins.set(500);
      expect(component.canBuy(makeItem({ item_id: 'i1', price: 100, available: true, owned: true }))).toBe(false);
    });

    it('retourne false quand l\'article n\'est pas disponible', () => {
      const { component } = setup();
      component.userCoins.set(500);
      expect(component.canBuy(makeItem({ item_id: 'i1', price: 100, available: false, owned: false }))).toBe(false);
    });

    it('retourne false quand les coins sont insuffisants', () => {
      const { component } = setup();
      component.userCoins.set(50);
      expect(component.canBuy(makeItem({ item_id: 'i1', price: 100, available: true, owned: false }))).toBe(false);
    });

    it('retourne true quand le prix est exactement égal aux coins disponibles', () => {
      const { component } = setup();
      component.userCoins.set(100);
      expect(component.canBuy(makeItem({ item_id: 'i1', price: 100, available: true, owned: false }))).toBe(true);
    });
  });

  // ===== setFilter() — reset de page =====

  describe('setFilter()', () => {
    it('réinitialise la page à 1 lors d\'un changement de filtre', () => {
      const { component } = setup();
      component.page.set(3);
      component.setFilter('badge' as ShopFilter);
      expect(component.page()).toBe(1);
      expect(component.filter()).toBe('badge');
    });

    it('applique le filtre sans modifier la page si elle est déjà à 1', () => {
      const { component } = setup();
      component.page.set(1);
      component.setFilter('background' as ShopFilter);
      expect(component.page()).toBe(1);
    });
  });

  // ===== purchase() — garde canBuy =====

  describe('purchase()', () => {
    it('ne fait pas d\'appel service si canBuy() est false', () => {
      const { component, mockService } = setup();
      component.userCoins.set(10);
      const item = makeItem({ item_id: 'i1', price: 100, available: true, owned: false });
      component.purchase(item);
      expect(mockService.purchaseItem).not.toHaveBeenCalled();
    });

    it('met à jour userCoins et marque l\'article comme possédé après un achat réussi', () => {
      const { component, mockService } = setup();
      mockService.purchaseItem.mockReturnValue(of({ new_balance: 400, message: 'Achat réussi', success: true, item: {} }));
      component.userCoins.set(500);
      const item = makeItem({ item_id: 'item_a', price: 100, available: true, owned: false });
      component.items.set([item]);
      component.purchase(item);
      expect(component.userCoins()).toBe(400);
      expect(component.items().find(i => i.item_id === 'item_a')?.owned).toBe(true);
    });
  });

  // ===== Pagination =====

  describe('Pagination', () => {
    it('totalPages vaut au moins 1 même avec 0 articles', () => {
      const { component } = setup();
      component.items.set([]);
      expect(component.totalPages()).toBe(1);
    });

    it('canGoNext est false quand on est sur la dernière page', () => {
      const { component } = setup();
      const items = Array.from({ length: 5 }, (_, i) => makeItem({ item_id: `item_${i}` }));
      component.items.set(items);
      component.page.set(1);
      expect(component.canGoNext()).toBe(false);
    });
  });
});