export interface GlobalStats {
  total_users: number;
  total_cities: number;
  total_coins_circulation: number;
  active_users_today: number;
  active_users_week: number;
}

export interface EconomyStats {
  average_coins_per_user: number;
  richest_user_coins: number;
  total_shop_purchases: number;
  most_popular_item: string;
}

export interface AllStatsResponse {
  global: GlobalStats;
  economy: EconomyStats;
}
