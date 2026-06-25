export type BadgeId =
  | 'badge_founder'
  | 'badge_verified'
  | 'badge_star'
  | 'badge_heart'
  | 'badge_fire'
  | 'badge_diamond';

export type BackgroundId =
  | 'bg_default'
  | 'bg_blue'
  | 'bg_purple'
  | 'bg_green'
  | 'bg_red'
  | 'bg_orange';

export interface UserProfile {
  user_id: string;
  username: string;
  discord_avatar: string | null;
  coins: number;
  equipped_background: BackgroundId;
  equipped_badges: BadgeId[];
  current_city: string | null;
  current_city_name: string;
  traveling_to: string | null;
  arrival_time: number | null;
  created_at: string;
  visited_cities_count: number;
  inventory_count: number;
}

export interface ProfileResponse {
  profile: UserProfile;
}