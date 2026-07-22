import { TestBed } from '@angular/core/testing';
import { of, NEVER } from 'rxjs';
import { ShopComponent } from './shop.component';
import { ShopService } from '../../core/services/shop.service';
import type { ShopItem, ShopFilter } from '../../core/models/shop.model';

function articleBoutique(overrides: Partial<ShopItem> & { item_id: string }): ShopItem {
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

function monterBoutique() {
  const serviceMock = {
    getShopItems: vi.fn().mockReturnValue(NEVER),
    purchaseItem: vi.fn().mockReturnValue(NEVER),
    equipBackground: vi.fn().mockReturnValue(NEVER),
    equipBadge: vi.fn().mockReturnValue(NEVER),
  };
  TestBed.configureTestingModule({
    imports: [ShopComponent],
    providers: [{ provide: ShopService, useValue: serviceMock }],
  });
  const fixture = TestBed.createComponent(ShopComponent);
  fixture.detectChanges();
  return { component: fixture.componentInstance, serviceMock };
}

afterEach(() => TestBed.resetTestingModule());

describe('filteredItems() — tri et filtrage du catalogue', () => {
  it('affiche les articles non possédés avant ceux déjà achetés', () => {
    const { component } = monterBoutique();
    component.items.set([
      articleBoutique({ item_id: 'a', owned: true, price: 50 }),
      articleBoutique({ item_id: 'b', owned: false, price: 200 }),
      articleBoutique({ item_id: 'c', owned: false, price: 100 }),
    ]);

    expect(component.filteredItems().map(i => i.item_id)).toEqual(['c', 'b', 'a']);
  });

  it('trie par prix croissant à l\'intérieur du groupe non-possédé', () => {
    const { component } = monterBoutique();
    component.items.set([
      articleBoutique({ item_id: 'x', price: 500, owned: false }),
      articleBoutique({ item_id: 'y', price: 100, owned: false }),
      articleBoutique({ item_id: 'z', price: 300, owned: false }),
    ]);

    expect(component.filteredItems().map(i => i.item_id)).toEqual(['y', 'z', 'x']);
  });

  it('le filtre "badge" n\'affiche que les badges, pas les backgrounds', () => {
    const { component } = monterBoutique();
    component.items.set([
      articleBoutique({ item_id: 'bg1', item_type: 'background', price: 100 }),
      articleBoutique({ item_id: 'badge1', item_type: 'badge', price: 50 }),
    ]);
    component.filter.set('badge');

    expect(component.filteredItems().every(i => i.item_type === 'badge')).toBe(true);
  });

  it('le filtre "owned" n\'affiche que la collection déjà acquise', () => {
    const { component } = monterBoutique();
    component.items.set([articleBoutique({ item_id: 'a', owned: true }), articleBoutique({ item_id: 'b', owned: false })]);
    component.filter.set('owned');

    expect(component.filteredItems().map(i => i.item_id)).toEqual(['a']);
  });
});

describe('canBuy() — trois conditions indépendantes', () => {
  it('autorise l\'achat quand tout est réuni : disponible, non possédé, solde suffisant', () => {
    const { component } = monterBoutique();
    component.userCoins.set(500);

    expect(component.canBuy(articleBoutique({ item_id: 'i1', price: 100, available: true, owned: false }))).toBe(true);
  });

  it('bloque un article déjà possédé, même si le joueur peut se le repayer', () => {
    const { component } = monterBoutique();
    component.userCoins.set(500);

    expect(component.canBuy(articleBoutique({ item_id: 'i1', price: 100, available: true, owned: true }))).toBe(false);
  });

  it('bloque un article retiré de la vente, même si le joueur pourrait se le payer', () => {
    const { component } = monterBoutique();
    component.userCoins.set(500);

    expect(component.canBuy(articleBoutique({ item_id: 'i1', price: 100, available: false, owned: false }))).toBe(false);
  });

  it('bloque l\'achat si le solde est insuffisant', () => {
    const { component } = monterBoutique();
    component.userCoins.set(50);

    expect(component.canBuy(articleBoutique({ item_id: 'i1', price: 100, available: true, owned: false }))).toBe(false);
  });

  it('autorise l\'achat quand le solde couvre exactement le prix (pas de sur-marge exigée)', () => {
    const { component } = monterBoutique();
    component.userCoins.set(100);

    expect(component.canBuy(articleBoutique({ item_id: 'i1', price: 100, available: true, owned: false }))).toBe(true);
  });
});

describe('setFilter() — le changement de filtre remet la pagination à zéro', () => {
  it('revient à la page 1 quand on change de filtre depuis une page avancée', () => {
    const { component } = monterBoutique();
    component.page.set(3);

    component.setFilter('badge' as ShopFilter);

    expect(component.page()).toBe(1);
    expect(component.filter()).toBe('badge');
  });

  it('ne perturbe rien si on est déjà sur la page 1', () => {
    const { component } = monterBoutique();
    component.page.set(1);

    component.setFilter('background' as ShopFilter);

    expect(component.page()).toBe(1);
  });
});

describe('purchase() — garde-fou canBuy avant tout appel API', () => {
  it('n\'appelle jamais le backend si canBuy() est false (évite un achat refusé côté serveur)', () => {
    const { component, serviceMock } = monterBoutique();
    component.userCoins.set(10);

    component.purchase(articleBoutique({ item_id: 'i1', price: 100, available: true, owned: false }));

    expect(serviceMock.purchaseItem).not.toHaveBeenCalled();
  });

  it('met à jour le solde et marque l\'article comme possédé après un achat réussi', () => {
    const { component, serviceMock } = monterBoutique();
    serviceMock.purchaseItem.mockReturnValue(of({ new_balance: 400, message: 'Achat réussi', success: true, item: {} }));
    component.userCoins.set(500);
    const item = articleBoutique({ item_id: 'item_a', price: 100, available: true, owned: false });
    component.items.set([item]);

    component.purchase(item);

    expect(component.userCoins()).toBe(400);
    expect(component.items().find(i => i.item_id === 'item_a')?.owned).toBe(true);
  });
});

describe('Pagination du catalogue', () => {
  it('reste à 1 page minimum même quand le catalogue est vide', () => {
    const { component } = monterBoutique();
    component.items.set([]);

    expect(component.totalPages()).toBe(1);
  });

  it('n\'autorise pas d\'aller plus loin depuis la dernière page', () => {
    const { component } = monterBoutique();
    component.items.set(Array.from({ length: 5 }, (_, i) => articleBoutique({ item_id: `item_${i}` })));
    component.page.set(1);

    expect(component.canGoNext()).toBe(false);
  });
});
