export interface Background {
  id: string;
  name: string;
  color: string;
  price: number;
}

export interface Badge {
  id: string;
  name: string;
  emoji: string;
  icon: string;
  price: number;
}

export interface BackgroundsData {
  backgrounds: Background[];
}

export interface BadgesData {
  badges: Badge[];
}
