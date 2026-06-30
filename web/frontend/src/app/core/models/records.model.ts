export interface RecordsCoins {
  current: number;
  rank: number;
  total_users: number;
  percentile: number;
}

export interface CityRecord {
  city_id: string;
  name: string;
  emoji: string | null;
  theme: string | null;
  visited: boolean;
  first_visit: string | null;
}

export interface RecordsExploration {
  visited_count: number;
  total_cities: number;
  cities: CityRecord[];
}

export interface RecordsCollection {
  inventory_count: number;
  badges_count: number;
  recent_item: string | null;
}

export interface RecordsActivity {
  joined_at: string;
  last_activity: string;
  days_active: number;
}

export interface PersonalRecords {
  coins: RecordsCoins;
  exploration: RecordsExploration;
  collection: RecordsCollection;
  activity: RecordsActivity;
}
