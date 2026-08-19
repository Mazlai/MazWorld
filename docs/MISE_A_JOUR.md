# Manuel de mise à jour — MazWorld

**Présenté par Mickael FERNANDEZ**, étudiant M2 Développement Web, Ynov Campus

---

## Sommaire

1. [Versionnement](#1-versionnement)
2. [Cycle de vie du code](#2-cycle-de-vie-du-code)
3. [Mettre à jour les dépendances](#3-mettre-à-jour-les-dépendances)
4. [Migrations de base de données](#4-migrations-de-base-de-données)
5. [Mettre à jour une instance en production](#5-mettre-à-jour-une-instance-en-production)
6. [Notes de version](#6-notes-de-version)
7. [Signaler une anomalie](#7-signaler-une-anomalie)

---

Ce document décrit comment le code évolue jusqu'à la production : versionnement, mise à jour des dépendances, migrations de base de données, et mise à jour d'une instance déjà déployée. Pour les commandes de déploiement initial, voir le [manuel de déploiement](DEPLOIEMENT.md).

---

## 1. Versionnement

Le numéro de version fait foi dans `web/frontend/package.json` (versionnement sémantique `X.Y.Z`). À la fermeture d'une pull request `release/x.y.z` → `main` (mergée), le workflow `.github/workflows/release.yml` lit cette version, crée automatiquement le tag Git `vX.Y.Z` et publie une **GitHub Release** dont les notes reprennent le résumé rédigé à la main dans la description de la PR `release/x.y.z` (voir [§6](#6-notes-de-version)).

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

Dependabot recouvre en réalité deux fonctions séparées, actives toutes les deux sur ce dépôt, chacune avec sa propre fréquence et son propre déclencheur :

| Mécanisme | Déclencheur | Fréquence | Ce qu'il produit |
|---|---|---|---|
| **Mises à jour de version** (`dependabot.yml`) | Planifié | Hebdomadaire (lundi) | Une PR par dépendance ayant une nouvelle version compatible disponible |
| **Alertes de sécurité** (réglage GitHub natif) | CVE publiée sur une dépendance utilisée | Continu, dès la divulgation | Une PR immédiate visant la première version corrigée |

Chaque PR Dependabot passe par la même CI (`ci.yml`) que n'importe quelle autre pull request, avec lint, tests unitaires/intégration et build Docker de sanity-check. Une fois la CI au vert, la PR se merge en suivant la même stratégie de branches que le reste du projet (§2) : ne pas la merger directement dans `main`.

Pour une dépendance qui casse la CI après mise à jour, traiter la correction comme n'importe quel développement (branche `feature/SU/*` dédiée) plutôt que de forcer le merge de la PR Dependabot.

**Évaluer l'impact avant d'intégrer.** Une PR Dependabot au vert n'est pas mergée par réflexe. Trois critères tranchent :

| Critère | Question | Oriente vers |
|---|---|---|
| Amplitude du saut de version (SemVer) | Patch/mineure sans rupture d'API, ou majeure ? | Mineure → intégration directe ; majeure → chantier séparé |
| Paquet exécuté en service, ou seulement à la compilation | La dépendance tourne-t-elle en production, ou seulement dans l'outillage de build/test ? | En service → traiter en priorité ; build-only → exposition réelle plus faible |
| Coût du correctif lui-même | Le correctif direct casse-t-il une contrainte du projet (version d'un autre paquet, contrainte du framework) ? | Coût disproportionné → maintenir en l'état plutôt que forcer |

Trois issues possibles selon ces critères : **intégrer** (mise à jour directe une fois la CI verte), **reporter vers un chantier séparé** (saut de version trop large pour une mise à jour de routine, nécessitant son propre cycle de tests), ou **maintenir en l'état** (correctif disproportionné au regard de l'exposition réelle). L'état courant des alertes ouvertes se consulte directement dans l'onglet *Security* du dépôt, car un instantané chiffré ici deviendrait rapidement faux.

---

## 4. Migrations de base de données

Le schéma est géré par les migrations Doctrine (`web/backend/migrations/`).

**Créer une migration.** Après avoir modifié une entité (`web/backend/src/Entity/`) :

```bash
php bin/console doctrine:migrations:diff
```

génère un fichier de migration dans `web/backend/migrations/`. Relire le SQL généré avant de l'inclure dans la pull request, car `diff` reflète l'état des entités, pas nécessairement l'intention exacte du changement.

**Application.** Aucune commande manuelle n'est nécessaire en déploiement : `web/backend/docker/entrypoint.sh` exécute `doctrine:migrations:migrate --no-interaction` à chaque démarrage du conteneur `backend`, en dev comme en production. Une migration mergée sur `main` s'applique donc automatiquement au prochain redémarrage de la stack de production.

**Précaution.** Une migration non rétro-compatible (colonne supprimée, type modifié de façon destructive) doit être testée en développement avant merge, et une sauvegarde du volume `mysql_data` doit être faite avant la mise à jour en production (voir [Rollback](DEPLOIEMENT.md#5-rollback)) : les migrations ne redescendent pas de version automatiquement.

---

## 5. Mettre à jour une instance en production

Une fois une nouvelle version taguée (§1), la mise à jour d'une instance déjà déployée suit la même séquence que le déploiement initial (voir [manuel de déploiement §4.2](DEPLOIEMENT.md#42-construire-le-frontend-et-démarrer-la-stack)) : récupérer le nouveau tag, reconstruire le frontend, puis relancer `docker compose ... up -d`. Les migrations de schéma s'appliquent automatiquement au redémarrage (§4).

**Limite assumée.** Les conteneurs redémarrent avec `restart: unless-stopped` mais sans stratégie de mise à jour progressive (pas de blue-green ni de rolling update) : une coupure de service brève a lieu pendant le redémarrage du conteneur `backend`. Pour un projet de cette taille, ce compromis est jugé acceptable au regard de la complexité qu'ajouterait une bascule sans interruption.

---

## 6. Notes de version

Les notes de chaque GitHub Release reprennent la description de la pull request `release/x.y.z` → `main` qui a déclenché la publication (`gh release create --notes-file`, alimenté par `github.event.pull_request.body`), soit un résumé rédigé à la main à chaque release plutôt qu'un changelog généré automatiquement. Repli sur `gh release create --generate-notes` uniquement si cette PR n'a exceptionnellement aucune description.

Ce comportement remplace un premier essai avec `--generate-notes` seul, qui produisait une seule ligne inutile : les PR `release/x.y.z` → `main` étant fusionnées en *squash merge*, l'algorithme de GitHub n'avait plus qu'une seule PR à énumérer une fois le détail aplati.

---

## 7. Signaler une anomalie

Toute anomalie constatée (web, bot Discord, API) se signale via GitHub Issues, avec le gabarit dédié `.github/ISSUE_TEMPLATE/bug_report.md`, qui structure chaque signalement en 5 champs fixes :

| Champ | Rôle |
|---|---|
| **Comportement observé** | Ce qui se passe réellement |
| **Comportement attendu** | Ce qui devrait se passer |
| **Étapes de reproduction** | Séquence numérotée, exécutable telle quelle |
| **Environnement** | Interface concernée (web / bot Discord / API), branche, compte |
| **Contexte additionnel** | Logs, captures, hypothèse de cause si déjà identifiée |

L'ouverture applique automatiquement le label **`Bug`**, ce qui rend les anomalies filtrables parmi le reste des issues (`Feature`, `SU`, `Maintenance`). Le traitement suit ensuite le circuit adapté à sa gravité (§2 : chemin court `hotfix/*` pour une anomalie bloquante en production, `feature/SU/*` sinon). Une issue n'est fermée qu'une fois le correctif réellement fusionné, non lors de sa validation locale.
