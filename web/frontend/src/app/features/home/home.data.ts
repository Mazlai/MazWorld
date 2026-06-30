export const HOME_CITIES = [
  { id: 'willowbrook',  emoji: '🌿', name: 'Willowbrook',  theme: 'Nature'     },
  { id: 'ironhaven',    emoji: '⚒️', name: 'Ironhaven',    theme: 'Industriel' },
  { id: 'crystalport',  emoji: '⚓', name: 'Crystalport',  theme: 'Maritime'   },
  { id: 'shadowpeak',   emoji: '🏔️', name: 'Shadowpeak',   theme: 'Montagne'   },
  { id: 'goldenfields', emoji: '🌾', name: 'Goldenfields', theme: 'Plaines'    },
  { id: 'neonhub',      emoji: '🌆', name: 'NeonHub',      theme: 'High-tech'  },
] as const;

export const HOME_FEATURES = [
  { icon: '🗺️', title: 'Carte interactive',  desc: 'Voyagez entre 6 villes interconnectées, chacune avec ses propres opportunités et métiers.' },
  { icon: '🪙', title: 'MazCoins',           desc: 'Gagnez des MazCoins en interagissant sur Discord. Plus vous jouez, plus vous accumulez.' },
  { icon: '🏆', title: 'Classement',         desc: 'Affrontez la communauté et grimpez dans le classement mondial des plus riches.' },
  { icon: '🛒', title: 'Boutique & Badges',  desc: 'Personnalisez votre profil avec des backgrounds et badges achetés dans la boutique.' },
] as const;

export const HOME_ECONOMY_STEPS = [
  { emoji: '💬', title: 'Interagissez',  desc: 'Chattez sur Discord et participez à la vie du serveur.' },
  { emoji: '🪙', title: 'Accumulez',     desc: 'Chaque interaction vous rapporte des MazCoins automatiquement.' },
  { emoji: '🗺️', title: 'Explorez',      desc: 'Voyagez vers de nouvelles villes et débloquez des territoires.' },
  { emoji: '🛒', title: 'Personnalisez', desc: 'Dépensez vos coins pour des items et badges exclusifs.' },
] as const;
