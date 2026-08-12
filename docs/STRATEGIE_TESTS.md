# Stratégie de tests — MazWorld

**Présenté par Mickael FERNANDEZ** — Étudiant M2 Développement Web, Ynov Campus

---

## Sommaire

1. [Backend (Symfony)](#backend-symfony)
2. [Frontend (Angular)](#frontend-angular)
3. [Bot Discord (Node/TypeScript)](#bot-discord-nodetypescript)

---

Ce document centralise la stratégie de tests du projet MazWorld. Chaque module dispose de sa propre section détaillant les catégories de tests, les commandes et les choix de conception.

---

## Backend (Symfony)

### Vue d'ensemble

Le backend Symfony est couvert par deux catégories de tests clairement séparées, accessibles via les groupes PHPUnit `unit` et `integration`.

| Catégorie | Groupe PHPUnit | Base de données |
|-----------|---------------|-----------------|
| Tests unitaires (TU) | `unit` | Non |
| Tests d'intégration (TI) | `integration` | Oui (MySQL) |

Couverture : **77.82 % des lignes**, **82.04 % des méthodes** — 301 tests, 744 assertions (rapport HTML : `web/backend/coverage-reports/07-final/` — seul rapport de couverture conservé dans le dépôt, les autres étant exclus via `.gitignore`).

**Couverture isolée par groupe** : le chiffre ci-dessus combine TU et TI. En isolant `--group unit` seul (`php bin/phpunit --group unit --coverage-text`), sans base de données :

| Périmètre | Lignes | Méthodes | Classes |
|---|---|---|---|
| TU seul (`--group unit`) | 26.55 % | 50.70 % | 28.89 % |
| TU + TI combinés | 77.82 % | 82.04 % | — |

L'écart s'explique directement par le choix de conception ci-dessous : les 13 controllers et les 2 repositories à requêtes DQL custom, testés en intégration plutôt qu'en unitaire, représentent une part importante des lignes du code source. La couverture en lignes isolée passe sous 50 %, mais la couverture en méthodes reste au-dessus. Les méthodes des couches non couvertes en TU sont en nombre plus faible que leur nombre de lignes (controllers avec peu de méthodes mais un corps HTTP verbeux).

---

### Prérequis

- PHP 8.2+
- Les dépendances doivent être installées : `composer install` depuis `web/backend/`
- Service MySQL démarré sur le port 3307 (requis uniquement pour les TI)

---

### Commandes

```bash
# Depuis web/backend/

# Suite complète (TU + TI)
php bin/phpunit

# TU seulement — pas de base de données requise
php bin/phpunit --group unit

# TI seulement — base de données MySQL requise
php bin/phpunit --group integration

# Un fichier précis
php bin/phpunit tests/Security/BotAuthenticatorTest.php

# Un test précis
php bin/phpunit tests/Security/BotAuthenticatorTest.php --filter testAuthenticateCreatesNewUserWhenNotFound

# Avec rapport de couverture HTML
php bin/phpunit --coverage-html coverage-reports/mon-rapport
```

---

### Structure des tests

```
web/backend/tests/
├── Controller/API/       # TI — Tests HTTP via Symfony WebTestCase
│   ├── AbstractApiWebTestCase.php   (base commune : transaction rollback)
│   ├── AuthControllerTest.php
│   ├── CityControllerTest.php
│   ├── CommandsControllerTest.php
│   ├── InventoryControllerTest.php
│   ├── JobControllerTest.php
│   ├── LeaderboardControllerTest.php
│   ├── ProfileControllerTest.php
│   ├── RecordsControllerTest.php
│   ├── RouteControllerTest.php
│   ├── ServersControllerTest.php
│   ├── ShopControllerTest.php
│   ├── StatsControllerTest.php
│   └── TravelControllerTest.php
├── Repository/           # TI — Requêtes DQL via Symfony KernelTestCase
│   ├── CityRepositoryTest.php
│   └── ShopItemRepositoryTest.php
├── Entity/               # TU — Logique métier des entités (getters/setters, invariants)
├── EventSubscriber/      # TU — Abonnés aux événements Symfony/JWT
├── Security/             # TU — Authentification (BotAuthenticator, UserProvider)
└── Service/              # TU — Services métier (Discord OAuth, UserService, TokenEncryptor)
```

---

### Choix de conception

#### Pourquoi séparer TU et TI ?

J'ai voulu deux niveaux distincts, activables séparément, pour répondre à deux besoins différents :
- **TU** (`--group unit`) : aucune dépendance externe. Rapides (< 1 s), exécutables en CI sans base de données. Vérifient la logique pure des classes en isolation avec des mocks.
- **TI** (`--group integration`) : requièrent MySQL. Vérifient que les couches interagissent correctement : requêtes SQL effectives, cycle requête/réponse HTTP complet, middlewares Symfony.

#### Isolation des TI par rollback transactionnel

`AbstractApiWebTestCase` ouvre une transaction en `setUp()` et la rollback en `tearDown()`. Chaque test est donc isolé sans avoir besoin de tronquer les tables ni de recharger les fixtures.

```php
protected function setUp(): void
{
    $this->client = static::createClient();
    $this->em     = static::getContainer()->get(EntityManagerInterface::class);
    $this->em->getConnection()->beginTransaction();
}

protected function tearDown(): void
{
    $this->em->getConnection()->rollBack();
    parent::tearDown();
}
```

#### Pourquoi les TI apparaissent « Risky » dans PHPUnit 11 ?

PHPUnit 11 vérifie que les tests ne laissent pas de gestionnaires d'exceptions pendants. Symfony WebTestCase en installe un pour capturer les erreurs HTTP. Cette combinaison produit le message *"Test code or tested code did not remove its own exception handlers"*. Il s'agit d'une incompatibilité connue entre PHPUnit 11 et Symfony 7, en sachant que les tests passent (exit code 0) et aucune assertion n'échoue.

#### Tests de repository : valeur ajoutée

Les tests de repository (TI) ne valident pas les données des fixtures — ils valident que les **QueryBuilders DQL sont sémantiquement corrects** :
- Les clauses `WHERE` filtrent effectivement
- Les clauses `ORDER BY` sont appliquées par MySQL
- Les cas limites (résultat vide) sont bien gérés

Un bug dans un alias DQL ne serait pas détecté par les tests de controller (qui testent la couche HTTP).

Les autres repositories (`UserRepository`, `RouteRepository`, `UserInventoryRepository`, `UserEquippedBadgeRepository`, `VisitedCityRepository`, `CityJobRepository`) ne possèdent aucune méthode DQL custom : c'est uniquement des délégations Doctrine standards. Les tester reviendrait à tester l'ORM lui-même : non pertinent.

Les fixtures (`AppFixtures`, `ShopFixtures`) ne sont pas testées directement car les TI de controllers les valident implicitement : si `GET /api/cities` retourne 6 villes avec les bons thèmes, les fixtures ont forcément fonctionné.

#### Mocks et Intelephense

Les propriétés mock utilisent le pattern `/** @var Interface&MockObject */` pour que l'IDE reconnaisse les méthodes PHPUnit (`expects()`, `method()`). Intelephense indexe automatiquement `vendor/phpunit/phpunit` — après réindexation du projet, les avertissements disparaissent.

Si les avertissements persistent, déclencher manuellement la réindexation : `Ctrl+Shift+P → Intelephense: Index workspace`.

---

### Contexte RNCP — Compétence C2.2.2

Cette suite de tests répond à l'exigence de couverture majoritaire (> 50 %) requise pour la compétence **C2.2.2 — Réaliser des tests unitaires et d'intégration**.

| Couche testée | Type | Preuve |
|---------------|------|--------|
| Entités (invariants métier) | TU | `tests/Entity/` |
| Services (OAuth Discord, UserService, crypto) | TU | `tests/Service/` |
| Sécurité (BotAuthenticator, UserProvider) | TU | `tests/Security/` |
| Abonnés événements (JWT, rate limit, headers) | TU | `tests/EventSubscriber/` |
| Controllers API (13 endpoints, flux HTTP complets) | TI | `tests/Controller/API/` |
| Repositories (requêtes DQL, filtres, tri) | TI | `tests/Repository/` |

---

## Frontend (Angular)

### Vue d'ensemble

Le frontend Angular est couvert par des tests unitaires et d'intégration composants (TI-composants), exécutés via **Vitest** (moteur de test intégré à `@angular/build:unit-test` depuis Angular 19).

Couverture : **62.48 % des lignes** (911/1458), **59.82 % des fonctions** (201/336), **74.66 % des branches** (554/742) — 232 tests, 31 fichiers (rapport HTML : `web/frontend/coverage/01-final/`).

Le rapport inclut **tous** les fichiers sources, y compris les templates `.html` et les composants de fonctionnalité dont le rendu n'est pas directement ciblé par les tests. Les chiffres sont donc représentatifs de la couverture réelle de l'ensemble du codebase.

Une version antérieure de ce document indiquait 73.43 % de lignes. Trois causes distinctes expliquent l'écart, vérifiées empiriquement :

1. **Les templates Angular (`.html`) sont désormais mesurés séparément des classes `.ts`** : la mesure précédente ne comptait que les fichiers `.ts`. Un seul rendu (`detectChanges()`) par test ne déclenche qu'une fraction des branches `@if`/`@for` conditionnelles sur les templates conséquents, ce qui fait mécaniquement chuter la couverture agrégée (classe + template) des features qui affichent des **listes** de données dynamiques :

   | Feature | Lignes de template | `@for` | `@if` | Couverture agrégée |
   |---|---|---|---|---|
   | records | 167 | 1 | 5 | 19.9 % |
   | shop | 172 | 4 | 9 | 27.33 % |
   | map | 209 | 4 | 10 | 27.79 % |
   | inventory | 171 | 4 | 13 | 32.07 % |
   | leaderboard | 79 | 1 | 3 | 45.77 % |
   | servers | 115 | 2 | 13 | 46.95 % |
   | stats | 56 | 0 | 3 | 83.54 % |
   | home | — | — | — | 93.23 % |
   | profile | 130 | 1 | 3 | 93.33 % |
   | commands | — | — | — | 100 % |
   | dashboard | 33 | 0 | 2 | 100 % |

   Les 6 premières features ont 4 fois plus de boucles `@for`/blocs `@if` en moyenne que les 5 suivantes, ce qui est cohérent avec le fait qu'elles affichent des collections (routes, items, entrées de classement, serveurs, records par catégorie) plutôt qu'une entité unique ou du contenu majoritairement statique. Ce n'est pas un objectif délibéré de la suite de tests, contrairement à la couverture de logique : c'est un effet de bord du rendu initial, qui varie avec la complexité structurelle du template, pas avec la qualité du test.
2. **L'environnement n'est pas parfaitement reproductible** — le service frontend utilise l'image Docker `node:22` (tag flottant, non figé sur un patch précis). Versions de `vitest`/`@vitest/coverage-v8`/`@angular/build` et fichiers de configuration vérifiés identiques entre les deux mesures ; seule la version exacte de Node/V8 sous-jacente a pu différer, ce qui affecte le comportement de l'API de couverture native de V8 sur les modules jamais chargés (routes en lazy-loading sans test dédié).
3. **La couverture V8 elle-même n'est pas déterministe d'une exécution à l'autre, même sans rien changer**. Je m'en suis aperçu par hasard, en relançant `npx ng test --no-watch --coverage` deux fois de suite, sur la même machine, sans aucune modification de code entre les deux : `auth.service.ts` est passé de 69.84 % à 88.88 % de lignes couvertes selon l'exécution, alors que les 8 tests du fichier restent strictement identiques et passent à chaque fois. Ça m'a d'abord fait douter de mes propres mesures. En isolant le fichier(`--include auth.service.spec.ts`) je retombe systématiquement sur 69.84 % ; c'est uniquement lors d'une exécution de la suite complète, où Vitest répartit les fichiers de test sur plusieurs workers en parallèle, que le chiffre varie — la fusion des rapports de couverture V8 entre workers n'est pas garantie stable à l'échelle d'un fichier. L'effet reste heureusement contenu au niveau agrégat (62.48 % → 63.16 % de lignes entre deux runs complets, contre un écart de ~19 points sur ce seul fichier) et n'affecte pas les pourcentages du tableau `@for`/`@if` ci-dessous, revérifiés identiques sur les deux runs. Ce phénomène est propre à l'instrumentation V8 : la couverture backend (Xdebug/PCOV côté PHPUnit) a été revérifiée strictement identique (26.55 % TU seul, à la décimale près) sur deux exécutions successives.

Le nombre de tests/fichiers de composants et la couverture de **logique métier** (fonctions extraites, computed signals, services) restent la preuve de valeur pour la compétence RNCP puisque c'est elle qui progresse avec l'ajout de tests (voir les 6 services ci-dessous), pas le rendu de template.

En me relisant, je suis tombé sur un vrai trou : `HomeComponent` et `CommandsComponent` (routes en lazy-loading, jamais exercées par aucun test existant) étaient à **0 % strict**. Contrairement aux écrans que j'ai délibérément laissés de côté, ce n'était pas un choix : juste un oubli sur une logique réelle, même minime (`HomeComponent.login()` déclenche l'OAuth Discord, `CommandsComponent.commandsFor()` filtre par catégorie). Ajouté depuis (`home.component.spec.ts`, `commands.component.spec.ts`).

**Pas de séparation TU/TI isolable côté frontend** : contrairement au backend (groupes PHPUnit `unit`/`integration` filtrables en une commande), Vitest/Angular ne propose ici aucun mécanisme de tag ou de projet séparant les tests. Les tests de composants passent tous par `TestBed`, y compris ceux qui ne dépendent d'aucune API (ex. les guards utilisent `TestBed.runInInjectionContext()`). Isoler un chiffre « TU pur » nécessiterait de reconstituer manuellement une liste de fichiers, sans commande unique pour le faire. Le chiffre combiné ci-dessus est donc présenté tel quel, en cohérence avec la nature des tests Angular modernes plutôt qu'en simulant une séparation qui n'existe pas dans l'outillage.

---

### Prérequis

- Node 22+ et `npm install` depuis `web/frontend/`
- Package `@vitest/coverage-v8` requis pour le rapport de couverture (`npm install --save-dev @vitest/coverage-v8`)

---

### Commandes

```bash
# Depuis web/frontend/

# Suite complète (watch désactivé)
npx ng test --no-watch

# Avec rapport de couverture (texte)
npx ng test --no-watch --coverage

# Avec rapport HTML
npx ng test --no-watch --coverage --coverage-reporters html --coverage-reporters json-summary

# Un fichier précis
npx ng test --no-watch --include src/app/core/services/auth.service.spec.ts
```

---

### Structure des tests

```
web/frontend/src/
├── app/
│   ├── app.spec.ts                                       # TI-comp — composant racine (routing, accessibilité)
│   ├── core/
│   │   ├── guards/
│   │   │   └── auth.guard.spec.ts                       # TU — authGuard, guestGuard, adminGuard
│   │   ├── interceptors/
│   │   │   └── jwt.interceptor.spec.ts                  # TI — JWT injection, URLs publiques/privées, SSR
│   │   ├── services/
│   │   │   ├── auth-storage.service.spec.ts             # TU — sessionStorage, signaux, SSR
│   │   │   ├── auth.service.spec.ts                     # TI — OAuth Discord, signals computés
│   │   │   ├── profile.service.spec.ts                  # TI — URL, mapping res.profile, erreurs HTTP
│   │   │   ├── inventory.service.spec.ts                # TI — URL/méthode, payloads snake_case
│   │   │   ├── records.service.spec.ts                  # TI — URL/méthode
│   │   │   ├── servers.service.spec.ts                  # TI — URL/méthode
│   │   │   ├── shop.service.spec.ts                     # TI — URL/méthode, payloads snake_case
│   │   │   ├── stats.service.spec.ts                    # TI — URL/méthode
│   │   │   └── travel.service.spec.ts                   # TI — URL/méthode, payload snake_case
│   │   └── utils/
│   │       └── profile.utils.spec.ts                    # TU — badges, fonds, formatage date
│   ├── features/
│   │   ├── auth/auth-callback.component.spec.ts         # TU — mapping erreurs OAuth, flux succès
│   │   ├── commands/commands.component.spec.ts          # TU — commandsFor() filtrage par catégorie
│   │   ├── dashboard/dashboard.component.spec.ts        # TI — isLoading sur erreur, rank silencieux
│   │   ├── home/home.component.spec.ts                  # TU — déclenchement login() Discord
│   │   ├── inventory/inventory.component.spec.ts        # TI — éviction slot, suppression clé badge
│   │   ├── leaderboard/leaderboard.component.spec.ts    # TU — getRankEmoji, pagination, userRank
│   │   ├── map/map.component.spec.ts                    # TU — formatDuration, canAffordTravel, visualRoutes
│   │   ├── profile/profile.component.spec.ts            # TI — computed null-safety, retry reset
│   │   ├── records/records.component.spec.ts            # TU — fmt(), explorationPct div/0
│   │   ├── servers/servers.component.spec.ts            # TI — presentCount, fallback silencieux, sécurité
│   │   ├── shop/shop.component.spec.ts                  # TI — tri filteredItems, canBuy(), reset page
│   │   └── stats/stats.component.spec.ts                # TU — fmt() (impl. dupliquée), set atomique
│   └── shared/
│       ├── components/header/header.component.spec.ts   # TI-comp — auth branches, admin gate, clavier
│       └── components/ui/
│           ├── avatar/avatar.component.spec.ts          # TI-comp — src/fallback, initiales, taille
│           ├── badge/badge.component.spec.ts            # TI-comp — 5 variantes sémantiques
│           ├── empty-state/empty-state.component.spec.ts # TI-comp — titre, description, icône
│           ├── spinner/spinner.component.spec.ts        # TI-comp — taille, label, a11y
│           └── stat-card/stat-card.component.spec.ts    # TI-comp — label, valeur, variante
```

---

### Choix de conception

#### Vitest, pas Jasmine/Karma

Angular 21 utilise `@angular/build:unit-test` avec Vitest comme exécuteur natif. L'API diffère de Jasmine : `vi.fn()` (pas `jasmine.createSpyObj`), `.mockReturnValue()` (pas `.and.returnValue()`), `toBe(true/false)` (pas `toBeTrue()`/`toBeFalse()`).

#### Couverture ciblée sur la logique critique

Les composants de fonctionnalité (dashboard, carte, profil, boutique, classement...) ont chacun un test dédié, mais celui-ci cible leur **logique** (fonctions extraites, computed signals, tri, pagination ; voir la liste des fichiers ci-dessus), pas le **rendu complet du template** : ils dépendent d'API REST actives et de données dynamiques, et générer assez de variantes de données mockées pour couvrir tout le template produirait des tests fragiles sans valeur ajoutée. La couverture est concentrée sur :

- **Guards** — logique d'accès (auth, guest, admin)
- **Intercepteur JWT** — injection du token, URLs publiques
- **Services** — `AuthService`/`ProfileService` (mapping de réponse, signaux computés), `AuthStorageService` (sessionStorage, SSR), et 6 services REST simples (`InventoryService`, `RecordsService`, `ServersService`, `ShopService`, `StatsService`, `TravelService`)
- **Utilitaires** — `profile.utils.ts` (badges, fonds, dates)
- **Composants UI partagés** — 5 composants réutilisables à travers toute l'application
- **Logique des composants de fonctionnalité** — fonctions pures extraites (`formatDuration`, `canAffordTravel`, `getRankEmoji`, `fmt()`...), testées indépendamment du rendu du template

#### Pourquoi les tests de composants mockent leur service (et pourquoi 6 services ont quand même leur propre test)

Chaque test de composant de fonctionnalité mocke son service (`{ provide: ShopService, useValue: mockService }`) — un choix délibéré et standard : isoler la logique du **composant** (tri, `canBuy()`, pagination) de l'implémentation du **service**, pour ne pas faire dépendre le test du composant du détail de construction d'une requête HTTP. C'est pour cette raison que `ProfileService` a en plus son propre test dédié (`profile.service.spec.ts`, avec `HttpTestingController`) : il contient une vraie transformation de réponse (`.pipe(map(res => res.profile))`) que le mock du composant ne vérifie jamais.

Les 6 services ajoutés (`InventoryService`, `RecordsService`, `ServersService`, `ShopService`, `StatsService`, `TravelService`) n'ont pas cette justification : ce sont de pures délégations vers `HttpClient`, sans transformation. Je les ai quand même testés pour une raison précise que j'ai réalisée en les lisant : plusieurs de leurs méthodes POST renomment un champ JS en snake_case pour l'API (`itemId` → `item_id`, `badgeId`/`slot` → `badge_id`/`slot`, `destinationId` → `destination_id`), une faute de frappe silencieuse à cet endroit casserait le contrat d'API sans qu'aucun test ne le détecte. Les tests ajoutés vérifient l'URL, la méthode HTTP et, pour les `POST`, la forme exacte du payload envoyé.

#### Angular TestBed pour les composants

Les composants UI partagés (Avatar, Badge, Spinner, etc.) utilisent `TestBed.createComponent()` avec `fixture.componentRef.setInput()` (API Angular 17+ pour les inputs basés sur les signaux). Les guards utilisent `TestBed.runInInjectionContext()` pour simuler l'environnement d'injection sans instancier un routeur complet.

#### Tests HTTP avec HttpTestingController

`AuthService` et `jwtInterceptor` utilisent `provideHttpClient(withInterceptors([...]))` + `provideHttpClientTesting()` + `HttpTestingController`. Cette approche intercepte les requêtes HTTP avant l'envoi réseau et permet de contrôler les réponses de manière déterministe.

#### Gestion des erreurs asynchrones

Pour les Observables qui émettent une erreur, la conversion `lastValueFrom(observable$)` permet d'utiliser `await expect(...).rejects.toThrow(...)` — syntaxe native Vitest, sans `done` callback ni `.toThrowError()` imbriqué.

---

### Contexte RNCP — Compétence C2.2.2

| Couche testée | Type | Preuve |
|---------------|------|--------|
| Guards de navigation (auth, guest, admin) | TU | `auth.guard.spec.ts` |
| Intercepteur HTTP (JWT, URLs publiques, SSR) | TI | `jwt.interceptor.spec.ts` |
| Service d'authentification (OAuth, signaux) | TI | `auth.service.spec.ts` |
| Service profil (URL, mapping réponse API) | TI | `profile.service.spec.ts` |
| Services REST (URL, méthode, payloads snake_case) | TI | `inventory.service.spec.ts`, `records.service.spec.ts`, `servers.service.spec.ts`, `shop.service.spec.ts`, `stats.service.spec.ts`, `travel.service.spec.ts` |
| Stockage session (sessionStorage, SSR) | TU | `auth-storage.service.spec.ts` |
| Utilitaires profil (badges, fonds, dates) | TU | `profile.utils.spec.ts` |
| Header (auth branches, admin gate, navigation clavier) | TI-comp | `header.component.spec.ts` |
| Callback OAuth (mapping erreurs, flux succès, redirection) | TU | `auth-callback.component.spec.ts` |
| Page d'accueil (déclenchement login Discord) | TU | `home.component.spec.ts` |
| Liste des commandes bot (filtrage par catégorie) | TU | `commands.component.spec.ts` |
| Dashboard (chargement, erreur silencieuse rang) | TI | `dashboard.component.spec.ts` |
| Inventaire (éviction slot, suppression badge) | TI | `inventory.component.spec.ts` |
| Classement (getRankEmoji, pagination, userRank) | TU | `leaderboard.component.spec.ts` |
| Carte (formatDuration, canAffordTravel, visualRoutes) | TU | `map.component.spec.ts` |
| Profil (computed null-safety, retry) | TI | `profile.component.spec.ts` |
| Records (fmt(), explorationPct div/0) | TU | `records.component.spec.ts` |
| Serveurs (presentCount, fallback silencieux, sécurité) | TI | `servers.component.spec.ts` |
| Boutique (tri filteredItems, canBuy, reset page) | TI | `shop.component.spec.ts` |
| Stats (fmt() dupliqué, set atomique) | TU | `stats.component.spec.ts` |
| Composants UI partagés (5 composants) | TI-comp | `shared/components/ui/*/` |
| Composant racine (routing, accessibilité) | TI-comp | `app.spec.ts` |

---

## Bot Discord (Node/TypeScript)

### Vue d'ensemble

Le bot est couvert par des tests unitaires exécutés via **Vitest** (même outil que le frontend, pour une stack de test homogène) : **56 tests, 4 fichiers**, sur un périmètre volontairement restreint à la logique testable sans dépendance à une session Discord live (voir choix de conception ci-dessous). Contrairement au backend et au frontend, ce module n'a pas vocation à démontrer une couverture chiffrée globale : l'exigence RNCP de couverture majoritaire (> 50 %) est déjà remplie et documentée sur les deux autres modules. L'objectif ici est d'étendre la même méthodologie TU/TI à un troisième contexte technique, sur un périmètre choisi plutôt que subi.

---

### Prérequis

- Node 22+ et `npm install` depuis `bot/`
- Package `@vitest/coverage-v8` requis pour le rapport de couverture (déjà en devDependency)

---

### Commandes

```bash
# Depuis bot/

# Suite complète
npx vitest run

# Avec rapport de couverture (texte)
npx vitest run --coverage
```

---

### Structure des tests

```
bot/src/commands/mazworld/utils/
├── cooldownManager.spec.ts     # TU — calcul de cooldown, formatage du temps, isolation par user/commande
├── components.spec.ts          # TU — boutons/menus Discord (état disabled, options dynamiques)
├── embeds.spec.ts              # TU — construction d'embeds Discord (branches conditionnelles)
└── travelMiddleware.spec.ts    # TU — appel API mocké + interaction Discord mockée
```

---

### Choix de conception

#### Pourquoi ce périmètre et pas plus ?

J'ai testé ce qui a une logique isolable, et laissé de côté le reste en toute conscience.
Le code du bot se répartit en quatre catégories, avec une seule réellement pertinente à tester unitairement :

- **Logique pure, testée** (`cooldownManager.ts`, `embeds.ts`, `components.ts`, `travelMiddleware.ts`) : aucune dépendance à une session Discord live. `EmbedBuilder`/`ActionRowBuilder`/`ButtonBuilder`/`StringSelectMenuBuilder` (`embeds.ts`, `components.ts`) sont de simples constructeurs d'objet, exécutables hors ligne ; `travelMiddleware.ts` ne dépend que d'un appel API et d'un objet `interaction`, tous deux mockables sans introduire de framework de test Discord.
- **Commandes slash** (`commands/mazworld/*.ts`, ex. `coinflip.ts`, `shop.ts`) : orchestrent directement `interaction.reply()`/`interaction.deferReply()` et l'état complet d'une interaction Discord. Les tester unitairement reviendrait à re-simuler l'intégralité du cycle d'interaction Discord.js pour une valeur ajoutée faible — la logique métier qu'elles orchestrent (achat, pari, travail) est déjà couverte côté backend (`CommandsController`, `ShopController`). Non testées, à l'image des controllers Symfony qui ne sont pas testés en TU mais en TI.
- **Rendu canvas** (`profileCard.ts`) : génère une image pixel par pixel. La tester reviendrait soit à comparer des snapshots d'image (fragile, faible valeur), soit à ne tester que les deux tables de correspondance couleur/emoji qu'elle contient, ce qui ne justifie pas un fichier de test dédié. Non testé, à l'image des repositories Doctrine sans DQL custom qui ne sont pas testés côté backend car cela reviendrait à tester l'ORM lui-même.
- **Bootstrap et scripts utilitaires** (`index.ts`, `utils/rest.ts`, `utils/clean-commands.ts`, `handlers/*`) : câblage d'événements Discord et scripts d'enregistrement de commandes exécutés une fois au déploiement. Non testés pour la même raison que `public/index.php` ou `main.ts` ne le sont pas côté backend/frontend.

#### Mock du client API et de l'interaction Discord

`travelMiddleware.spec.ts` mocke le module `api/client` via `vi.mock()` (le même principe que `HttpTestingController` côté Angular) et fournit un objet `interaction` minimal (`{ user, reply: vi.fn() }`) plutôt que d'instancier un vrai `ChatInputCommandInteraction` : seules les propriétés réellement utilisées par la fonction testée sont simulées.

---

### Contexte RNCP — Compétence C2.2.2

| Couche testée | Type | Preuve |
|---------------|------|--------|
| Gestion des cooldowns (calcul, isolation, formatage) | TU | `cooldownManager.spec.ts` |
| Construction des embeds Discord (branches conditionnelles) | TU | `embeds.spec.ts` |
| Boutons/menus Discord (état disabled, options dynamiques) | TU | `components.spec.ts` |
| Middleware de vérification de voyage (API + interaction mockées) | TU | `travelMiddleware.spec.ts` |