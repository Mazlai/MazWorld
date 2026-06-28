export interface CommandOption {
  name: string;
  description: string;
  required: boolean;
  type: 'string' | 'integer' | 'user';
  choices?: string[];
  range?: { min: number; max: number; unit: string };
}

export interface CommandMeta {
  icon: string;
  label: string;
}

export interface BotCommand {
  name: string;
  description: string;
  category: string;
  emoji: string;
  options?: CommandOption[];
  meta?: CommandMeta[];
}

export const COMMAND_CATEGORIES = [
  { id: 'profil',       label: 'Profil',       emoji: '👤' },
  { id: 'recompenses',  label: 'Récompenses',  emoji: '🎁' },
  { id: 'jeux',         label: 'Jeux',         emoji: '🎰' },
  { id: 'exploration',  label: 'Exploration',  emoji: '🗺️' },
] as const;

export const BOT_COMMANDS: BotCommand[] = [
  {
    name: 'profile',
    description: 'Affiche votre carte de profil personnalisée avec vos stats, équipements et MazCoins.',
    category: 'profil',
    emoji: '🪪',
    options: [
      {
        name: 'utilisateur',
        description: 'Voir le profil d\'un autre joueur',
        required: false,
        type: 'user',
      },
    ],
  },
  {
    name: 'inventory',
    description: 'Consultez votre inventaire, équipez ou retirez vos backgrounds et badges.',
    category: 'profil',
    emoji: '🎒',
  },
  {
    name: 'shop',
    description: 'Accédez à la boutique pour acheter des backgrounds et badges avec vos MazCoins.',
    category: 'profil',
    emoji: '🛒',
  },
  {
    name: 'daily',
    description: 'Réclamez votre récompense quotidienne de MazCoins. Une seule fois par 24 heures.',
    category: 'recompenses',
    emoji: '📅',
    meta: [
      { icon: '⏱️', label: 'Cooldown : 24h' },
      { icon: '🪙', label: 'Récompense : 5 MZC' },
    ],
  },
  {
    name: 'work',
    description: 'Travaillez dans votre ville actuelle pour gagner des MazCoins. Le montant varie selon le job.',
    category: 'recompenses',
    emoji: '💼',
    meta: [
      { icon: '⏱️', label: 'Cooldown : 1h' },
      { icon: '🪙', label: 'Récompense : 20–30 MZC' },
    ],
  },
  {
    name: 'coinflip',
    description: 'Pariez vos MazCoins sur pile ou face — doublez ou perdez votre mise.',
    category: 'jeux',
    emoji: '🪙',
    options: [
      {
        name: 'choix',
        description: 'Pile ou face',
        required: true,
        type: 'string',
        choices: ['pile', 'face'],
      },
      {
        name: 'mise',
        description: 'Montant à parier',
        required: true,
        type: 'integer',
        range: { min: 10, max: 500, unit: 'MZC' },
      },
    ],
  },
  {
    name: 'map',
    description: 'Consultez la carte interactive et lancez un voyage vers une ville adjacente.',
    category: 'exploration',
    emoji: '🗺️',
  },
  {
    name: 'cityinfo',
    description: 'Découvrez les détails de votre ville actuelle : jobs disponibles, description et thème.',
    category: 'exploration',
    emoji: '🏙️',
  },
];
