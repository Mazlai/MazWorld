# Stratégie de tests — MazWorld

Ce document centralise la stratégie de tests du projet MazWorld. Chaque module dispose de sa propre section détaillant les catégories de tests, les commandes et les choix de conception.

---

## Backend (Symfony)

### Vue d'ensemble

Le backend Symfony est couvert par deux catégories de tests clairement séparées, accessibles via les groupes PHPUnit `unit` et `integration`.

| Catégorie | Groupe PHPUnit | Base de données |
|-----------|---------------|-----------------|
| Tests unitaires (TU) | `unit` | Non |
| Tests d'intégration (TI) | `integration` | Oui (MySQL) |

Couverture : **74.32 % des lignes**, **81.34 % des méthodes** — 295 tests, 715 assertions (rapport HTML : `web/backend/coverage-reports/07-final/`, exclu du dépôt via `.gitignore`).

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

- **TU** (`--group unit`) : aucune dépendance externe. Rapides (< 1 s), exécutables en CI sans base de données. Vérifient la logique pure des classes en isolation avec des mocks.
- **TI** (`--group integration`) : requièrent MySQL. Vérifient que les couches interagissent correctement — requêtes SQL effectives, cycle requête/réponse HTTP complet, middlewares Symfony.

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

PHPUnit 11 vérifie que les tests ne laissent pas de gestionnaires d'exceptions pendants. Symfony WebTestCase en installe un pour capturer les erreurs HTTP. Cette combinaison produit le message *"Test code or tested code did not remove its own exception handlers"*. Il s'agit d'une incompatibilité connue entre PHPUnit 11 et Symfony 7 — les tests passent (exit code 0) et aucune assertion n'échoue.

#### Tests de repository : valeur ajoutée

Les tests de repository (TI) ne valident pas les données des fixtures — ils valident que les **QueryBuilders DQL sont sémantiquement corrects** :
- Les clauses `WHERE` filtrent effectivement
- Les clauses `ORDER BY` sont appliquées par MySQL
- Les cas limites (résultat vide) sont bien gérés

Un bug dans un alias DQL ne serait pas détecté par les tests de controller (qui testent la couche HTTP).

Les autres repositories (`UserRepository`, `RouteRepository`, `UserInventoryRepository`, `UserEquippedBadgeRepository`, `VisitedCityRepository`, `CityJobRepository`) ne possèdent aucune méthode DQL custom — uniquement des délégations Doctrine standards. Les tester reviendrait à tester l'ORM lui-même : non pertinent.

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

> Section à compléter lors de l'implémentation des tests frontend.

Les tests frontend cibleront les composants et services Angular (tests unitaires via Jest ou Jasmine/Karma + Angular TestBed) et les flux utilisateur critiques (tests end-to-end via Playwright ou Cypress).