# Sécurité — OWASP Top 10 (2021)

**Présenté par Mickael FERNANDEZ** — Étudiant M2 Développement Web, Ynov Campus

---

## Sommaire

1. [Vue d'ensemble](#vue-densemble)
2. [A01 — Broken Access Control](#a01--broken-access-control)
3. [A02 — Cryptographic Failures](#a02--cryptographic-failures)
4. [A03 — Injection](#a03--injection)
5. [A04 — Insecure Design](#a04--insecure-design)
6. [A05 — Security Misconfiguration](#a05--security-misconfiguration)
7. [A06 — Vulnerable and Outdated Components](#a06--vulnerable-and-outdated-components)
8. [A07 — Identification and Authentication Failures](#a07--identification-and-authentication-failures)
9. [A08 — Software and Data Integrity Failures](#a08--software-and-data-integrity-failures)
10. [A09 — Security Logging and Monitoring Failures](#a09--security-logging-and-monitoring-failures)
11. [A10 — Server-Side Request Forgery (SSRF)](#a10--server-side-request-forgery-ssrf)

---

**Référentiel :** OWASP Top 10 2021
**Périmètre :** Backend Symfony 7 + Frontend Angular 21

---

## Vue d'ensemble

| # | Catégorie OWASP | Statut | SUs associés |
|---|---|---|---|
| A01 | Broken Access Control | ✅ Couvert | #183, #186, #192 |
| A02 | Cryptographic Failures | ✅ Couvert | #151, #179 |
| A03 | Injection | ✅ Couvert | (Doctrine ORM) |
| A04 | Insecure Design | ✅ Couvert | #182, #184, #185 |
| A05 | Security Misconfiguration | ✅ Couvert | #181, #180 |
| A06 | Vulnerable and Outdated Components | ✅ Couvert | Feature #103 |
| A07 | Identification and Authentication Failures | ✅ Couvert | #44, #45, #183, #185 |
| A08 | Software and Data Integrity Failures | ✅ Couvert | Feature #103 |
| A09 | Security Logging and Monitoring Failures | ✅ Couvert | Feature #103 |
| A10 | Server-Side Request Forgery (SSRF) | ✅ Couvert | (conception) |

---

## A01 — Broken Access Control

**Risque :** Un utilisateur accède à des données ou actions qui ne lui appartiennent pas.

### Mesures implémentées

**Authentification obligatoire sur toutes les routes API**

Toutes les routes `/api/` (sauf `/api/auth/discord/login` et `/api/auth/discord/callback`) requièrent un JWT valide. La configuration Symfony (`security.yaml`) applique `IS_AUTHENTICATED_FULLY` par défaut via `access_control`, rendant toute nouvelle route sécurisée automatiquement (SU #192).

**JWT blacklist à la déconnexion (SU #183)**

`JwtBlacklistSubscriber` intercepte chaque JWT validé et vérifie son `iat` (issued-at) contre une entrée de cache :

```php
// JwtBlacklistSubscriber.php
$item = $this->cache->getItem('jwt_blacklist_' . $userId);
if ($item->isHit() && $iat < $item->get()) {
    throw new AuthenticationException('JWT has been revoked');
}
```

À la déconnexion, `AuthController::logout()` enregistre `time()` sous la clé `jwt_blacklist_{userId}` avec un TTL de 15 min (durée de vie du JWT). Tout token émis avant ce timestamp est rejeté.

**Comparaison du secret bot en temps constant (SU #186)**

Le secret du bot Discord est comparé avec `hash_equals()` (résistant aux timing attacks) :

```php
// BotAuthenticator.php
if (!$secret || !hash_equals($this->botApiSecret, $secret)) {
    throw new CustomUserMessageAuthenticationException('Invalid bot secret.');
}
```

**Isolation des données utilisateur**

Chaque endpoint récupère les données via `$this->getCurrentUser()`. Il est structurellement impossible d'accéder aux données d'un autre utilisateur sans manipulation du token.

---

## A02 — Cryptographic Failures

**Risque :** Des données sensibles sont exposées via un chiffrement faible ou absent.

### Mesures implémentées

**Chiffrement AES-256-GCM des tokens Discord (SU #179)**

Les tokens OAuth Discord (access et refresh) sont chiffrés avant stockage en base via `TokenEncryptorService` :

```php
// TokenEncryptorService.php
private const ALGO = 'aes-256-gcm';
private const IV_LENGTH = 12;
private const TAG_LENGTH = 16;

public function encrypt(string $plaintext): string
{
    $iv = random_bytes(self::IV_LENGTH);
    $tag = '';
    $ciphertext = openssl_encrypt($plaintext, self::ALGO, $this->key, OPENSSL_RAW_DATA, $iv, $tag, '', self::TAG_LENGTH);
    return base64_encode($iv . $ciphertext . $tag);
}
```

Chaque chiffrement utilise un IV aléatoire (12 octets) et produit un tag d'intégrité GCM (16 octets). La clé est une clé RSA 32 octets en base64 (`APP_ENCRYPTION_KEY`).

**JWT RS256 avec clés asymétriques**

LexikJWTAuthenticationBundle est configuré avec des clés RSA (public/privé). L'algorithme RS256 permet de vérifier les tokens sans exposer la clé de signature. TTL = 900 secondes (15 minutes).

**JWT stocké en mémoire Angular (SU #151)**

Le JWT est conservé dans un `BehaviorSubject` Angular, jamais dans `localStorage` ni `sessionStorage`. Un attaquant XSS ne peut pas lire le token via `document.cookie` ou `Storage`.

**Refresh token : cookie sécurisé + hash SHA-256**

```php
// AuthController.php
return Cookie::create(self::REFRESH_COOKIE)
    ->withValue($rawToken)
    ->withSecure(true)
    ->withHttpOnly(true)
    ->withSameSite('strict');
```

La valeur brute du refresh token n'est jamais stockée en cache : seul son hash SHA-256 est utilisé comme clé (`refresh_token_` + `hash('sha256', $rawToken)`).

**HSTS**

```php
// SecurityHeadersSubscriber.php
$response->headers->set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
```

---

## A03 — Injection

**Risque :** Données non fiables interprétées comme des commandes (SQL, OS, LDAP…).

### Mesures implémentées

**Doctrine ORM — requêtes paramétrées exclusivement**

Toutes les interactions avec la base de données passent par l'ORM Doctrine ou son QueryBuilder. Aucune requête SQL brute n'est construite par concaténation de chaînes. Doctrine utilise des PDO prepared statements nativement.

**Protection XSS native côté frontend**

Angular échappe automatiquement toutes les interpolations `{{ expression }}` en encodant les caractères HTML avant injection dans le DOM. L'usage de `[innerHTML]` est absent du code applicatif, éliminant le vecteur d'injection XSS le plus courant dans les SPAs.

**Pas de désérialisation de données utilisateur**

Les corps de requêtes JSON sont traités avec `json_decode()` (scalaires PHP), jamais avec `unserialize()`. Il n'y a aucune reconstruction d'objet à partir de données non fiables.

**Validation du paramètre OAuth state (SU #184)**

Le paramètre `state` du flux OAuth Discord est généré côté serveur (`bin2hex(random_bytes(16))`), stocké en cache avec un TTL de 5 minutes, et vérifié avant tout échange de code d'autorisation :

```php
// AuthController.php
if (!$state || !$this->cache->getItem($cacheKey)->isHit()) {
    return $this->errorResponse('Invalid OAuth state', Response::HTTP_BAD_REQUEST);
}
$this->cache->deleteItem($cacheKey);
```

Cette validation protège aussi contre les attaques CSRF sur le flux OAuth.

---

## A04 — Insecure Design

**Risque :** Des failles résultent de l'absence de contrôles de sécurité dès la conception.

### Mesures implémentées

**Rate limiting sur trois périmètres (SU #185)**

```yaml
# config/packages/framework.yaml
rate_limiter:
    auth_callback:   # OAuth callback — par IP
        policy: sliding_window
        limit: 10
        interval: '1 minute'
    auth_refresh:    # Refresh token — par userId
        policy: sliding_window
        limit: 20
        interval: '1 minute'
    api_global:      # Toutes routes API authentifiées — par userId
        policy: sliding_window
        limit: 200
        interval: '1 minute'
```

`ApiRateLimitSubscriber` applique la limite globale sur toutes les requêtes `/api/` authentifiées. `AuthController` applique les limites spécifiques sur les endpoints d'authentification.

**Rotation du refresh token**

À chaque appel à `/api/auth/refresh`, l'ancien refresh token est supprimé du cache et un nouveau est émis. Un token volé ne peut être utilisé qu'une seule fois.

**Intégrité des transactions concurrentes (SU #182)**

Les achats en boutique et les débits de MazCoins utilisent des transactions SQL avec verrouillage pessimiste (`SELECT … FOR UPDATE`) via Doctrine, empêchant les doubles débits en cas de requêtes simultanées.

---

## A05 — Security Misconfiguration

**Risque :** Une configuration par défaut, incomplète ou erronée expose l'application.

### Mesures implémentées

**En-têtes de sécurité HTTP (SU #181)**

`SecurityHeadersSubscriber` injecte les en-têtes suivants sur toutes les réponses :

```php
// SecurityHeadersSubscriber.php
$response->headers->set('X-Content-Type-Options', 'nosniff');
$response->headers->set('X-Frame-Options', 'DENY');
$response->headers->set('Referrer-Policy', 'strict-origin-when-cross-origin');
$response->headers->set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
$response->headers->set('Content-Security-Policy',
    "default-src 'self'; img-src 'self' cdn.discordapp.com; " .
    "script-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " .
    "font-src 'self' https://fonts.gstatic.com"
);
```

Sur les routes `/api/`, `Cache-Control: no-store` est ajouté pour empêcher la mise en cache des réponses API par les proxies.

**Suppression des informations techniques dans les réponses d'erreur (SU #180)**

Les exceptions Symfony sont gérées par des handlers personnalisés qui retournent des messages génériques. Les traces de pile, chemins de fichiers et requêtes SQL n'apparaissent jamais dans les réponses JSON de production.

**Gestion des secrets par variables d'environnement**

Aucune valeur sensible n'est codée en dur. Les secrets (`APP_SECRET`, `JWT_PASSPHRASE`, `DISCORD_CLIENT_SECRET`, `BOT_API_SECRET`, `APP_ENCRYPTION_KEY`) sont déclarés dans `.env.example` comme documentation et définis dans `.env.local` (exclu du dépôt via `.gitignore`).

**CORS restreint**

```
CORS_ALLOW_ORIGIN='^https?://(localhost|127\.0\.0\.1)(:[0-9]+)?$'
```

En production, l'origine est restreinte au domaine de l'application.

---

## A06 — Vulnerable and Outdated Components

**Risque :** Des composants avec des vulnérabilités connues compromettent l'application.

### Mesures implémentées

**Dependabot (Feature #103)**

Dependabot est configuré sur le dépôt GitHub pour surveiller les dépendances PHP (Composer) et JavaScript (npm). Il ouvre automatiquement des pull requests de mise à jour dès qu'une nouvelle version ou une CVE est détectée. Les PRs sont soumises à la pipeline CI avant merge.

**Audit local**

```bash
composer audit      # vérifie les advisory Packagist
npm audit           # vérifie la base CVE npm
```

Ces commandes sont disponibles pour vérification manuelle. La pipeline CI actuelle (Feature #95) n'intègre pas encore d'étape d'audit automatique : cette évolution est à envisager pour bloquer le merge en cas de CVE critique détectée.

---

## A07 — Identification and Authentication Failures

**Risque :** Des failles dans l'authentification permettent l'usurpation de compte.

### Mesures implémentées

**Délégation à Discord OAuth 2.0**

L'application ne gère aucun mot de passe. L'authentification est entièrement déléguée à Discord via OAuth 2.0. MazWorld ne stocke que l'identifiant Discord et les tokens chiffrés.

**JWT court-vivant (RS256, 15 min)**

Les JWT ont un TTL de 900 secondes. Un token intercepté devient inutilisable au bout de 15 minutes au plus. L'algorithme RS256 (asymétrique) empêche la falsification sans la clé privée.

**Invalidation immédiate à la déconnexion (SU #183)**

Le mécanisme de blacklist (cf. A01) invalide instantanément tous les JWT d'un utilisateur dès la déconnexion, sans attendre leur expiration naturelle.

**Anti-brute force (SU #185)**

Le callback OAuth est limité à 10 appels/minute par IP. Le mécanisme de refresh est limité à 20 appels/minute par utilisateur.

**Anti-replay sur le refresh token**

Chaque utilisation du refresh token génère un nouveau token et invalide l'ancien (rotation). Un token volé ne peut être utilisé qu'une seule fois.

---

## A08 — Software and Data Integrity Failures

**Risque :** Des mises à jour ou données non vérifiées compromettent l'intégrité du système.

### Mesures implémentées

**Vérification des tokens Discord via HTTPS**

Les tokens obtenus lors du flux OAuth sont immédiatement vérifiés auprès de l'API Discord officielle via HTTPS. Un token forgé serait rejeté lors de l'appel à `getDiscordUser()`.

**Pas de désérialisation non fiable**

Aucun objet PHP n'est reconstruit depuis des données utilisateur (`unserialize` banni). La désérialisation JSON (`json_decode`) ne reconstruit que des scalaires et tableaux associatifs.

**Intégrité de la pipeline CI/CD**

La pipeline CI est définie dans `.github/workflows/ci.yml`, versionné dans le dépôt. Tout changement du workflow passe par une pull request et revue de code. La pipeline exécute les tests unitaires et d'intégration, le linting et un build Docker sanity-check à chaque PR — garantissant que chaque artefact intégré est testé.

**Revue humaine des mises à jour (Dependabot)**

Dependabot crée des PRs mais ne merge pas automatiquement. Chaque mise à jour de dépendance déclenche la pipeline CI (tests + build) et nécessite une revue de code avant intégration. L'automatisation d'un step `composer audit` / `npm audit` bloquant en CI est une évolution identifiée, non encore implémentée.

---

## A09 — Security Logging and Monitoring Failures

**Risque :** L'absence de journalisation empêche la détection et l'analyse des incidents.

### Mesures implémentées

**Canal Monolog `security` dédié (Feature #103)**

Un canal Monolog séparé centralise tous les événements de sécurité, configurables pour être routés vers un fichier ou un agrégateur de logs distinct des logs applicatifs.

**JwtSecurityLogSubscriber**

```php
// JwtSecurityLogSubscriber.php
public function onJWTInvalid(JWTInvalidEvent $event): void
{
    $this->securityLogger->warning('Invalid JWT token', [
        'ip' => $request->getClientIp(),
        'path' => $request->getPathInfo(),
    ]);
}

public function onJWTExpired(JWTExpiredEvent $event): void
{
    $this->securityLogger->info('Expired JWT token', [
        'ip' => $request->getClientIp(),
        'path' => $request->getPathInfo(),
    ]);
}
```

Chaque JWT invalide (potentielle tentative de falsification) génère un `warning` avec l'IP source et le chemin visé.

**BotAuthenticator — échecs d'authentification**

```php
// BotAuthenticator.php
public function onAuthenticationFailure(...): ?Response
{
    $this->securityLogger->warning('Bot authentication failure', [
        'ip' => $request->getClientIp(),
        'reason' => $exception->getMessageKey(),
    ]);
    // ...
}
```

---

## A10 — Server-Side Request Forgery (SSRF)

**Risque :** L'application est manipulée pour envoyer des requêtes vers des ressources internes.

### Mesures implémentées

**URLs Discord codées en dur**

Toutes les URLs de l'API Discord (`https://discord.com/api/oauth2/token`, `https://discord.com/api/users/@me`, etc.) sont des constantes dans `DiscordOAuthService`. Aucun paramètre utilisateur ne peut influencer l'URL cible des appels HTTP sortants.

**Absence de fonctionnalité proxy**

L'application ne propose aucune fonctionnalité de fetch d'URL arbitraire, de proxy, de webhook ou de résolution de nom à la demande. Il n'existe pas de surface d'attaque SSRF dans la conception actuelle.

**Réseau interne non exposé**

Le backend n'a pas accès à un réseau interne sensible (cloud privé, services de métadonnées) dans l'environnement de déploiement cible (VPS OVHcloud standard).
