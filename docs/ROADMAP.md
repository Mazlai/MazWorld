# Feuille de route — MazWorld

**Présenté par Mickael FERNANDEZ**, étudiant M2 Développement Web, Ynov Campus

---

## Sommaire

1. [Méthode](#1-méthode)
2. [Fiabilité et performance — préparer un premier déploiement solide](#2-fiabilité-et-performance--préparer-un-premier-déploiement-solide)
   1. [Bloquer la CI sur une vulnérabilité critique détectée](#21-bloquer-la-ci-sur-une-vulnérabilité-critique-détectée)
   2. [Réduire la coupure de service à chaque mise à jour](#22-réduire-la-coupure-de-service-à-chaque-mise-à-jour)
   3. [Afficher une erreur rassurante plutôt qu'un échec technique brut](#23-afficher-une-erreur-rassurante-plutôt-quun-échec-technique-brut)
   4. [Résorber la dette de sécurité du framework backend](#24-résorber-la-dette-de-sécurité-du-framework-backend)
3. [Engagement joueur — pour une V2, après le premier déploiement réel](#3-engagement-joueur--pour-une-v2-après-le-premier-déploiement-réel)
   1. [Événements temporaires par ville](#31-événements-temporaires-par-ville)
   2. [Système de niveaux et d'achievements](#32-système-de-niveaux-et-dachievements)
   3. [Mini-jeux rémunérateurs supplémentaires](#33-mini-jeux-rémunérateurs-supplémentaires)
4. [Synthèse et priorisation](#4-synthèse-et-priorisation)

---

## 1. Méthode

Ce document s'appuie sur deux sources concrètes, de nature différente, et non sur de simples suppositions :

- **Indicateurs de performance** : les dashboards Grafana (USE et RED, voir [SUPERVISION.md](SUPERVISION.md)) et les alertes qu'ils ont réellement déclenchées pendant les tests, qui sont à l'origine des recommandations de fiabilité ([§2](#2-fiabilité-et-performance--préparer-un-premier-déploiement-solide)).
- **Retours utilisateurs** : deux sources distinctes, l'une simulée en interne, l'autre réelle.
  - Le [cahier de recettes](CAHIER_DE_RECETTES.md) (34 scénarios exécutés dans les conditions réelles de l'application, rédigés et lus en langage joueur) a fait office de retour utilisateur simulé tant qu'aucune base de joueurs n'existait, et a révélé deux anomalies concrètes (F02, F13).
  - Le bot est aujourd'hui utilisé en démonstration sur deux serveurs Discord réels. Les retours informels reçus de joueurs qui y jouent effectivement (événements temporaires, progression, mini-jeux) sont à l'origine des recommandations d'engagement ([§3](#3-engagement-joueur--pour-une-v2-après-le-premier-déploiement-réel)). Il s'agit cette fois d'un vrai retour joueur, non d'une simulation.

Chaque recommandation ci-dessous part d'un constat vérifiable (une preuve ou une source identifiée), sans reposer sur une intuition générale sur "ce qui se fait habituellement".

---

## 2. Fiabilité et performance — préparer un premier déploiement solide

Les quatre recommandations qui suivent visent un objectif commun explicite : rendre le premier déploiement en production suffisamment fiable pour être montré, avant d'y ajouter du contenu. C'est un choix de séquencement assumé (voir [§3](#3-engagement-joueur--pour-une-v2-après-le-premier-déploiement-réel)), et non un oubli des retours joueurs.

### 2.1 Bloquer la CI sur une vulnérabilité critique détectée

**Constat :** [SECURITE_OWASP.md — A06](SECURITE_OWASP.md#a06--vulnerable-and-outdated-components) et [A08](SECURITE_OWASP.md#a08--software-and-data-integrity-failures) : `composer audit` et `npm audit` existent et sont documentés, mais aucune étape ne les exécute dans `ci.yml`. La pipeline actuelle (Feature #95) n'échoue donc jamais sur une CVE critique détectée. Seule la revue humaine des PR Dependabot fait office de filet.

**Recommandation :** Ajouter à `ci.yml` une étape `composer audit --locked` et `npm audit --audit-level=critical`, qui fait échouer le pipeline dès qu'une vulnérabilité critique est détectée sur une dépendance, en amont du merge.

**Gain pour l'attractivité :** Indirect mais immédiat : supprime un risque à la source, sans reposer sur la seule vigilance humaine en revue de PR.

**Coût et délai estimés :** La plus faible des quatre : une demi-journée, deux commandes déjà documentées à brancher sur un pipeline CI déjà en place, aucune nouvelle dépendance.

**Faisabilité :** Élevée : rien à découvrir, seulement à câbler.

---

### 2.2 Réduire la coupure de service à chaque mise à jour

**Constat :** Documenté dans le [manuel de mise à jour](MISE_A_JOUR.md#5-mettre-à-jour-une-instance-en-production) : le conteneur `backend` redémarre lors de chaque déploiement, avec une coupure brève assumée comme limite. Sur un jeu où une action (un voyage, un pari) peut être en cours au moment précis d'un déploiement, cette coupure, même courte, peut se traduire par une requête perdue.

**Recommandation :** Faire tourner deux instances du conteneur `backend` derrière nginx, basculées l'une après l'autre (rolling update), au lieu d'un redémarrage unique. L'architecture actuelle (nginx déjà en reverse proxy devant le backend) permet cette évolution sans réécrire l'application.

**Gain pour l'attractivité :** Aucune coupure perceptible lors des mises à jour, même fréquentes. Pour un jeu qui vit de la régularité de ses joueurs, une interruption au mauvais moment (en pleine action) coûte plus cher en confiance qu'elle n'y paraît.

**Coût et délai estimés :** Modéré : quelques jours de configuration Docker Compose et de tests de bascule, aucune nouvelle dépendance. Une bascule complète *blue-green* (deux environnements entiers en parallèle) serait plus robuste, mais doublerait les ressources serveur en continu, ce qui est disproportionné pour l'échelle actuelle du projet ; le rolling update sur deux instances reste donc le compromis réaliste.

**Faisabilité :** Élevée. S'appuie sur l'infrastructure déjà en place (nginx, healthchecks Docker déjà décrits en [SUPERVISION.md §4](SUPERVISION.md#4-sondes-de-santé-applicative)) ; pas de nouvelle brique technologique à apprendre.

---

### 2.3 Afficher une erreur rassurante plutôt qu'un échec technique brut

**Constat :** Le cahier de recettes a détecté ce motif à deux reprises (F02, puis historiquement plusieurs fois, voir [§7 du cahier de recettes](CAHIER_DE_RECETTES.md#7-anomalies-trouvées-en-marge-de-ce-cahier)) : une page technique brute affichée à la place d'un message compréhensible. Côté API, c'est déjà corrigé et vérifié (SEC10). Côté frontend en revanche, aucun traitement centralisé n'existe : chaque écran gère l'erreur pour son compte. Ce constat vient d'une lecture directe du code, non d'une supposition. L'intercepteur HTTP Angular (`jwt.interceptor.ts`) ne fait que relayer les erreurs sans les intercepter, et aucun `ErrorHandler` personnalisé n'est défini. Les mécanismes locaux sont dupliqués d'un fichier à l'autre au lieu de reposer sur un composant partagé : état d'erreur local dans `shop`, `inventory`, `leaderboard`, `stats`, `servers`, `records`, `map` et `profile`, notification redéfinie séparément dans `shop.component.ts` et `inventory.component.ts`, sauf quand l'erreur est simplement absorbée sans message visible (`dashboard.component.ts`, `servers.component.ts`).

**Recommandation :** Un intercepteur HTTP global côté Angular qui capte les échecs (5xx, coupure réseau) et affiche un message cohérent avec l'identité visuelle du jeu ; chaque écran cesse ainsi de se débrouiller seul, ou de ne rien afficher du tout.

**Gain pour l'attractivité :** Une erreur habillée dans le thème du jeu préserve l'immersion ; une page ou un silence technique la casse immédiatement, au pire moment (quand quelque chose ne va déjà pas).

**Coût et délai estimés :** Faible : un intercepteur Angular et un composant de notification réutilisable, 2 à 3 jours.

**Faisabilité :** Élevée, pattern standard Angular, ne touche pas à la logique métier existante.

---

### 2.4 Résorber la dette de sécurité du framework backend

**Constat :** [SECURITE_OWASP.md — A06](SECURITE_OWASP.md#a06--vulnerable-and-outdated-components) : des avis de sécurité restent ouverts sur les paquets `symfony/*`, bloqués par la contrainte de version actuelle (`7.0.*`) du projet, déjà corrigés dans des versions plus récentes que cette contrainte ne permet pas d'atteindre (état courant consultable dans l'onglet *Security* du dépôt, voir [manuel de mise à jour §3](MISE_A_JOUR.md#3-mettre-à-jour-les-dépendances)).

**Recommandation :** Planifier une montée de version mineure du framework (au-delà de `7.0.*`) comme un chantier dédié, avec sa propre passe de tests de non-régression complète (la suite de tests backend existante sert justement de filet de sécurité pour ce genre de changement).

**Gain pour l'attractivité :** Indirect mais réel : son intérêt tient moins à une fonctionnalité visible qu'à ce qu'elle empêche, un incident de sécurité qui détruirait en un jour la confiance construite sur plusieurs mois. Le coût de ne rien faire (temps de réponse à un incident, perte de confiance des joueurs, image du projet) dépasse largement le coût de la mise à jour.

**Coût et délai estimés :** Le plus coûteux des quatre : au-delà du changement de version lui-même, il faut valider qu'aucune dépréciation Symfony n'affecte le code existant. Ce travail justifie un sprint dédié, et non une simple mise à jour de routine.

**Faisabilité :** Réaliste mais à ne pas sous-estimer : c'est la seule recommandation des quatre qui touche une dépendance centrale (le framework lui-même, non une brique périphérique). C'est aussi la seule où un test de non-régression complet est non négociable avant toute mise en production.

---

## 3. Engagement joueur — pour une V2, après le premier déploiement réel

Le bot est aujourd'hui utilisé en démonstration sur deux serveurs Discord. Les trois recommandations qui suivent viennent directement des retours informels de joueurs qui y jouent réellement, non d'une liste d'idées génériques de jeu par navigateur. Elles sont volontairement classées après les recommandations de fiabilité ([§2](#2-fiabilité-et-performance--préparer-un-premier-déploiement-solide)) : ajouter du contenu avant d'avoir un premier déploiement stable ferait porter le risque de fiabilité sur une base de fonctionnalités plus large, sans bénéfice. Il s'agit d'un choix de séquencement, non d'une manière de minimiser ces retours.

### 3.1 Événements temporaires par ville

**Constat :** Retour direct de joueurs des deux serveurs de démonstration : une fois les villes et actions de base explorées, rien ne change d'une session à l'autre, aucune raison de revenir un jour plutôt qu'un autre.

**Recommandation :** Un événement limité dans le temps par ville (bonus de gain temporaire, décor ou thème visuel le temps de l'événement), piloté par une table de planification simple plutôt qu'un moteur de règles générique, cohérent avec l'échelle actuelle du projet.

**Gain pour l'attractivité :** Donne une raison de revenir à un rythme régulier plutôt qu'une seule fois ; renouvelle l'intérêt sans reconstruire le jeu existant.

**Coût et délai estimés :** Modéré : une entité de planification, la logique d'activation/désactivation, l'affichage côté web et bot. De l'ordre de quelques semaines, non d'un sprint.

**Faisabilité :** Bonne : s'appuie sur les entités `City`/`Route` déjà en place, aucune nouvelle brique technologique.

### 3.2 Système de niveaux et d'achievements

**Constat :** Retour direct de joueurs : le seul indicateur de progression actuel est le solde de mazcoins, qui ne distingue pas un joueur régulier depuis longtemps d'un joueur ayant simplement eu de la chance à `/coinflip`.

**Recommandation :** Un niveau basé sur l'activité cumulée (voyages effectués, jours actifs, travaux réalisés) et des accomplissements mérités par le jeu, bien distincts des badges cosmétiques déjà achetables en boutique, pour ne pas brouiller les deux notions.

**Gain pour l'attractivité :** Une progression visible retient davantage qu'un simple compteur d'argent ; donne un statut reconnaissable aux joueurs les plus actifs.

**Coût et délai estimés :** Le plus engageant des trois : table de progression, calcul des seuils, interface dédiée web et bot. Nécessite un vrai travail d'équilibrage de jeu en amont du code, au-delà du seul développement.

**Faisabilité :** Bonne techniquement, mais à cadrer sérieusement avant de chiffrer un délai précis : l'équilibrage (quels seuils, quelle vitesse de progression) conditionne autant le résultat que le code lui-même.

### 3.3 Mini-jeux rémunérateurs supplémentaires

**Constat :** Retour direct de joueurs : envie de plus de variété dans les façons de gagner des mazcoins, au-delà de `/work`, `/daily` et `/coinflip`.

**Recommandation :** Un ou deux mini-jeux supplémentaires, avec un gain modeste et plafonné, en réutilisant la même logique d'équilibrage déjà en place pour `/coinflip` (mise plafonnée à 50 % du solde, voir [CAHIER_DE_RECETTES.md S04](CAHIER_DE_RECETTES.md#3-structurel--recette)) plutôt que d'inventer une nouvelle économie.

**Gain pour l'attractivité :** Plus de variété par session de jeu, sans déséquilibrer l'économie existante puisqu'elle réutilise des garde-fous déjà éprouvés.

**Coût et délai estimés :** Le plus variable des trois : dépend entièrement du mini-jeu choisi. Un mini-jeu du type pile/face déjà existant serait rapide ; quelque chose de plus élaboré (temporalité, état persistant) coûterait nettement plus. Un cadrage précis reste nécessaire avant tout chiffrage.

**Faisabilité :** Bonne si le mini-jeu reste simple et réutilise l'infrastructure de commandes existante ; à réévaluer si l'ambition grandit.

---

## 4. Synthèse et priorisation

| # | Recommandation | Famille | Coût / délai | Gain principal | Priorité suggérée |
|---|---|---|---|---|---|
| 2.1 | Audit de dépendances bloquant en CI | Fiabilité | Très faible (0,5 j) | Risque de sécurité supprimé à la source | 1 (la moins coûteuse de toutes) |
| 2.3 | Erreurs frontend habillées | Fiabilité | Faible (2-3 j) | Expérience joueur, immersion | 2 (rapide, forte valeur perçue) |
| 2.2 | Déploiement sans coupure | Fiabilité | Modéré (quelques j) | Fiabilité perçue | 3 (dépend du rythme de release visé) |
| 2.4 | Mise à jour du framework | Fiabilité | Élevé (sprint dédié) | Réduction du risque de sécurité | 4 (avant le premier déploiement réel) |
| 3.1 | Événements temporaires par ville | Engagement | Modéré (quelques semaines) | Fréquence de retour des joueurs | 5 (première brique de V2) |
| 3.3 | Mini-jeux rémunérateurs | Engagement | Variable, à cadrer | Variété par session | 6 (selon l'ambition retenue) |
| 3.2 | Niveaux et achievements | Engagement | Élevé (équilibrage + dev) | Rétention, statut joueur | 7 (la plus structurante, donc la plus tardive) |

Les recommandations de fiabilité (2.1 à 2.4) sont toutes antérieures aux recommandations d'engagement (3.1 à 3.3) dans cet ordre de priorité, ce qui correspond au séquencement explicite décrit en [§3](#3-engagement-joueur--pour-une-v2-après-le-premier-déploiement-réel) : consolider un premier déploiement avant d'élargir le périmètre fonctionnel. Au sein de chaque famille, les recommandations les moins coûteuses passent en premier : elles se livrent vite, avec un risque de régression minimal, et donnent un signal de qualité immédiat.
