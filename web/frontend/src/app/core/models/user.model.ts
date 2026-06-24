export interface User {
  id: number;
  user_id: string;
  username: string;
  discord_avatar: string | null;
  discord_email: string | null;
  current_city: string;
  coins: number;
  equipped_background: string | null;
  roles: string[];
}

export interface Guild {
  id: string;
  name: string;
  icon: string | null;
  owner: boolean;
  permissions: number;
  approximate_member_count?: number;
}

export interface AuthResponse {
  token: string;
  user: User;
  guilds?: Guild[];
}

export interface LoginUrlResponse {
  authorization_url: string;
  state?: string;
}
