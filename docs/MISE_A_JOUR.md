# Manuel de mise à jour — MazWorld

**Présenté par Mickael FERNANDEZ** — Étudiant M2 Développement Web, Ynov Campus

---

## Sommaire

1. [Versionnement](#1-versionnement)
2. [Cycle de vie du code](#2-cycle-de-vie-du-code)
3. [Mettre à jour les dépendances](#3-mettre-à-jour-les-dépendances)
4. [Migrations de base de données](#4-migrations-de-base-de-données)
5. [Mettre à jour une instance en production](#5-mettre-à-jour-une-instance-en-production)
6. [Notes de version](#6-notes-de-version)

---

Ce document décrit comment le code évolue jusqu'à la production : versionnement, mise à jour des dépendances, migrations de base de données, et mise à jour d'une instance déjà déployée. Pour les commandes de déploiement initial, voir le [manuel de déploiement](DEPLOIEMENT.md).

---

## 1. Versionnement

Le numéro de version fait foi dans `web/frontend/package.json` (versionnement sémantique `X.Y.Z`). À la fermeture d'une pull request `release/x.y.z` → `main` (mergée), le workflow `.github/workflows/release.yml` lit cette version, crée automatiquement le tag Git `vX.Y.Z` et publie une **GitHub Release** avec des notes générées automatiquement à partir des pull requests incluses.

Il n'y a donc rien à taguer manuellement : incrémenter `web/frontend/package.json` sur la branche `release/x.y.z` avant de merger vers `main` suffit à déclencher la publication.

---

## 2. Cycle de vie du code

Le projet suit un modèle inspiré de Gitflow, validé automatiquement par `.github/workflows/branch-strategy.yml` à chaque pull request :

```
feature/SU/xx  →  feature/xx  →  develop  →  release/x.y.z  →  main
```

- Une sous-tâche (`feature/SU/xx`) ne peut être mergée que dans une branche `feature/*`.
- Une `feature/*` ne peut être mergée que dans `develop` (ou `main` → `develop`, pour resynchroniser).
- Seule une branche `release/*` peut être mergée dans `main`.
- Une branche `release/*` n'accepte que `develop` ou `hotfix/*` en source.

Un correctif urgent suit un chemin raccourci : `hotfix/*` → `release/x.y.z` → `main`, sans repasser par tout le cycle `feature/SU/*`.

Deux rulesets GitHub protègent `main` et `develop` (suppression et force-push bloqués, pull request obligatoire pour merger dans `main`).

---

## 3. Mettre à jour les dépendances

Dependabot est configuré (`.github/dependabot.yml`) pour ouvrir des pull requests chaque **lundi**, sur les trois écosystèmes du projet :

| Écosystème | Répertoire |
|---|---|
| Composer | `web/backend` |
| npm | `web/frontend` |
| npm | `bot` |

Chaque PR Dependabot passe par la même CI (`ci.yml`) que n'importe quelle autre pull request — lint, tests unitaires/intégration, build Docker de sanity-check. Une fois la CI au vert, la PR se merge en suivant la même stratégie de branches que le reste du projet (§2) : ne pas la merger directement dans `main`.

Pour une dépendance qui casse la CI après mise à jour, traiter la correction comme n'importe quel développement (branche `feature/SU/*` dédiée) plutôt que de forcer le merge de la PR Dependabot.

---

## 4. Migrations de base de données

Le schéma est géré par les migrations Doctrine (`web/backend/migrations/`).

**Créer une migration** — après avoir modifié une entité (`web/backend/src/Entity/`) :

```bash
php bin/console doctrine:migrations:diff
```

génère un fichier de migration dans `web/backend/migrations/`. Relire le SQL généré avant de l'inclure dans la pull request — `diff` reflète l'état des entités, pas nécessairement l'intention exacte du changement.

**Application** — aucune commande manuelle n'est nécessaire en déploiement : `web/backend/docker/entrypoint.sh` exécute `doctrine:migrations:migrate --no-interaction` à chaque démarrage du conteneur `backend`, en dev comme en production. Une migration mergée sur `main` s'applique donc automatiquement au prochain redémarrage de la stack de production.

**Précaution** — une migration non rétro-compatible (colonne supprimée, type modifié de façon destructive) doit être testée en développement avant merge, et une sauvegarde du volume `mysql_data` doit être faite avant la mise à jour en production (voir [Rollback](DEPLOIEMENT.md#5-rollback)) : les migrations ne redescendent pas de version automatiquement.

---

## 5. Mettre à jour une instance en production

Une fois une nouvelle version taguée (§1), la mise à jour d'une instance déjà déployée suit la même séquence que le déploiement initial (voir [manuel de déploiement §4.2](DEPLOIEMENT.md#42-construire-le-frontend-et-démarrer-la-stack)) : récupérer le nouveau tag, reconstruire le frontend, puis relancer `docker compose ... up -d`. Les migrations de schéma s'appliquent automatiquement au redémarrage (§4).

**Limite assumée** — les conteneurs redémarrent avec `restart: unless-stopped` mais sans stratégie de mise à jour progressive (pas de blue-green ni de rolling update) : une coupure de service brève a lieu pendant le redémarrage du conteneur `backend`. Pour un projet de cette taille, ce compromis est jugé acceptable au regard de la complexité qu'ajouterait une bascule sans interruption.

---

## 6. Notes de version

Les notes de chaque GitHub Release sont générées automatiquement (`gh release create --generate-notes`) à partir des pull requests mergées depuis le tag précédent — aucun changelog n'est tenu à la main.
