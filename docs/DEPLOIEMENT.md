# Manuel de déploiement — MazWorld

**Présenté par Mickael FERNANDEZ** — Étudiant M2 Développement Web, Ynov Campus

---

## Sommaire

1. [Architecture](#1-architecture)
2. [Prérequis](#2-prérequis)
3. [Déploiement en développement](#3-déploiement-en-développement)
4. [Déploiement en production](#4-déploiement-en-production)
5. [Rollback](#5-rollback)
6. [Intégration et déploiement continus](#6-intégration-et-déploiement-continus)

---

Ce document explique comment déployer MazWorld, en développement comme en production. Les trois services applicatifs (backend Symfony, frontend Angular, bot Discord) et la base de données MySQL sont orchestrés par Docker Compose, avec **la même topologie dans les deux environnements** — seule la configuration change, via un fichier de surcouche dédié.

Pour le détail des choix d'architecture, la stratégie de branches et l'historique des incidents rencontrés pendant la mise en place de cette infrastructure, voir `docs/C2.1.1-environnement-deploiement.md` (branche `feature/SU/101-migration-deploiement-vps`).

---

## 1. Architecture

| Fichier compose | Rôle | Chargement |
|---|---|---|
| `docker-compose.yml` | Topologie commune : services, volumes, dépendances | Toujours |
| `docker-compose.override.yaml` | Développement : montage du code en direct (hot-reload), `ng serve`, `nodemon`, port MySQL exposé | Automatique avec `docker compose up` |
| `docker-compose.prod.yaml` | Production : certificats TLS, secrets par service, redémarrage automatique | Explicite, via `-f docker-compose.prod.yaml` |

| Service | Rôle | Actif en dev | Actif en prod |
|---|---|---|---|
| `nginx` | Reverse proxy | ✅ (proxifie vers `frontend`/`backend`) | ✅ (sert le build statique + TLS) |
| `backend` | API Symfony (PHP-FPM) | ✅ (code monté en direct) | ✅ |
| `mysql` | Base de données | ✅ (port 3307 exposé sur l'hôte) | ✅ |
| `bot` | Bot Discord | ✅ (`nodemon`, rechargement à chaud) | ✅ |
| `frontend` | Serveur de dev Angular (`ng serve`) | ✅ | ❌ |
| `frontend-build` | Build Angular one-shot (profil `prod`) | ❌ | ✅ |

Chaque service a son propre `Dockerfile` multi-stage (build séparé de l'exécution), ce qui permet des images de production allégées.

---

## 2. Prérequis

- Docker et le plugin Docker Compose (`docker compose version`)
- En production : un hôte (VPS ou équivalent) avec les ports 80 et 443 ouverts, un nom de domaine pointant dessus, et un certificat TLS déjà obtenu (Let's Encrypt) dans `/etc/letsencrypt` sur l'hôte — ce dossier est monté en lecture seule dans le conteneur `nginx`
- Une application Discord créée sur le [portail développeur Discord](https://discord.com/developers/applications) (identifiants OAuth + token de bot)

---

## 3. Déploiement en développement

```bash
docker compose up -d
```

Cette commande fusionne automatiquement `docker-compose.yml` et `docker-compose.override.yaml`, puis démarre :

- **nginx** — `http://localhost:8080`, point d'entrée unique du reverse proxy
- **backend** — code monté depuis `web/backend/`, toute modification est prise en compte sans rebuild
- **frontend** — `ng serve --host 0.0.0.0`, rechargement à chaud, `http://localhost:4200`
- **mysql** — MySQL 8, exposé sur `localhost:3307` pour s'y connecter avec un client externe
- **bot** — `nodemon` + `ts-node`, rechargement à chaud sur modification de `bot/src`

Avant de démarrer, chaque service backend a besoin de son fichier d'environnement (non commité) :

```bash
cp web/backend/.env.example web/backend/.env
cp bot/.env.example bot/.env
```

Les valeurs par défaut du `.env.example` backend fonctionnent telles quelles en développement (base MySQL locale, secrets de test). Pour le bot, renseigner `TOKEN`, `BOT_ID` et `GUILD_ID` avec les identifiants de votre application Discord de développement.

**Alternative sans Docker** : `npm run install:all` puis `npm run dev` à la racine démarre en parallèle `symfony server:start` (port 8008), `ng serve` et le bot — nécessite PHP 8.2+, Symfony CLI, Node 22 et une instance MySQL locale accessible en 3307.

---

## 4. Déploiement en production

### 4.1 Préparer les secrets

Chaque service reçoit uniquement ses propres identifiants, via un fichier `env_file` dédié (principe de moindre privilège) :

| Fichier (non commité) | Service | À créer à partir de |
|---|---|---|
| `.env.prod` (racine) | `mysql` | `.env.prod.example` |
| `web/backend/.env.prod` | `backend` | `web/backend/.env.example` |
| `bot/.env.prod` | `bot` | `bot/.env.example` |

Points d'attention lors du remplissage :

- `web/backend/.env.prod` : passer `APP_ENV=prod`, générer une vraie valeur pour `APP_SECRET`, `JWT_PASSPHRASE`, `BOT_API_SECRET`, et pour `APP_ENCRYPTION_KEY` avec `php -r "echo base64_encode(random_bytes(32)) . PHP_EOL;"`. `DATABASE_URL` doit pointer vers le service `mysql` interne (`mysql://<user>:<password>@mysql:3306/mazworld?...`) et non `127.0.0.1:3307` (qui n'est exposé qu'en dev). Renseigner aussi les identifiants OAuth Discord de production (`DISCORD_CLIENT_ID`, `DISCORD_CLIENT_SECRET`, `DISCORD_REDIRECT_URI` pointant vers le domaine réel).
- `bot/.env.prod` : `TOKEN` et `BOT_ID` de l'application Discord de production, `API_URL` pointant vers `http://nginx` (réseau interne Docker), et le **même** `BOT_API_SECRET` que celui du backend.
- `.env.prod` (racine) : identifiants MySQL uniquement.

### 4.2 Construire le frontend et démarrer la stack

```bash
# Récupérer la version taguée à déployer
git fetch --tags && git checkout vX.Y.Z

# Build de la version statique du frontend (conteneur one-shot)
docker compose -f docker-compose.yml -f docker-compose.prod.yaml --profile prod run --rm frontend-build

# Démarrage / mise à jour de la stack
docker compose -f docker-compose.yml -f docker-compose.prod.yaml up -d
```

Au démarrage, `entrypoint.sh` (partagé par tous les environnements, dans `web/backend/docker/`) exécute automatiquement, dans l'ordre : installation des dépendances Composer si absentes, génération des clés JWT si absentes, attente de la disponibilité de MySQL, application des migrations Doctrine, puis — en production uniquement — réchauffement du cache Symfony et installation des assets. Aucune commande manuelle supplémentaire n'est nécessaire après le `up -d`.

Les clés JWT sont persistées dans un volume nommé `jwt_keys` : elles survivent aux redéploiements. Supprimer ce volume invalide immédiatement toutes les sessions actives (tous les tokens émis avec l'ancienne paire de clés deviennent invalides).

### 4.3 Vérifications post-déploiement

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yaml logs -f backend
docker compose -f docker-compose.yml -f docker-compose.prod.yaml ps
```

Vérifier que les cinq services sont `Up`/`healthy` et que les logs du backend ne montrent pas d'erreur de connexion à la base ou de migration.

---

## 5. Rollback

```bash
git checkout <tag-précédent>
docker compose -f docker-compose.yml -f docker-compose.prod.yaml --profile prod run --rm frontend-build
docker compose -f docker-compose.yml -f docker-compose.prod.yaml up -d
```

Si le rollback implique de revenir en arrière sur une migration de schéma non rétro-compatible, restaurer au préalable une sauvegarde du volume `mysql_data` — les migrations Doctrine appliquées automatiquement au démarrage ne redescendent pas de version seules.

---

## 6. Intégration et déploiement continus

Deux workflows GitHub Actions accompagnent ce déploiement manuel :

- **`ci.yml`** — à chaque pull request, exécute lint (frontend/backend), tests unitaires et d'intégration, fusion de la couverture, et un `docker build` de sanity-check des trois images (sans publication).
- **`release.yml`** — à la fermeture d'une pull request `release/x.y.z` → `main`, crée automatiquement le tag Git correspondant (version lue depuis `web/frontend/package.json`) et publie une GitHub Release.

Le détail de chaque job, les secrets utilisés et les choix de conception (pourquoi PCOV plutôt que Xdebug, pourquoi un `env_file` par service plutôt qu'un seul partagé, etc.) sont documentés dans `docs/C2.1.1-environnement-deploiement.md`.
