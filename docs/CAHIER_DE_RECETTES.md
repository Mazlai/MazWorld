# Cahier de recettes — MazWorld

**Présenté par Mickael FERNANDEZ** — Étudiant M2 Développement Web, Ynov Campus
**Compétence RNCP visée : C2.3.1**

---

## Sommaire

1. [Fonctionnel — Recette](#1-fonctionnel--recette)
2. [Fonctionnel — Traçabilité technique](#2-fonctionnel--traçabilité-technique)
3. [Structurel — Recette](#3-structurel--recette)
4. [Structurel — Traçabilité technique](#4-structurel--traçabilité-technique)
5. [Sécurité — Recette](#5-sécurité--recette)
6. [Sécurité — Traçabilité technique](#6-sécurité--traçabilité-technique)
7. [Anomalies trouvées en marge de ce cahier](#7-anomalies-trouvées-en-marge-de-ce-cahier)
8. [Contexte RNCP — Compétence C2.3.1](#8-contexte-rncp--compétence-c231)

---

Ce document répond à la compétence RNCP **C2.3.1**. Il reprend les fonctionnalités attendues du prototype (issues de `docs/USER_STORIES.md`) sous forme de scénarios exécutables, organisés en trois familles : **fonctionnel** (la fonctionnalité fait ce qu'elle doit), **structurel** (robustesse, cas limites, accès concurrent) et **sécurité** (protections d'accès).

**Comment lire ce cahier** — pour chaque famille, deux tableaux séparés, volontairement :
1. **Recette** : ce qu'un joueur fait, ce qu'il doit voir, ce qu'il a réellement vu. Rien de technique ici.
2. **Traçabilité technique** : comment chaque ligne a été vérifiée, avec code retour et référence de correctif le cas échéant. Sert à l'audit, pas à la lecture fonctionnelle.

Chaque scénario de ce cahier a été exécuté dans les conditions réelles de l'application (backend, base de données et logique métier réels, sans simulation ni mock), en suivant le parcours décrit en colonne « Parcours utilisateur ». Le résultat obtenu a systématiquement été constaté, jamais supposé — cette exécution a d'ailleurs révélé une anomalie (F13), depuis corrigée.

Légende statut : ✅ conforme · 🔧 anomalie détectée puis corrigée

---

## 1. Fonctionnel — Recette

| ID | Parcours utilisateur | Résultat attendu | Résultat obtenu | Statut |
|---|---|---|---|---|
| F01 | Connexion via Discord OAuth depuis l'accueil web | Redirection dashboard, session active, profil renseigné | Conforme | ✅ |
| F02 | Ouvrir la page Classement sans être connecté | Liste des joueurs visible, sans rang personnel | Avant correctif : page en erreur technique brute. Après : liste normale | 🔧 |
| F03 | Voyager vers une ville jamais visitée (`/map` ou page Carte) | Coût débité, voyage démarré, heure d'arrivée annoncée | Voyage Willowbrook → Ironhaven, 50 mazcoins débités, confirmation affichée | ✅ |
| F04 | Voyager vers une ville déjà visitée | Trajet gratuit | Retour à Ironhaven (déjà visitée) : aucun débit | ✅ |
| F05 | `/work` dans Discord | Gain entre 20 € et 30 € | +30 €, message citant le métier et la tâche | ✅ |
| F06 | `/daily` dans Discord | Récompense fixe de 5 € | +5 € exactement | ✅ |
| F07 | `/coinflip pile 50` — cas victoire | Mise créditée en cas de victoire | +50 €, message de victoire (2ᵉ essai sur 6) | ✅ |
| F08 | `/coinflip pile 50` — cas défaite | Mise débitée en cas de défaite | -50 €, message de défaite (1ᵉʳ essai) | ✅ |
| F09 | Achat en boutique (`/shop` ou page Boutique) | Prix exact débité, item ajouté à l'inventaire | Achat "Ciel Nocturne" 100 €, débit exact, confirmation | ✅ |
| F10 | Équiper un background possédé (`/inventory` ou web) | Le fond équipé change, visible sur profil et carte | Fond changé et confirmé sur le profil | ✅ |
| F11 | Équiper puis déséquiper un badge | Badge visible puis absent, sans erreur | Les deux étapes confirmées, aucune erreur | ✅ |
| F12 | `/profile` (soi-même) et `/profile utilisateur:<autre>` | Données du joueur ciblé, jamais celles de l'appelant | Les deux cas renvoient bien le bon profil | ✅ |
| F13 | Ouvrir "Mes serveurs" en étant admin d'au moins un serveur | Liste des serveurs administrés, statut du bot, lien d'invitation si absent | **Anomalie détectée** : page vide malgré des serveurs administrés → corrigée | 🔧 |
| F14 | Ouvrir "Commandes" sans être connecté | Liste filtrable, sans connexion requise | Conforme | ✅ |

## 2. Fonctionnel — Traçabilité technique

| ID | Vérification | Référence |
|---|---|---|
| F01 | Exécution manuelle réelle (compte Discord) | — |
| F02 | `GET /api/leaderboard` sans jeton : `401` avant, `200` (`user_rank: null`) après | Commit `b06cde4` |
| F03 | `POST /api/travel/start` → `travel_cost: 50` | `TravelController::start` |
| F04 | Même route, ville déjà dans `visited_cities` → `travel_cost: 0` | `TravelController::start` |
| F05 | `POST /api/commands/work` → `reward: 30`, dans `[20, 30]` | `CommandsController::work` |
| F06 | `POST /api/commands/daily` → `+5` exact | `CommandsController::daily` |
| F07/F08 | `POST /api/commands/coinflip` `{"choice":"pile","amount":50}` × 6 (3V/3D) | `CommandsController::coinflip` |
| F09 | `POST /api/shop/purchase` → `new_balance` cohérent, `owned: true` | `ShopController::purchaseItem` |
| F10 | `POST /api/profile/equip/background` puis `GET /api/profile/me` | `ProfileController::equipBackground` |
| F11 | `POST /api/profile/equip/badge` puis `.../unequip/badge` | Bug historique de collision déjà corrigé (cf. `docs/STRATEGIE_TESTS.md`) |
| F12 | Cas 2 authentifié via `X-Bot-Secret` + `X-Discord-User-Id` (mécanisme réel du bot), pas un JWT | `BotAuthenticator` |
| F13 | **Cause réelle** : `ServersController::listServers()` et `ProfileController::getAdminGuilds()` utilisaient le token OAuth **encore chiffré** (`TokenEncryptorService`) au lieu de le déchiffrer avant l'appel à Discord — l'appel échouait silencieusement côté Discord (401), et le code retombait sur une liste vide sans erreur visible (`DiscordApiClient::getCurrentUserGuilds`, `return []` sur tout code ≠ 200). **Correctif** : déchiffrement ajouté avant chaque appel Discord, et le rafraîchissement de token passe désormais par `UserService::updateUserTokens()` (qui re-chiffre correctement), au lieu de stocker les nouveaux tokens en clair comme c'était le cas avant. Revérifié : `GET /api/servers` renvoie les 7 serveurs administrés attendus, avec le bon statut de présence du bot sur chacun. *(Note opérationnelle : un redémarrage du conteneur `backend` a été nécessaire après le correctif — les workers PHP-FPM ne semblaient pas recharger le code modifié immédiatement, probablement un délai de propagation des dates de modification de fichier entre Windows et le conteneur.)* | Correctif appliqué |
| F14 | Contenu statique frontend (`commands.data.ts`), vérification visuelle uniquement | — |

---

## 3. Structurel — Recette

| ID | Parcours utilisateur | Résultat attendu | Résultat obtenu | Statut |
|---|---|---|---|---|
| S01 | Taper `/work` pendant un voyage en cours | Refus explicite | « Vous êtes en voyage ! Vous ne pouvez pas travailler pendant un déplacement. » | ✅ |
| S02 | Taper `/coinflip` pendant un voyage en cours | Refus explicite | « Vous êtes en voyage ! Vous ne pouvez pas jouer pendant un déplacement. » | ✅ |
| S03 | `/coinflip pile 5` puis `/coinflip pile 501` | Refus dans les deux cas, plafond annoncé | « La mise doit être entre 10€ et 500€. » (les deux fois) | ✅ |
| S04 | Avec 250 €, tenter `/coinflip pile 150` | Refus, la mise dépassant 50 % du solde | « Mise trop élevée ! Vous pouvez parier jusqu'à 125€ (50% de votre solde ou 500€ max). » | ✅ |
| S05 | Acheter un item plus cher que son solde | Refus, montants annoncés | « Vous n'avez pas assez d'argent. (0€ / 100€) » | ✅ |
| S06 | Racheter un item déjà possédé | Refus | « Vous possédez déjà cet item » | ✅ |
| S07 | Démarrer un second voyage pendant le premier | Refus | « Vous êtes déjà en voyage ! » | ✅ |
| S08 | Voyager vers une ville dont le coût dépasse le solde | Refus | « Vous n'avez pas assez d'argent. (0€ / 50€) » | ✅ |
| S09 | `/daily` puis `/daily` à nouveau immédiatement | Refus, décompte affiché | « Vous avez déjà réclamé votre récompense. Revenez dans 23h 59m. » | ✅ |
| S10 | `/work` puis `/work` à nouveau immédiatement | Refus, décompte affiché | « Vous êtes fatigué ! Reposez-vous encore 0h 59m avant de retravailler. » | ✅ |
| S11 | *Constat fait pendant l'exécution, pas un scénario prévu dans les 30 initiaux — pas un parcours joueur* | — | Le verrou anti-concurrence de `/coinflip` protège un cas mathématiquement inatteignable en usage séquentiel normal (le plafond à 50 % impose un solde ≥ 20 € dès la mise minimale) — pertinent uniquement contre deux requêtes strictement simultanées (double-clic, rejeu de requête), jamais par un joueur normal même maladroit | ✅ |

## 4. Structurel — Traçabilité technique

| ID | Vérification |
|---|---|
| S01/S02 | `409` sur `/api/commands/work` et `/api/commands/coinflip` pendant `traveling_to` actif |
| S03 | `COINFLIP_MIN=10` / `COINFLIP_MAX=500` (`CommandsController`) |
| S04 | `maxBet = min(floor(coins/2), 500)` — 250/2 = 125, conforme |
| S05/S06 | `ShopController::purchaseItem` — `402` (solde), `409` (déjà possédé) |
| S07/S08 | `TravelController::start` — `409` (déjà en voyage), `402` (solde) |
| S09/S10 | `429`, cooldowns `DAILY_COOLDOWN=86400s`, `WORK_COOLDOWN=3600s` |
| S11 | Vérifié par lecture de code (`CommandsController::coinflip`), non déclenché artificiellement (aurait nécessité deux requêtes réellement simultanées) |

---

## 5. Sécurité — Recette

*Certaines lignes décrivent une action volontairement anormale (rejouer un jeton, falsifier un secret) : ce n'est pas un parcours joueur, c'est le geste qu'un test de sécurité doit reproduire délibérément.*

| ID | Action testée | Résultat attendu | Résultat obtenu | Statut |
|---|---|---|---|---|
| SEC01 | Accéder à une fonctionnalité protégée sans être authentifié | Accès refusé | Refusé | ✅ |
| SEC02 | Un compte non-admin tente d'accéder aux Statistiques, via la page puis via l'API directement | Refusé dans les deux cas, indépendamment | Refusé des deux façons ; accès possible seulement en élevant réellement le compte en admin | ✅ |
| SEC03 | Se déconnecter, puis rejouer le jeton de la session terminée | Jeton rejeté malgré une expiration naturelle non atteinte | Rejeté | ✅ |
| SEC04 | Simuler un retour de connexion Discord avec un paramètre de sécurité falsifié | Connexion refusée | Refusée | ✅ |
| SEC05 | Demander un renouvellement de session sans le cookie associé | Refusé, message clair | Refusé | ✅ |
| SEC06 | Répéter la tentative de connexion rapidement, au-delà de la limite prévue | Blocage temporaire au-delà de 10/min | Bloqué après les premières tentatives | ✅ |
| SEC07 | Inspecter les en-têtes renvoyés par le serveur | Protections standards présentes | Les 4 protections attendues sont présentes | ✅ |
| SEC08 | Utiliser une session au-delà de sa durée de vie | Refus propre, pas d'erreur brute | Refusé proprement après expiration | ✅ |
| SEC09 | Le bot (ou un tiers) se présente avec un secret incorrect | Requête rejetée | Rejetée | ✅ |
| SEC10 | Observer les messages d'erreur reçus tout au long des tests | Jamais de détail technique exposé | Toujours un message clair, jamais une fuite technique | ✅ |

## 6. Sécurité — Traçabilité technique

| ID | Vérification | Référence historique |
|---|---|---|
| SEC01 | `401` sans en-tête `Authorization` | Ce défaut "refusé par défaut" a lui-même été un correctif — `ef059ca` (SU #192) : avant lui, une route non listée retombait sur un accès public |
| SEC02 | `403` (`ROLE_USER`) → `200` (`ROLE_ADMIN`), même compte | `StatsController`, `#[IsGranted('ROLE_ADMIN')]` + `adminGuard` frontend |
| SEC03 | `POST /api/auth/logout` puis réutilisation → `401` | `JwtBlacklistSubscriber` |
| SEC04 | `POST /api/auth/discord/callback` avec `state` invalide → `400` | `AuthController::discordCallback` |
| SEC05 | `POST /api/auth/refresh` sans cookie `mw_refresh` → `401` | `AuthController::refresh` |
| SEC06 | 10 appels/minute dépassés → `429` | `limiter.auth_callback` |
| SEC07 | `X-Content-Type-Options`, `X-Frame-Options`, `Strict-Transport-Security`, `Content-Security-Policy` présents | `SecurityHeadersSubscriber` |
| SEC08 | Jeton à durée de vie courte (15 s de test) : valide puis `401 Expired JWT Token` | Premier essai à 2 s faussé par le temps de génération du jeton lui-même, refait à 15 s |
| SEC09 | `X-Bot-Secret` incorrect → `401` | Comparaison corrigée par le passé — `bb6f402` (SU #186), `hash_equals()` contre les timing attacks |
| SEC10 | Cohérence observée sur toutes les erreurs de la session (401/402/403/409/429) | Corrigé par le passé — `5351c5b` (SU #180), suppression des `$e->getMessage()` exposés dans 13 contrôleurs |

---

## 7. Anomalies trouvées en marge de ce cahier

| Où | Anomalie | Statut |
|---|---|---|
| F02 | Classement inaccessible sans connexion malgré une intention publique | 🔧 Corrigée (`b06cde4`) |
| F13 | Page "Mes serveurs" vide pour un compte pourtant administrateur — token OAuth utilisé encore chiffré | 🔧 Corrigée (`ServersController` + `ProfileController`) |
| Historique (`a27bc74`) | `401` sur `/api/profile/me` — même famille que F02 | 🔧 Déjà corrigée avant ce cahier |
| Historique (`ef059ca`) | Nouvelles routes API publiques par défaut faute de règle explicite | 🔧 Déjà corrigée avant ce cahier |
| Historique (`bb6f402`) | Comparaison du secret bot vulnérable aux timing attacks | 🔧 Déjà corrigée avant ce cahier |
| Historique (`5351c5b`) | Messages d'exception exposés dans 13 contrôleurs | 🔧 Déjà corrigée avant ce cahier |
| Mémoire projet | `ProfileController::equipBadge` → collision d'identité d'entité, trouvée via les tests unitaires | 🔧 Déjà corrigée avant ce cahier |

---

## 8. Contexte RNCP — Compétence C2.3.1

| Critère d'évaluation | Réponse apportée |
|---|---|
| Le cahier reprend l'ensemble des fonctionnalités attendues | Tableau Fonctionnel — Recette (F01–F14), dérivé de `docs/USER_STORIES.md` |
| Tests fonctionnels, structurels et de sécurité conformes au plan défini | Trois familles, 34 scénarios, tableaux Recette + Traçabilité technique séparés |
| Scénarios de tests et résultats attendus rédigés | Parcours utilisateur réel, résultat attendu/obtenu en langage joueur, trace technique disjointe pour l'audit |
| Détection d'anomalies et de régressions | Deux anomalies trouvées et corrigées pendant la rédaction (F02, F13), cinq autres retrouvées dans l'historique du projet |
