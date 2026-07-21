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

L'application est alors disponible sur `http://localhost:8080`. Le détail des prérequis, des variables d'environnement et du déploiement en production se trouve dans le [manuel de déploiement](docs/DEPLOIEMENT.md).

Sans Docker, en local :

```bash
npm run install:all
npm run dev
```

démarre en parallèle le backend (`symfony server:start`), le frontend (`ng serve`) et le bot (`nodemon`).

## Documentation

| Document | Contenu |
|---|---|
| [Manuel d'utilisation](docs/GUIDE_UTILISATION.md) | Fonctionnalités du jeu, interface web et commandes du bot |
| [Manuel de déploiement](docs/DEPLOIEMENT.md) | Installation, environnements dev/prod, variables d'environnement |
| [Manuel de mise à jour](docs/MISE_A_JOUR.md) | Versionnement, migrations de base de données, mise à jour d'une instance en production |
| [Stratégie de tests](docs/STRATEGIE_TESTS.md) | Tests unitaires et d'intégration, couverture |
| [Audit d'accessibilité](docs/AUDIT_ACCESSIBILITE.md) | Conformité WCAG 2.1 AA |
| [Sécurité — OWASP Top 10](docs/SECURITE_OWASP.md) | Couverture des 10 failles principales |
| [User stories](docs/USER_STORIES.md) | Inventaire des fonctionnalités attendues |
| [Cahier de recettes](docs/CAHIER_DE_RECETTES.md) | Scénarios de test fonctionnels, structurels et de sécurité |
