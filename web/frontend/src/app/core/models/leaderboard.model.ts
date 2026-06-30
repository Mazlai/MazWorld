export interface LeaderboardEntry {
  rank: number;
  discord_id: string;
  username: string;
  avatar: string | null;
  coins: number;
}

export interface LeaderboardResponse {
  entries: LeaderboardEntry[];
  total: number;
  page: number;
  limit: number;
  user_rank?: number;
}

export type LeaderboardCategory = 'coins';
