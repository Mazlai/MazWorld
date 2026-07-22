# Manuel d'utilisation — MazWorld

**Présenté par Mickael FERNANDEZ** — Étudiant M2 Développement Web, Ynov Campus

---

## Sommaire

1. [Se connecter](#1-se-connecter)
2. [L'application web](#2-lapplication-web)
3. [Le bot Discord](#3-le-bot-discord)
4. [Rôles](#4-rôles)
5. [Questions fréquentes](#5-questions-fréquentes)

---

MazWorld est un jeu économique de voyage : chaque joueur incarne un personnage qui se déplace entre des villes, y travaille pour gagner des mazcoins, dépense cette monnaie en boutique et peut comparer sa progression au classement général. Le jeu se joue indifféremment via le **bot Discord** ou l'**application web** — un seul et même compte, la progression est partagée entre les deux interfaces.

---

## 1. Se connecter

La connexion se fait exclusivement via **Discord OAuth**, depuis la page d'accueil de l'application web (bouton de connexion). Aucun mot de passe n'est créé sur MazWorld : l'identité du joueur est celle de son compte Discord.

Sur Discord, aucune connexion n'est nécessaire — les commandes du bot identifient directement l'utilisateur qui les exécute.

---

## 2. L'application web

| Page | Accès | Contenu |
|---|---|---|
| Accueil | Visiteur non connecté | Présentation, bouton de connexion Discord |
| Dashboard | Connecté | Vue d'ensemble de la progression |
| Profil | Connecté | Coins, background et badges équipés |
| Carte | Connecté | Villes disponibles, lancement d'un voyage |
| Boutique | Connecté | Achat de backgrounds et de badges |
| Inventaire | Connecté | Objets possédés, équipement/déséquipement |
| Classement | Public | Classement des joueurs par mazcoins |
| Records | Connecté | Records personnels |
| Commandes | Public | Liste et description des commandes du bot |
| Mes serveurs | Connecté | Serveurs Discord où le bot est présent, invitation du bot, statut en ligne |
| Statistiques | Administrateur (`ROLE_ADMIN`) | Statistiques globales et économiques du jeu |

Les pages marquées « Connecté » redirigent vers l'accueil si aucune session valide n'est présente ; « Statistiques » redirige vers le dashboard pour un compte sans rôle administrateur.

---

## 3. Le bot Discord

Toutes les commandes sont des **commandes slash** (`/nom-commande`), à taper directement dans un salon où le bot est présent.

| Commande | Effet | Limite d'usage |
|---|---|---|
| `/profile [utilisateur]` | Affiche une carte de profil générée (avatar, background, badges, coins). Sans argument, affiche le profil de l'auteur ; avec un utilisateur en argument, affiche le sien. | — |
| `/map` | Affiche la carte et les villes accessibles depuis la position actuelle, sous forme de boutons. Sélectionner une destination ouvre une confirmation avant de lancer le voyage. | Sélection de destination : 60 s. Confirmation : 30 s. |
| `/cityinfo` | Donne les informations de la ville où se trouve le joueur. Si un voyage est en cours, affiche le temps restant avant l'arrivée à la place. | — |
| `/work` | Fait travailler le personnage dans sa ville actuelle pour gagner des mazcoins. | 1 fois par heure |
| `/daily` | Réclame une récompense quotidienne de 5€. | 1 fois par 24 h |
| `/coinflip <choix> <mise>` | Mini-jeu pile ou face : miser sur `pile` ou `face`, mise minimum 10€. | 1 fois par 30 s |
| `/shop` | Ouvre la boutique : choix d'une catégorie (background/badge) puis d'un item, avec confirmation d'achat avant paiement. | Confirmation : 30 s |
| `/inventory` | Affiche l'inventaire du joueur et permet d'équiper ou de déséquiper backgrounds et badges via des menus déroulants. | Session d'interaction : 2 min |

Un voyage en cours (`/map`) a une durée fixe ; le joueur reste bloqué à sa position de départ jusqu'à l'arrivée annoncée par `/cityinfo`.

---

## 4. Rôles

- **Joueur standard** — accès à l'ensemble des fonctionnalités de jeu, web et Discord.
- **Administrateur** (`ROLE_ADMIN`) — accès additionnel à la page Statistiques (vue d'ensemble globale et économique du jeu). Ce rôle est attribué en base de données, aucune action du joueur ne l'active.

---

## 5. Questions fréquentes

**Ma commande me répond « en cooldown » / avec un délai affiché** — C'est normal : `/work`, `/daily` et `/coinflip` sont limitées dans le temps (voir tableau §3). Le délai restant est indiqué dans le message d'erreur.

**Je suis redirigé vers l'accueil sur le site web** — La session a expiré ou n'est plus valide : reconnectez-vous via Discord OAuth.

**Le bot ne répond pas** — Vérifier sur la page « Mes serveurs » que le bot est bien présent sur le serveur Discord concerné et qu'il apparaît en ligne ; sinon, utiliser le lien d'invitation depuis cette même page.
