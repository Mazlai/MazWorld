# MazWorld

Jeu économique de voyage jouable à la fois via un bot Discord et une application web — projet réalisé dans le cadre d'une certification RNCP niveau Master.

Les joueurs voyagent entre des villes, y travaillent pour gagner des mazcoins, achètent des équipements (backgrounds, badges) en boutique et grimpent au classement. Le compte est partagé entre les deux interfaces : la progression faite sur Discord se retrouve sur le web, et inversement.

## Stack technique

| Composant | Rôle | Technologies |
|---|---|---|
| **Bot Discord** | Interface de jeu en commandes slash | Node.js 22, TypeScript, discord.js |
| **Backend** | API applicative | Symfony 7 (PHP 8.2+), Doctrine, MySQL 8 |
| **Frontend** | Interface web | Angular (composants autonomes, signaux) |
| **Infrastructure** | Orchestration des services | Docker Compose, nginx (reverse proxy) |
| **CI/CD** | Qualité, tests, publication | GitHub Actions (lint, tests, couverture, build Docker, release automatisée) |

## Démarrage rapide

Avec Docker (recommandé, mêmes services qu'en production) :

```bash
docker compose up -d
```

L'application est alors disponible sur `http://localhost:8080`. Le détail des prérequis, des variables d'environnement et du déploiement en production se trouve dans le [manuel de déploiement](docs/DEPLOYMENT.md).

Sans Docker, en local :

```bash
npm run install:all
npm run dev
```

démarre en parallèle le backend (`symfony server:start`), le frontend (`ng serve`) et le bot (`nodemon`).

## Documentation

| Document | Contenu |
|---|---|
| [Manuel d'utilisation](docs/USER_GUIDE.md) | Fonctionnalités du jeu, interface web et commandes du bot |
| [Manuel de déploiement](docs/DEPLOYMENT.md) | Installation, environnements dev/prod, variables d'environnement |
| [Manuel de mise à jour](docs/UPDATE.md) | Versionnement, migrations de base de données, mise à jour d'une instance en production |
| [Stratégie de tests](docs/TESTING.md) | Tests unitaires et d'intégration, couverture |
| [Audit d'accessibilité](docs/accessibility-audit.md) | Conformité WCAG 2.1 AA |
