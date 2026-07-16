export interface DiscordServer {
  id: string;
  name: string;
  icon: string | null;
  owner: boolean;
  member_count: number | null;
  bot_present: boolean;
  invite_url: string | null;
}

export interface BotStatus {
  online: boolean;
  username: string | null;
  bot_id: string | null;
}
