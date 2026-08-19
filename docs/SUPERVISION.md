# Système de supervision — MazWorld

**Présenté par Mickael FERNANDEZ**, étudiant M2 Développement Web, Ynov Campus

---

## Sommaire

1. [Périmètre et typologie du logiciel](#1-périmètre-et-typologie-du-logiciel)
2. [Objectifs de qualité de service](#2-objectifs-de-qualité-de-service)
3. [Les trois piliers appliqués à MazWorld](#3-les-trois-piliers-appliqués-à-mazworld)
4. [Sondes de santé applicative](#4-sondes-de-santé-applicative)
5. [Disponibilité — Uptime Kuma](#5-disponibilité--uptime-kuma)
6. [Métriques de ressources — Prometheus + Grafana (USE)](#6-métriques-de-ressources--prometheus--grafana-use)
7. [Métriques applicatives — trafic par route (RED)](#7-métriques-applicatives--trafic-par-route-red)
8. [Alerting — routage vers Discord](#8-alerting--routage-vers-discord)
9. [Logs — Loki + Grafana Alloy](#9-logs--loki--grafana-alloy)
10. [Limites et évolutions possibles](#10-limites-et-évolutions-possibles)

---

## 1. Périmètre et typologie du logiciel

MazWorld tient en cinq conteneurs **applicatifs** Docker Compose (`nginx`, `backend` Symfony, `frontend` Angular, `bot` Discord, `mysql`) sur un seul hôte (voir le [manuel de déploiement](DEPLOIEMENT.md)), loin d'une architecture microservices orchestrée par Kubernetes. La stack de supervision elle-même ajoute sept conteneurs supplémentaires (§3), et la distinction compte : le périmètre surveillé reste ces cinq-là, les outils qui les surveillent n'en font pas partie. Reproduire telle quelle une stack pensée pour du multi-nœud (Jaeger pour du tracing distribué, un Alertmanager en haute disponibilité, des probes Kubernetes) n'aurait pas de sens, puisqu'il n'y a ni plusieurs instances d'un même service à équilibrer, ni de frontière réseau entre pods à observer. Le périmètre retenu couvre en revanche exactement ce qu'un hôte unique expose comme surface de panne :

- **Disponibilité** : l'utilisateur peut-il joindre le site et l'API ? Le bot répond-il sur Discord ?
- **Saturation des ressources** : CPU, mémoire, disque de l'hôte et de chaque conteneur, la cause la plus probable d'indisponibilité sur un VPS mono-instance (OOM, disque plein, CPU à 100 %).
- **Santé de chaque processus** : le pool PHP-FPM répond-il ? La connexion à MySQL fonctionne-t-elle ?

Ce périmètre correspond au **système** MazWorld (backend + frontend + bot + base de données), et non à un unique livrable, car une panne de n'importe lequel de ces éléments dégrade l'expérience utilisateur.

---

## 2. Objectifs de qualité de service

Avant les outils, les exigences qu'ils sont censés vérifier. Sans base de joueurs à grande échelle et sans redondance d'infrastructure, un SLA chiffré et contractuel n'aurait pas de sens ici, ce qui ne dispense pas de fixer des objectifs internes explicites, justifiés pour ce projet précis plutôt qu'empruntés à un standard générique :

| Objectif | Valeur retenue | Justification |
|---|---|---|
| Délai de détection d'une panne complète | < 2 minutes | Sondage Uptime Kuma toutes les 60 s (§5) ; un délai plus long retarderait inutilement l'intervention sur un projet sans astreinte formelle |
| Latence perçue (p95, toutes routes) | < 1 s | Ajoutée à la latence propre de Discord (~100–300 ms), 1 s reste sous le seuil où un joueur perçoit une lenteur gênante lors d'une commande |
| Taux d'erreur HTTP | < 5 % sur 5 min | Au-delà, un joueur qui enchaîne plusieurs actions par session croise une erreur avec une probabilité perceptible |
| Marge de ressources avant saturation | < 90 % CPU/mémoire (hôte ou conteneur) | Au-delà, le risque de bascule brutale vers l'indisponibilité (OOM kill, starvation CPU) augmente fortement : c'est une marge de sécurité, non un objectif d'expérience directement perçu |

Ces quatre objectifs déterminent directement les seuils des règles présentées en §8, loin de simples réglages d'alerte choisis après coup. La relation est décrite dans l'autre sens dans ce document par commodité de lecture (sondes puis alertes), mais c'est bien l'objectif qui précède la règle, et non l'inverse.

---

## 3. Les trois piliers appliqués à MazWorld

| Pilier | Outil | Rôle |
|---|---|---|
| Métriques (ressources) | Prometheus + Grafana (cAdvisor, node-exporter) | Méthode **USE** (Utilization / Saturation / Errors), par ressource (CPU, mémoire, disque) et par conteneur ([§6](#6-métriques-de-ressources--prometheus--grafana-use)) |
| Métriques (trafic applicatif) | Prometheus + Grafana (instrumentation Symfony) | Méthode **RED** (Rate / Errors / Duration), par route HTTP ([§7](#7-métriques-applicatives--trafic-par-route-red)) |
| Disponibilité du chemin complet | Uptime Kuma | Requête HTTP périodique sur le chemin public : up/down et temps de réponse, du point de vue d'un utilisateur ([§5](#5-disponibilité--uptime-kuma)) |
| Logs | Monolog (émission) + Loki/Grafana Alloy (centralisation) | Événements structurés JSON, centralisés et filtrables par conteneur (voir [§9](#9-logs--loki--grafana-alloy)) |

**USE** répond à « quelle ressource sature ? » (cause) et **RED** répond à « mes utilisateurs sont-ils impactés ? » (symptôme) : deux angles complémentaires, non redondants. Les deux sont ici portées par la même stack Prometheus/Grafana : USE par les exporters cAdvisor/node-exporter (§6), RED par un compteur et un histogramme Prometheus ajoutés directement dans Symfony (§7). Uptime Kuma s'ajoute en testant le chemin complet par une requête HTTP plutôt qu'en lisant un état interne, ce qui en fait un signal différent des deux premiers, sans être véritablement « de l'extérieur » puisqu'il tourne sur le même hôte que le reste de la stack : la nuance, et sa limite réelle, sont détaillées en §5.

---

## 4. Sondes de santé applicative

Sur Kubernetes, l'auto-guérison repose sur des *liveness*/*readiness probes* ; Docker Compose n'a pas cette notion telle quelle, et y répond par un équivalent direct : `healthcheck` + `restart: unless-stopped` + `depends_on: condition: service_healthy`. Trois sondes ont été mises en place dans `docker-compose.yml` :

### 4.1 MySQL (déjà existant)

```yaml
healthcheck:
  test: ["CMD", "mysqladmin", "ping", "-h", "localhost"]
```

### 4.2 Backend — ping PHP-FPM

Le pool `www` de PHP-FPM expose un endpoint `ping` interne (`ping.path`/`ping.response`, ajoutés dans `web/backend/Dockerfile`), interrogé directement en FastCGI via `cgi-fcgi`, sans passer par nginx ni par le noyau Symfony. C'est une sonde de **liveness** : rapide, sans dépendance externe (pas de requête base de données), elle prouve seulement que le processus PHP-FPM répond.

```yaml
healthcheck:
  test: ["CMD-SHELL", "SCRIPT_NAME=/ping SCRIPT_FILENAME=/ping REQUEST_METHOD=GET cgi-fcgi -bind -connect 127.0.0.1:9000 | grep -q pong"]
```

### 4.3 nginx — `GET /api/healthz`

Un endpoint applicatif dédié (`web/backend/src/Controller/HealthController.php`) exécute un `SELECT 1` via Doctrine et répond `200 {"status":"ok","database":"ok"}` ou `503` si la base est injoignable. Exposé en `PUBLIC_ACCESS` dans `security.yaml` (hors du firewall JWT, sur le même modèle que `/api/bot/status`), il est sondé par nginx :

```yaml
healthcheck:
  test: ["CMD", "wget", "--spider", "-q", "http://127.0.0.1/api/healthz"]
```

Cette sonde traverse toute la chaîne nginx → PHP-FPM → Symfony → MySQL : c'est le pendant d'une *readiness probe*, plus coûteuse que le ping FPM, qui garantit que le service rend réellement le résultat attendu par l'utilisateur et non simplement que le processus est démarré. `docker-compose.yml` fait dépendre `nginx` de `backend: condition: service_healthy` : nginx n'est déclaré prêt qu'une fois le backend effectivement opérationnel.

**Le bot Discord n'a volontairement pas de `healthcheck` Docker**, car il s'agit d'un client WebSocket (Discord Gateway) sans serveur HTTP, et lui ajouter une sonde interne reviendrait à ajouter un serveur HTTP au seul usage du healthcheck. Sa disponibilité réelle (la session Gateway est-elle active ?) est déjà exposée publiquement par `GET /api/bot/status`, qui interroge l'API Discord elle-même (`DiscordApiClient::getBotInfo()`). C'est cet endpoint, plus fiable qu'un ping interne, qui est sondé par Uptime Kuma (§5).

---

## 5. Disponibilité — Uptime Kuma

[Uptime Kuma](https://github.com/louislam/uptime-kuma) est déployé comme conteneur supplémentaire (`docker-compose.monitoring.yaml`), avec un volume persistant (`uptime_kuma_data`). Choisi plutôt qu'un service SaaS externe (UptimeRobot, Better Uptime…) pour rester auto-hébergé et gratuit, et plutôt qu'une stack Blackbox Exporter + Alertmanager (plus lourde à opérer) pour un projet à l'échelle d'un seul VPS.

Contrairement à Prometheus/cAdvisor/node-exporter, qui lisent un état interne exposé par les conteneurs eux-mêmes, Uptime Kuma reproduit ce que vivrait un joueur : une requête HTTP sur le chemin public complet (nginx → PHP-FPM → Symfony → MySQL), depuis un conteneur distinct plutôt qu'en interrogeant un état.

**Angle mort assumé plutôt que caché.** Uptime Kuma est cependant déployé comme un conteneur de la même pile, sur le même hôte (`docker-compose.monitoring.yaml`), non sur une machine séparée. Si le VPS entier tombe (panne matérielle, réseau coupé, Docker Engine en panne), Uptime Kuma tombe avec lui, exactement comme Prometheus : rien dans l'architecture actuelle ne peut détecter une panne totale de l'hôte. Deux parades existent, non implémentées à ce stade (voir aussi [§10](#10-limites-et-évolutions-possibles)) :

- une sonde hébergée ailleurs (un service externe indépendant, interrogeant l'URL publique depuis un réseau totalement distinct) ;
- un mécanisme d'homme mort (l'hôte envoie un signal de vie périodique vers un service externe type healthchecks.io ; l'absence de ce signal après un délai déclenche l'alerte depuis l'extérieur, sans dépendre d'une sonde active sur l'hôte lui-même).

Trois moniteurs HTTP sont configurés (interface web, `http://<hôte>:3002` en dev, configuration détaillée dans le [manuel de déploiement §3.1](DEPLOIEMENT.md#31-stack-de-supervision-optionnelle)) :

| Moniteur | Cible | Fréquence | Ce qu'il prouve |
|---|---|---|---|
| Site web | `GET /` (nginx) | 60 s | Le frontend est servi |
| API | `GET /api/healthz` | 60 s | L'API répond et la base est joignable |
| Bot Discord | `GET /api/bot/status`, attend `"online":true` | 60 s | Le bot a une session Gateway active |

Chaque moniteur a la notification **Discord Webhook** native d'Uptime Kuma activée, pointant vers un salon dédié du serveur Discord du projet, ce qui est cohérent avec un jeu qui vit sur Discord : l'alerte de panne arrive sur le même canal que les joueurs. Uptime Kuma envoie un message à la bascule *up → down* et un second à la résolution *down → up*, avec la durée d'indisponibilité.

Le moniteur « Site web » a réellement signalé un faux positif en développement (un `403` inattendu), preuve concrète plutôt qu'exercice théorique : tracé jusqu'à sa cause et corrigé. Voir [issue #264](https://github.com/Mazlai/MazWorld/issues/264) pour le détail complet (fiche de consignation, cause racine, correctif, vérification).

---

## 6. Métriques de ressources — Prometheus + Grafana (USE)

### 6.1 Sondes de collecte

| Exporter | Rôle |
|---|---|
| `node-exporter` | Métriques de l'hôte : CPU, mémoire, disque, charge |
| `cAdvisor` | Métriques par conteneur : CPU, mémoire, réseau, labellisées par nom de conteneur (`backend`, `nginx`, `mysql`, `bot`…) |

Prometheus scrape les deux toutes les 15 s (`monitoring/prometheus/prometheus.yml`), avec une rétention de 15 jours (suffisant pour du diagnostic post-incident sans faire grossir indéfiniment le volume `prometheus_data`).

Prometheus va activement **chercher** les métriques (le *scrape*, à l'initiative de Prometheus, non des exporters qui pousseraient leurs données), les **stocke**, et **répond aux requêtes PromQL** : bien plus qu'un simple entrepôt passif. Grafana ne stocke rien : à chaque affichage d'un dashboard, il retransmet la requête à Prometheus (pour les métriques) ou à Loki (pour les logs, §9) et n'affiche que la réponse, d'où sa dépendance totale aux deux, visible dans `monitoring/grafana/provisioning/datasources/`.

### 6.2 Dashboard Grafana

Un dashboard provisionné automatiquement (`monitoring/grafana/dashboards/mazworld-use.json`, chargé au démarrage via `monitoring/grafana/provisioning/dashboards/`) applique la méthode **USE**, directement alignée sur les objectifs du [§2](#2-objectifs-de-qualité-de-service) :

- **Utilization** : CPU hôte (%), mémoire hôte (%), CPU par conteneur (%), mémoire par conteneur (Mo)
- **Saturation** : charge 5 min rapportée au nombre de cœurs (jauge, au-delà de 1, des processus attendent le CPU)
- **Errors** : disque hôte (%), le disque plein étant la cause d'échec la plus fréquente d'une migration Doctrine ou d'une écriture MySQL sur un petit VPS

Le point de montage du disque hôte n'a pas le même nom partout : `/` sur un VPS Linux classique, mais `/mnt` sur cette machine de développement (Docker Desktop/WSL2, qui expose le disque de la VM Linux sous-jacente sous ce nom). La requête du panneau disque (`mountpoint=~"^/$|^/mnt$"`) accepte les deux plutôt que de supposer un environnement Linux « pur », ce qui a été repéré en testant le dashboard en conditions réelles, au lieu de faire confiance à la requête écrite sans vérification.

Accessible sur `http://<hôte>:3001` (identifiants dans `monitoring/.env.example`), dossier **MazWorld**.

---

## 7. Métriques applicatives — trafic par route (RED)

### 7.1 Instrumentation

Contrairement aux métriques ressources (collectées de l'extérieur par des exporters), le trafic par route ne peut être mesuré que depuis l'intérieur de Symfony. `PrometheusRequestMetricsSubscriber` (`web/backend/src/EventSubscriber/`) s'abonne à `kernel.terminate` (après l'envoi de la réponse, pour ne pas ajouter de latence perçue par l'utilisateur) et alimente deux métriques via [`promphp/prometheus_client_php`](https://github.com/PromPHP/prometheus_client_php) :

| Métrique | Type | Labels | Pilier RED |
|---|---|---|---|
| `mazworld_http_requests_total` | Counter | `route`, `method`, `status` | **Rate** (dérivée : requêtes/min) et **Errors** (filtrage `status=~"4..\|5.."`) |
| `mazworld_http_request_duration_seconds` | Histogram | `route`, `method` | **Duration** (dérivée : quantile p95 via `histogram_quantile`) |

Le stockage entre requêtes PHP-FPM (chaque requête est un processus séparé) utilise l'adaptateur **APCu** de la librairie, une mémoire partagée locale à l'hôte, sans service supplémentaire (pas de Redis). Le registre est déclaré comme service Symfony via une factory (`App\Metrics\PrometheusRegistryFactory`, `config/services.yaml`), avec repli sur un stockage en mémoire quand APCu n'est pas disponible (hors Docker), un choix qui n'était pas le bon dès le départ : voir [issue #265](https://github.com/Mazlai/MazWorld/issues/265) pour l'anomalie que ça a causé et comment elle a été trouvée (cause racine, correctif, 301 tests PHPUnit passant contre 126 erreurs avant correctif).

### 7.2 Exposition — pourquoi `/metrics` n'est jamais public

Un endpoint Prometheus expose par nature des détails internes (noms de routes, volumétrie) : il ne doit pas être atteignable depuis Internet. Deux protections indépendantes ont été mises en place :

1. **Réseau** : nginx écoute la route `/metrics` sur un second bloc serveur, port `8081`, qui n'est **jamais publié** dans `docker-compose.yml`/`docker-compose.prod.yaml` (seuls 80/443 le sont). Un conteneur du même réseau Docker (Prometheus) peut l'atteindre par nom de service ; depuis l'extérieur du réseau Docker, le port n'existe simplement pas.
2. **Application** : la route Symfony `/metrics` (`MetricsController`) est hors du préfixe `/api`, donc hors du firewall JWT, et elle n'a pas besoin d'authentification applicative puisque la protection réseau est la ligne de défense principale, mais elle n'est de toute façon accessible par aucun chemin public (ni `/api/metrics`, ni le port 80/443).

Vérifié en local : `curl http://localhost:8080/metrics` (port public) renvoie le shell Angular (route inconnue du SPA, comportement attendu d'une catch-all front-end), jamais les métriques ; seul `docker exec <nginx> wget -qO- http://127.0.0.1:8081/metrics` les expose.

### 7.3 Dashboard Grafana

Un second dashboard provisionné (`monitoring/grafana/dashboards/mazworld-red.json`) affiche les trois signaux, par route, alignés sur les objectifs du [§2](#2-objectifs-de-qualité-de-service) :

- **Rate** : requêtes/min par route (`sum by (route) (rate(mazworld_http_requests_total[5m])) * 60`)
- **Errors** : taux de 4xx/5xx en % par route (`100 * (sum by (route) (rate(mazworld_http_requests_total{status=~"4..|5.."}[5m])) or (sum by (route) (rate(mazworld_http_requests_total[5m])) * 0)) / sum by (route) (rate(mazworld_http_requests_total[5m]))`), où la clause `or (... * 0)` force un `0` explicite par route plutôt qu'un panneau vide quand aucune erreur n'est survenue sur la fenêtre : sans elle, PromQL ne renvoie aucune série pour une route qui n'a jamais eu de 4xx/5xx, ce qui s'affiche comme « pas de données » et se lit, à tort, comme un dysfonctionnement du panneau
- **Duration** : latence p95 par route (`histogram_quantile(0.95, sum by (le, route) (rate(mazworld_http_request_duration_seconds_bucket[5m])))`)

**Preuve de fonctionnement** : testé en local avec du trafic réel généré sur l'API ; `/metrics` renvoie bien les séries par route, Prometheus scrape le job `backend` avec le statut `up`, et les trois requêtes PromQL du dashboard s'exécutent sans erreur via l'API Grafana :

```
mazworld_http_requests_total{route="api_leaderboard_list",method="GET",status="200"} 1
mazworld_http_requests_total{route="health_check",method="GET",status="200"} 59
mazworld_http_requests_total{route="unmatched",method="GET",status="404"} 1
```

---

## 8. Alerting — routage vers Discord

Quatre règles d'alerte sont provisionnées par fichier dans Grafana (`monitoring/grafana/provisioning/alerting/rules.yaml`), routées vers un **contact point Discord** commun, chacune étant la traduction directe d'un objectif du [§2](#2-objectifs-de-qualité-de-service) en seuil vérifiable :

| Règle | Condition | Objectif du §2 traduit | Sévérité |
|---|---|---|---|
| `mazworld-host-memory-high` | Mémoire hôte utilisée > 90 % pendant 5 min | Marge de ressources | critical |
| `mazworld-container-cpu-high` | CPU d'un conteneur > 90 % pendant 5 min | Marge de ressources | warning |
| `mazworld-error-rate-high` | Taux d'erreur HTTP global (4xx/5xx) > 5 % pendant 5 min | Taux d'erreur | critical |
| `mazworld-latency-p95-high` | Latence p95, toutes routes confondues, > 1 s pendant 5 min | Latence perçue | warning |

Ce découpage en deux groupes (USE, RED) complète volontairement le sondage binaire d'Uptime Kuma (§5, up/down) : les moniteurs Uptime Kuma détectent une panne franche, tandis que ces quatre règles détectent une **dégradation graduée** (la mémoire qui se remplit, la latence qui grimpe, le taux d'erreur qui augmente) avant qu'elle ne devienne une panne visible par l'utilisateur. Les deux dernières règles utilisent `noDataState: OK` plutôt que `NoData` : en l'absence de trafic (aucune requête sur la fenêtre de 5 min), l'absence de données ne doit pas être interprétée comme une anomalie.

Le contact point (`contactpoints.yaml`) utilise le type `discord` natif de Grafana, avec l'URL du webhook injectée par variable d'environnement (`DISCORD_WEBHOOK_URL`, expansion activée via `GF_ENABLE_ENVIRONMENT_VARIABLE_EXPANSION`), de sorte que le secret ne figure jamais dans un fichier versionné. La politique de notification (`policies.yaml`) groupe les alertes par nom et limite les répétitions à une toutes les 4 h, pour éviter la fatigue d'alerte.

**Preuve de fonctionnement** : deux de ces règles se sont réellement déclenchées pendant les tests, sans scénario simulé.

Lors du build initial des images (pic de charge transitoire), la règle mémoire s'est déclenchée et Grafana a tenté de notifier Discord :

```
logger=ngalert.notifier.discord notifierUID=discord-webhook level=error
msg="failed to send notification to Discord" statusCode=404
responseBody="{\"message\": \"Unknown Webhook\", \"code\": 10015}"
```

L'échec (`Unknown Webhook`) était attendu à ce stade : ce premier test utilisait un webhook Discord factice. Il a néanmoins prouvé que la chaîne fonctionne jusqu'au dernier maillon : détection du dépassement de seuil, résolution du contact point, expansion de la variable d'environnement, appel HTTP réel vers l'API Discord. Une fois l'URL réelle du salon Discord du projet renseignée, la même règle a effectivement notifié Discord avec succès (état *Firing*, labels et seuil dépassé conformes à la règle), confirmant la chaîne de bout en bout sans qu'il reste de maillon théorique.

La règle de latence (`mazworld-latency-p95-high`) s'est déclenchée d'elle-même, sans manipulation de ma part, et s'est révélée durable plutôt que passagère : générer volontairement du trafic soutenu sur l'API pendant 10 minutes n'a pas fait redescendre le p95 sous 1 s. La cause identifiée tient à l'environnement de développement local (Windows, code monté en volume), et non à l'application elle-même ; le diagnostic complet est détaillé en [§10](#10-limites-et-évolutions-possibles). Grafana a envoyé une tentative de notification toutes les minutes pendant plus de 20 minutes consécutives, confirmant que le seuil est bien évalué en continu tout du long.

---

## 9. Logs — Loki + Grafana Alloy

### 9.1 Pourquoi centraliser, et avec quoi

`config/packages/monolog.yaml` écrit déjà tous les logs applicatifs en **JSON structuré sur `stderr`** en production (conforme 12-Factor), ce qui les rend immédiatement collectables sans changement de code applicatif. Pour un seul hôte, `docker compose logs -f <service>` suffit à consulter un conteneur à la fois ; mais dès qu'il s'agit de corréler un pic d'erreurs (dashboard RED, §7) avec ce qui s'est réellement passé au même instant sur plusieurs conteneurs à la fois, ouvrir un terminal par service devient vite le facteur limitant. C'est le rôle de Loki : centraliser les logs de tous les conteneurs, consultables depuis Grafana sur la même timeline que les métriques.

Deux composants ajoutés à `docker-compose.monitoring.yaml` :

| Composant | Rôle |
|---|---|
| **Loki** | Stocke les logs, indexés par labels (pas de full-text lourd façon Elasticsearch), une approche proportionnée à l'échelle du projet |
| **Grafana Alloy** | Agent qui découvre les conteneurs Docker et relaie leurs logs (`stdout`/`stderr`) vers Loki. Successeur de Promtail chez Grafana Labs (Promtail est en fin de vie) |

### 9.2 Loki et Alloy ne font pas la même chose

Alloy ne stocke rien : il lit ce que chaque conteneur écrit sur sa sortie standard et le transmet au fil de l'eau. Loki ne va rien chercher lui-même : il attend qu'on lui envoie des logs, les range, les indexe par label, et répond aux requêtes de Grafana. Deux rôles bien distincts et non redondants, comme le montre un test mené en local plutôt qu'une simple affirmation :

```
$ docker stop mazworld-alloy-1
$ curl "http://localhost:8080/api/healthz?marqueur=ALLOY_COUPE"
$ # recherche du marqueur dans Loki :
{"result":[]}                                    ← rien : Alloy était éteint, personne pour relayer

$ docker start mazworld-alloy-1
$ curl "http://localhost:8080/api/healthz?marqueur=ALLOY_RELANCE"
$ # nouvelle recherche :
{"result":[{"...GET /api/healthz?marqueur=ALLOY_RELANCE..."}]}   ← trouvé, dès qu'Alloy est de retour
```

Le log généré pendant la coupure n'était pas perdu pour autant : `docker logs mazworld-nginx-1` l'aurait montré normalement, puisque nginx l'écrit indépendamment de tout ce qui se passe côté supervision. Seul le *transport* vers Loki s'est interrompu le temps qu'Alloy soit éteint.

### 9.3 Étiquetage par conteneur

Par défaut, `discovery.docker` d'Alloy expose le nom du conteneur uniquement comme méta-label interne (`__meta_docker_container_name`), invisible pour une requête Loki tant qu'il n'est pas explicitement promu en label. Sans cette étape, tous les conteneurs atterrissent sous un `service_name` générique, comme vérifié en local avant correction (`monitoring/alloy/config.alloy`) : un seul flux indifférencié, impossible à filtrer par service. Un `discovery.relabel` extrait ce méta-label vers un label `container` exploitable :

```alloy
discovery.relabel "containers" {
  targets = discovery.docker.containers.targets
  rule {
    source_labels = ["__meta_docker_container_name"]
    regex         = "/(.*)"
    target_label  = "container"
  }
}
```

**Vérifié en local** : requête LogQL combinant filtre par conteneur et recherche plein texte, sur du trafic réel généré par le healthcheck nginx et par Uptime Kuma :

```
{container="mazworld-nginx-1"}
→ 172.18.0.8 - - [.../api/healthz HTTP/1.1" 200 42 "-" "Uptime-Kuma/1.23.16" "-"
```

Les logs des douze conteneurs de la stack (les cinq applicatifs, plus les sept outils de supervision, §1) sont collectés et filtrables individuellement, avec une rétention de 7 jours (`monitoring/loki/loki-config.yaml`, cohérente avec les 15 jours déjà retenus côté Prometheus : une rétention proportionnée, non indéfinie).

### 9.4 Accès

Aucun nouveau dashboard dédié : Grafana **Explore** (menu latéral) avec le datasource **Loki** est l'outil adapté pour parcourir/filtrer des logs bruts, car un dashboard figé y ajouterait de la maintenance sans valeur, contrairement aux métriques (§6, §7) qui bénéficient de graphiques dans la durée.

---

## 10. Limites et évolutions possibles

- **Panne totale de l'hôte non détectable** : Uptime Kuma partage l'hôte avec le reste de la stack (voir [§5](#5-disponibilité--uptime-kuma)), donc ne peut pas alerter si cet hôte tombe entièrement. Sonde externe ou mécanisme d'homme mort envisagés, non implémentés à ce stade.
- **La latence mesurée en développement local n'est pas représentative de la production** : le dashboard RED (§7) affiche un p95 durablement au-dessus de l'objectif d'1 s (§2) sur cette machine, sans lien avec un simple effet de démarrage à froid dilué par le volume : générer 10 minutes de trafic soutenu sur l'API n'a rien changé. Diagnostic mené par élimination : un ping FPM brut (sans passer par Symfony) répond en 0 ms, mais n'importe quelle route Symfony, même triviale, prend plusieurs secondes, avec un écart flagrant entre temps réel et temps CPU (`time` : ~18 s de temps réel pour ~0,5 s de temps CPU sur un simple `bin/console about`), signature d'un goulot d'étranglement d'entrées/sorties plutôt que d'un calcul lent. Le même appel en environnement `prod` (encore sur le même montage) est nettement plus rapide qu'en `dev`, sans être instantané non plus, ce qui est cohérent avec le mécanisme de vérification de fraîcheur du cache de Symfony en mode développement (des centaines de fichiers sources vérifiés à chaque requête), combiné à la lenteur connue des volumes Docker montés sous Windows (pont de fichiers Windows → WSL2 → conteneur). En production, le code est intégré à l'image au moment du build (`docker-compose.prod.yaml`), sans montage de volume, sur un hôte Linux natif : ce goulot d'étranglement n'a pas de raison de s'y reproduire, mais faute de VPS provisionné à ce jour, ça reste une hypothèse solide plutôt qu'une mesure. Les captures d'écran de ce dashboard doivent se lire avec cette réserve.
- **Ports non exposés publiquement en production** : `3001` (Grafana) et `3002` (Uptime Kuma) ne doivent pas être ouverts sur l'IP publique du futur VPS : ils sont prévus pour être atteints via tunnel SSH (`ssh -L 3001:localhost:3001 ...`) ou, plus tard, un `location` nginx dédié avec authentification. Aucun VPS n'étant encore provisionné au moment de la rédaction, ce point reste une recommandation documentée plutôt qu'une configuration TLS déployée.
- **Pas d'alerte sur contenu de logs** : Loki (§9) centralise et rend les logs interrogeables, mais aucune règle n'alerte encore sur un motif précis (ex. une exception applicative répétée). Envisageable via une requête LogQL de comptage, sur le même modèle que les règles Grafana déjà en place (§8), mais non ajouté faute de motif récurrent identifié à ce jour.
- **Seuils RED affinés par route** : les règles actuelles (§8) agrègent toutes les routes ensemble (taux d'erreur et latence globaux) pour rester lisibles avec peu de trafic réel. Une fois un usage réel observé, elles pourraient être déclinées par route (ex. seuil de latence spécifique à `/api/travel`), voire calibrées avec des seuils différents selon la criticité de chaque endpoint.
- **Astreinte réelle** : le routage actuel (Discord) convient à un projet étudiant suivi par une seule personne. Une astreinte à plusieurs justifierait un vrai routage par gravité (P1/P3) vers un outil dédié (PagerDuty, Opsgenie).
- **Tracing distribué** : non pertinent tant que MazWorld reste un backend monolithique, à réévaluer seulement si l'architecture évolue vers plusieurs services interdépendants.
