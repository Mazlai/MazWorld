# User stories - MazWorld

## Méthode

Ce document dresse la liste de tous les **scénarios utilisateur** du projet, tracés dans GitHub Issues avec le label **`SU`** ("Scénario Utilisateur"), dans une structure `Initiative > Epic > Feature > SU` mise en place grâce aux sous-issues natives de GitHub (les relations parent/enfant sont vérifiées par l'API, pour un total de 78 SU tous rattachés à une feature ou une epic).

**Point de rigueur à souligner** : aucune des 78 issues SU ne comporte déjà, dans son corps, la formule littérale *"En tant que… je veux… afin de…"* : certaines sont des tickets vides ou de simples checklists techniques (héritage des débuts du projet, avant formalisation de la méthode). La formulation ci-dessous a donc été **reconstruite** à partir du titre de chaque SU et du contexte de sa feature/epic parente, sans ajouter de bénéfice ou de comportement non décrit dans le ticket d'origine.  Quand un ticket ne désigne aucun bénéficiaire joueur identifiable (infrastructure pure, outillage CI), l'acteur est explicitement un développeur/mainteneur et non un joueur fictif.

**Légende d'état :** ✅ Terminé (`CLOSED`) & 🔄 Ouvert (`OPEN`, non implémenté à ce jour).

---

## 1. Fondations techniques (configuration initiale) — Features #16, #17, #18, #29, #31, #32

| SU | Statut | Scénario utilisateur |
|---|---|---|
| [#20](../../issues/20) | ✅ | En tant que développeur, j'ai besoin d'installer Symfony et de structurer le projet backend (controllers, entities, repositories, services), pour obtenir une base de code prête à accueillir l'API. |
| [#22](../../issues/22) | ✅ | En tant que développeur, je souhaite paramétrer la connexion à une base MySQL locale, pour avoir un environnement de développement fonctionnel. |
| [#24](../../issues/24) | ✅ | En tant que développeur, je souhaite charger des fixtures (utilisateurs, villes, items) dans la base, pour développer et tester les fonctionnalités sans dépendre de données réelles. |
| [#33](../../issues/33) | ✅ | En tant que développeur, je souhaite obtenir un modèle conceptuel de données (MCD) validé, pour structurer les entités et leurs relations avant l'implémentation. |
| [#19](../../issues/19) | ✅ | En tant que développeur, je souhaite initialiser le projet Angular en mode standalone, de façon à avoir une base de code moderne prête à accueillir les fonctionnalités. |
| [#134](../../issues/134) | ✅ | En tant que développeur, je souhaite paramétrer les environnements Angular ainsi qu'un proxy de développement, ceci afin d'éviter les problèmes CORS et de préparer le déploiement multi-environnements. |
| [#21](../../issues/21) | ✅ | En tant que développeur, je souhaite définir un design system SCSS (couleurs, typographies, mixins) pour garantir une cohérence visuelle dans tout le frontend. |
| [#25](../../issues/25) | ✅ | En tant que développeur, je souhaite initialiser la structure du projet du bot Discord pour avoir une base de code prête à l’emploi afin de développer les commandes. |
| [#26](../../issues/26) | ✅ | En tant que développeur je veux paramétrer le token du bot et vérifier sa connexion à l'API Discord afin d'avoir un démarrage fiable. |
| [#23](../../issues/23) | ✅ | En tant que développeur, je souhaite disposer de routes API de test renvoyant des données fictives, pour vérifier que l'API fonctionne correctement avant de mettre en place la logique réelle. |
| [#46](../../issues/46) | ✅ | En tant que développeur, je souhaite disposer de routes CRUD pour les entités du jeu, de façon à ce que le frontend et le bot puissent lire et écrire les données applicatives. |

## 2. Authentification (Features #30, #31)

| SU | Statut | Scénario utilisateur |
|---|---|---|
| [#44](../../issues/44) | ✅ | En tant que joueur, je souhaite pouvoir me connecter avec mon compte Discord et recevoir un jeton d’authentification, afin d’accéder à l’application sans créer de nouvel identifiant. |
| [#45](../../issues/45) | ✅ | En tant que joueur, je veux rester connecté de façon sécurisée pendant mon utilisation de l'application, afin de ne pas me faire déconnecter de façon intempestive. |
| [#135](../../issues/135) | ✅ | En tant que joueur, je veux rester connecté et accéder automatiquement aux pages protégées, pour ne pas avoir à me réauthentifier à chaque navigation. |
| [#184](../../issues/184) | ✅ | En tant que joueur, je souhaite que ma connexion avec Discord soit protégée contre les attaques de type CSRF (falsification de requête intersite) grâce à une vérification du paramètre `state` OAuth côté serveur, de sorte qu'un attaquant ne puisse pas détourner mon flux d'authentification. |
| [#183](../../issues/183) | ✅ | En tant que joueur, je souhaite qu’un jeton devienne invalide dès que je me déconnecte, pour qu’un jeton capturé ne puisse pas servir à usurper mon compte. |
| [#151](../../issues/151) | ✅ | En tant que joueur, je veux que mon jeton d’authentification ne soit jamais persisté dans mon navigateur afin de réduire le risque de vol de session en cas de faille XSS. |
| [#185](../../issues/185) | ✅ | En tant que joueur, je souhaite que les tentatives de connexion excessives soient limitées, afin que mon compte et le service soient protégés contre les abus. |
| [#186](../../issues/186) | ✅ | En tant que mainteneur, je veux que la vérification du secret partagé du bot soit résistante aux attaques temporelles, pour qu'un attaquant ne puisse pas deviner le secret en mesurant les temps de réponse. |
| [#192](../../issues/192) | ✅ | En tant que joueur, je souhaite que chaque nouvelle route de l'API soit sécurisée par défaut, afin qu'une erreur de configuration ne rende jamais mes données accessibles sans authentification. |

## 3. Profil de l'utilisateur (Features #55, #56)

| SU | Statut | Scénario utilisateur |
|---|---|---|
| [#69](../../issues/69) | ✅ | En tant que joueur, je souhaite pouvoir consulter mon profil (avatar, pseudo, statistiques), afin de voir mon évolution et mon identité dans le jeu. |
| [#70](../../issues/70) | ✅ | En tant que joueur, je souhaite que les items achetés s'ajoutent à mon inventaire et puissent être équipés, dans le but de personnaliser mon profil. |
| [#71](../../issues/71) | ✅ | En tant que joueur, je souhaite pouvoir consulter mon inventaire sur l'application web, afin de voir les items en ma possession. |

## 4. Carte / Villes (Features #57, #58)

| SU | Statut | Scénario utilisateur |
|---|---|---|
| [#72](../../issues/72) | ✅ | En tant que joueur, je souhaite visualiser une carte interactive des villes du jeu, afin de m’y repérer et choisir mes destinations. |
| [#73](../../issues/73) | ✅ | En tant que joueur, je souhaite pouvoir voyager d’une ville à une autre, pour explorer le monde du jeu et débloquer de nouveaux emplois et opportunités. |
| [#74](../../issues/74) | ✅ | En tant que joueur, je souhaite qu’un délai soit appliqué entre deux voyages, pour conserver un rythme de progression équilibré du jeu. |
| [#75](../../issues/75) | ✅ | En tant que joueur, je souhaite ne pas pouvoir partir en voyage si je n’ai pas assez de fonds, pour ne jamais avoir de solde négatif. |

## 5. Boutique (Features #59, #60, #177)

| SU | Statut | Scénario utilisateur | 
|---|---|---| 
| [#78](../../issues/78) | ✅ | En tant que joueur, je veux consulter la liste des items disponibles à l'achat, afin de choisir ceux qui m'intéressent.  | 
| [#76](../../issues/76) | ✅ | En tant que joueur, je veux acheter un item de la boutique en validant que je remplis les conditions (solde suffisant, item non déjà possédé), afin de personnaliser mon profil sans erreur de transaction.  | 
| [#77](../../issues/77) | ✅ | En tant que joueur, je veux que mon solde et mon inventaire soient mis à jour immédiatement après un achat, afin de voir instantanément le résultat de ma transaction.  | 
| [#182](../../issues/182) | ✅ | En tant que joueur, je veux que mon solde de MazCoins ne puisse jamais devenir incohérent (double débit, solde négatif) même en cas de requêtes simultanées, afin de faire confiance à l'intégrité de mon compte.  |

## 6. Classement (Feature #63)

| SU | Statut | Scénario utilisateur |
|---|---|---|
| [#81](../../issues/81) | ✅ | En tant que joueur, je souhaite que le classement prenne en compte mon solde actuel de MazCoins, de manière à suivre ma progression par rapport aux autres joueurs. |
| [#82](../../issues/82) | ✅ | En tant que joueur, je souhaite consulter le classement des joueurs page par page, afin de pouvoir me situer par rapport aux autres joueurs sans surcharger l’affichage. |

## 7. Statistiques (Features #61, #62)

| SU | Statut | Scénario utilisateur |
|---|---|---|
| [#79](../../issues/79) | ✅ | En tant que joueur, je souhaite voir mes statistiques actualisées en temps réel sur le dashboard, de manière à suivre ma progression sans avoir à recharger la page. |
| [#80](../../issues/80) | ✅ | En tant que joueur, je souhaite pouvoir consulter mon historique et mes records personnels par catégorie, afin de suivre mes performances passées. |

## 8. Bot Discord - commandes slash (Features #43, #64)

| SU | Statut | Scénario utilisateur |
|---|---|---|
| [#48](../../issues/48) | ✅ | En tant que joueur, je veux pouvoir voir mon profil (`/profile`) depuis Discord afin de suivre ma progression sans quitter l'application Discord. |
| [#47](../../issues/47) | ✅ | En tant que joueur, je veux afficher les informations d’une ville (`/cityinfo`), pour connaître son thème et interagir avec elle depuis Discord. |
| [#54](../../issues/54) | ✅ | En tant que joueur, je veux voir la liste des villes et ma position actuelle (`/map`), pour pouvoir planifier mes trajets depuis Discord. |
| [#49](../../issues/49) | ✅ | En tant que joueur, je veux pouvoir consulter et acheter les items de la boutique (`/shop`) depuis Discord afin de personnaliser mon profil sans avoir à changer d'application. |
| [#52](../../issues/52) | ✅ | En tant que joueur, je veux pouvoir consulter mon inventaire (`/inventory`) depuis Discord, pour savoir ce que je possède. |
| [#50](../../issues/50) | ✅ | En tant que joueur, je souhaite pouvoir réclamer une récompense quotidienne (`/daily`), de manière à progresser régulièrement même sans jouer intensivement. |
| [#53](../../issues/53) | ✅ | En tant que joueur, je souhaite effectuer un travail avec cooldown (`/work`) afin de gagner des MazCoins et ainsi générer un revenu régulier en jouant depuis Discord. |
| [#51](../../issues/51) | ✅ | En tant que joueur, je souhaite parier des MazCoins sur un tirage au sort pile ou face (`/coinflip`), dans le but de tenter de gagner plus d'argent. |
| [#86](../../issues/86) | ✅ | En tant que joueur, je veux consulter une page web qui répertorie toutes les commandes disponibles du bot, pour découvrir les fonctionnalités du jeu sans avoir à les deviner. |

## 9. Discord Bot — cœur technique (Features #18, #31, #39, #65)

| SU | Statut | Scénario utilisateur |
|---|---|---|
| [#40](../../issues/40) | ✅ | En tant que joueur, je souhaite que le bot réagisse de façon fiable aux événements Discord (connexion, message, interaction) pour que mes commandes soient toujours prises en compte. |
| [#41](../../issues/41) | ✅ | En tant que joueur, je souhaite que mes commandes slash soient correctement acheminées, avec gestion des permissions et des erreurs, afin d'obtenir une réponse fiable quelle que soit la commande utilisée. |
| [#42](../../issues/42) | ✅ | En tant que joueur, je souhaite que le bot Discord puisse communiquer de façon fiable avec l’API du jeu, afin que les actions que je déclenche depuis Discord soient bien prises en compte. |
| [#87](../../issues/87) | ✅ | En tant que joueur, je souhaite obtenir un message explicite en cas d’échec d’une commande, pour savoir ce qui s’est passé et non pas recevoir un silence ou un crash. |
| [#88](../../issues/88) | ✅ | En tant que mainteneur, je veux logger chaque commande exécutée, afin de diagnostiquer les anomalies et suivre l'utilisation du bot. |

## 10. Gestion des serveurs Discord (Features #66, #67, #68)

| SU | Statut | Scénario utilisateur |
|---|---|---|
| [#84](../../issues/84) | ✅ | En tant qu'administrateur d'un serveur Discord, je souhaite pouvoir ajouter facilement le bot MazWorld à mon serveur afin de proposer le jeu à ma communauté. |
| [#83](../../issues/83) | ✅ | En tant que joueur, je veux voir la liste des serveurs Discord disponibles pour jouer, afin de choisir où utiliser le bot. |
| [#85](../../issues/85) | ✅ | En tant que joueur, je souhaite savoir si le bot est en ligne et disponible afin de comprendre pourquoi une commande ne répond pas si tel est le cas. |

## 11. UX/UI en transversal (Features #16, #35)

| SU | Statut | Scénario utilisateur |
|---|---|---|
| [#109](../../issues/109) | ✅ | En tant que joueur, je veux que l’identité graphique soit cohérente sur l’ensemble de l’application afin d’avoir une expérience homogène et reconnaissable. |
| [#37](../../issues/37) | ✅ | En tant que développeur, je souhaite avoir des composants UI réutilisables (header, footer, boutons, cards, modals) pour garantir une cohérence visuelle et accélérer le développement. |
| [#36](../../issues/36) | ✅ | En tant que joueur, je souhaite que l'application soit bien adaptée pour les écrans de desktop, de tablette et de mobile, pour jouer confortablement sur n'importe quel appareil. |

## 12. Sécurité applicative (Epic #173 — Features #175, #176)

| SU | Statut | Scénario utilisateur |
|---|---|---|
| [#181](../../issues/181) | ✅ | En tant que joueur, je souhaite que l'application me protège contre le clickjacking, le sniffing MIME et les injections cross-origin grâce à des en-têtes de sécurité HTTP, afin que ma session reste protégée sans que je le sache. |
| [#179](../../issues/179) | ✅ | En tant que joueur, je veux que mes tokens Discord (accès/refresh) soient stockés chiffrés en base de données, pour qu'un vol de la base ne mette pas directement mon compte Discord en danger. |
| [#180](../../issues/180) | ✅ | En tant que joueur, je souhaite que les erreurs techniques internes (chemins de fichiers, requêtes SQL…) ne soient jamais affichées dans les réponses de l’application, pour qu’un attaquant ne puisse pas profiter de ces informations à mon détriment. |

> Note de traçabilité : le corps de l’issue #180 se réclame de la Feature #175, mais le lien parent structurel GitHub la rattache directement à l’Epic #173 — divergence mineure dans les métadonnées du repo, signalée ici par souci d’exactitude plutôt que corrigée silencieusement.

## 13. Qualité et tests (Epic #89 — Feature #90)

| SU | Statut | Scénario utilisateur |
|---|---|---|
| [#91](../../issues/91) | ✅ | En tant que développeur, je souhaite disposer d'une batterie de tests unitaires et d'intégration couvrant les couches métier du backend, afin de garantir la non-régression et la fiabilité du code. |
| [#92](../../issues/92) | ✅ | En tant que développeur, je souhaite disposer d’une suite de tests unitaires et d’intégration couvrant les composants et la logique Angular afin de garantir la non régression du frontend. |
| [#93](../../issues/93) | 🔄 | En tant que développeur, je souhaite disposer de tests end-to-end couvrant les parcours critiques (authentification, carte, actions de jeu), pour valider le comportement réel de l’application du point de vue du joueur. |

## 14. Accessibilité (Epic #174 — Feature #178)

| SU | Statut | Scénario utilisateur | 
|---|---|---|
| [#188](../../issues/188) | ✅ | En tant que mainteneur, je veux réaliser un audit complet de l'accessibilité de l'application afin d'identifier et de prioriser les corrections nécessaires à la conformité WCAG 2.1 AA. |
| [#190](../../issues/190) | ✅ | En tant que joueur non utilisateur de souris, je veux pouvoir naviguer dans toute l'application au clavier, pour accéder à toutes les fonctionnalités sans dépendre d'un dispositif de pointage. |
| [#189](../../issues/189) | ✅ | En tant que joueur utilisant un lecteur d'écran, je souhaite que les composants dynamiques (chargement, statistiques, badges, pagination) soient correctement annoncés, pour comprendre les mises à jour de l'interface sans les voir. |
| [#191](../../issues/191) | ✅ | En tant que joueur utilisant un lecteur d'écran, je souhaite que les images, icônes et champs de formulaire aient des alternatives textuelles et des labels adaptés, pour pouvoir comprendre le contenu et interagir sans repère visuel. |
| [#215](../../issues/215) | ✅ | En tant que joueur malvoyant ou dans un environnement mal éclairé, je veux que les textes informatifs respectent un ratio de contraste suffisant, pour pouvoir les lire distinctement. |

## 15. CI/CD (Epic #94 — Features #95, #96)

| SU | Statut | Scénario utilisateur |
|---|---|---|
| [#97](../../issues/97) | ✅ | En tant que développeur, je souhaite qu’une stratégie de branches Git soit validée automatiquement sur chaque pull request, afin d’empêcher les fusions non conformes au flux de travail établi. |
| [#98](../../issues/98) | ✅ | En tant que développeur, je souhaite qu'une pipeline exécute automatiquement les tests et le linting à chaque pull request, de manière à vérifier l'absence de régression avant la fusion. |
| [#228](../../issues/228) | ✅ | En tant que développeur, je souhaite pouvoir consulter un rapport de couverture de code généré à chaque exécution CI, afin d’évaluer l’effort de test sans exécuter la suite localement. |
| [#107](../../issues/107) | ✅ | En tant que mainteneur, je souhaite que chaque service ait des images Docker de production optimisées (build multi-stage), afin de réduire la taille des images et rendre le déploiement plus fiable. |
| [#108](../../issues/108) | ✅ | En tant que développeur, je souhaite disposer d’un environnement Docker Compose identique en développement et en production, pour déployer et faire évoluer l’application de manière fiable et reproductible. |
| [#99](../../issues/99) | ✅ | En tant que mainteneur, je souhaite disposer d’un processus de release automatisé et normalisé (versioning, tag), pour livrer les évolutions de façon fiable et traçable. |
| [#101](../../issues/101) | 🔄 | En tant que mainteneur, je souhaite migrer l'hébergement vers un VPS OVHcloud et automatiser son déploiement, pour obtenir une infrastructure de production stable et accessible publiquement. |
| [#100](../../issues/100) | ⛔ abandonnée | *En tant que mainteneur, je souhaitais déployer l'application sur un Raspberry Pi afin de pouvoir disposer d'un hébergement à faible coût — plan initial remplacé par le VPS OVHcloud (#101), l'issue reste ouverte mais n'est plus poursuivie.* |

## 16. Monitoring (Epic #102 — Feature #103)

| SU | Statut | Scénario utilisateur |
|---|---|---|
| [#104](../../issues/104) | ✅ | En tant que mainteneur, je veux que les dépendances vulnérables ou obsolètes soient détectées et mises à jour automatiquement (Dependabot) afin de réduire l'exposition aux vulnérabilités connues. |
| [#187](../../issues/187) | ✅ | En tant que mainteneur, je souhaite logger les échecs d’authentification (bot, JWT) dans un canal dédié, pour détecter les tentatives d’intrusion et protéger les comptes joueurs. |
| [#106](../../issues/106) | 🔄 | En tant que mainteneur, je veux visualiser les métriques applicatives et de sécurité dans Grafana, afin de surveiller la santé et la sécurité du système en production. |
| [#105](../../issues/105) | 🔄 | En tant que mainteneur, je souhaite gérer les conteneurs Docker de production via une interface web (Portainer) pour simplifier la supervision et éviter les lignes de commande. |

## Synthèse

- **78 scénarios utilisateur** au total, **73 clos**, **4 ouverts** (#93, #101, #105, #106), **1 abandonné** (#100, remplacé par #101).
- Acteurs identifiés : **joueur** (majorité, ~50 SU), **développeur/mainteneur** (tâches d’infrastructure, de qualité et de sécurité sans bénéficiaire joueur direct), **administrateur de serveur Discord** (#84).
- Hiérarchie source : 5 Initiatives, 18 Epics, 33 Features, 78 SU — vérifiée via l'API GitHub (relations parent/enfant natives), aucune SU orpheline.