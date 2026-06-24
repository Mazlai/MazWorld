export interface User {
  id: number;
  user_id: string;
  username: string;
  discord_avatar: string | null;
  discord_email: string | null;
  city: string;
  coins: number;
  roles: string[];
}

export interface AuthResponse {
  token: string;
  user: User;
  guilds: Guild[];
}

export interface Guild {
  id: string;
  name: string;
  icon: string | null;
  owner: boolean;
  permissions: number;
  approximate_member_count?: number;
}
