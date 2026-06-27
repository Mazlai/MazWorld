export type ItemType = 'background' | 'badge';
export type ShopFilter = 'all' | 'background' | 'badge' | 'owned';

export interface ShopItem {
  item_id: string;
  item_type: ItemType;
  name: string;
  description: string | null;
  price: number;
  emoji: string | null;
  available: boolean;
  owned?: boolean;
  equipped?: boolean;
}

export interface ShopResponse {
  items: ShopItem[];
  user_coins: number;
}

export interface PurchaseResponse {
  success: boolean;
  message: string;
  new_balance: number;
  item: ShopItem;
}

export interface EquipResponse {
  success: boolean;
  message: string;
}
