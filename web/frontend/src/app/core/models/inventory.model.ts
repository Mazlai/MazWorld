export type InventoryItemType = 'background' | 'badge';

export interface InventoryItem {
  item_id: string;
  item_type: InventoryItemType;
  name: string;
  description: string | null;
  emoji: string | null;
  equipped: boolean;
  slot: number | null;
  purchased_at: string;
}

export interface InventoryResponse {
  items: InventoryItem[];
  equipped_background: string | null;
  equipped_badges: Record<number, string>;
  user_coins: number;
}

export interface UnequipResponse {
  success: boolean;
  message: string;
}
