export interface TravelStatus {
  traveling: boolean;
  destination?: string;
  destination_name?: string;
  destination_emoji?: string;
  arrival_time?: number;
}

export interface MapRoute {
  route_id?: number;
  city_to: string;
  destination_name: string;
  destination_emoji: string;
  cost: number;
  duration: number;
  visited: boolean;
  effective_cost: number;
}

export interface MapJob {
  job_id: number;
  job_name: string;
  job_emoji: string;
  task_1: string;
  task_2: string;
  task_3: string;
}

export interface MapResponse {
  current_city: {
    city_id: string;
    name: string;
    description: string;
    emoji: string;
    theme: string;
  };
  coins: number;
  routes: MapRoute[];
  jobs?: MapJob[];
}

export interface TravelStartResponse {
  success: boolean;
  message: string;
  arrival_time?: number;
  travel_cost?: number;
  coins?: number;
}

export interface ProfileData {
  user_id: string;
  username: string;
  coins: number;
  equipped_background: string;
  equipped_badges: string[];
  created_at?: string;
}

export interface ProfileResponse {
  profile: ProfileData;
}

export interface ShopItem {
  item_id: string;
  item_type: string;
  name: string;
  description?: string;
  price: number;
  emoji?: string;
  available?: boolean;
  owned: boolean;
  equipped: boolean;
}

export interface ShopListResponse {
  items: ShopItem[];
  user_coins: number;
}

export interface PurchaseResponse {
  success: boolean;
  message: string;
  new_balance?: number;
  item?: ShopItem;
}

export interface EquipResponse {
  success: boolean;
  message: string;
}

export interface WorkResponse {
  success: boolean;
  message: string;
  job_name?: string;
  job_emoji?: string;
  task?: string;
  reward?: number;
  coins?: number;
  next_work?: number;
}

export interface DailyResponse {
  success: boolean;
  message: string;
  coins?: number;
  next_daily?: number;
}

export interface CoinflipResponse {
  success: boolean;
  won?: boolean;
  result?: string;
  amount?: number;
  message: string;
  coins?: number;
}
