# Audit d'accessibilité — MazWorld

**Présenté par Mickael FERNANDEZ** — Étudiant M2 Développement Web, Ynov Campus

---

## Sommaire

1. [Choix du référentiel et du niveau](#choix-du-référentiel-et-du-niveau)
2. [Outils d'audit](#outils-daudit)
3. [État des SUs — Feature #178 (conformité WCAG 2.1 AA)](#état-des-sus--feature-178-conformité-wcag-21-aa)
4. [Points conformes (dès l'audit initial)](#points-conformes-dès-laudit-initial)

---

**Périmètre :** 14 templates Angular (pages publiques + protégées)
**Référentiel :** WCAG 2.1 niveau AA

---

## Choix du référentiel et du niveau

### Référentiel retenu : WCAG 2.1

Trois référentiels étaient candidates :

**RGAA 4.1** (Référentiel Général d'Amélioration de l'Accessibilité) — déclinaison française de WCAG 2.1 avec des tests adaptés au contexte réglementaire français (loi du 11 février 2005, décret 2019-768). Sa conformité est **juridiquement obligatoire pour les organismes publics et certains services d'intérêt général**. MazWorld est une application privée de jeu : cette obligation légale ne s'applique pas. Choisir le RGAA ajouterait des exigences de procédure (déclaration de conformité publiée, schéma pluriannuel, mentions légales) qui n'ont pas de justification fonctionnelle dans ce contexte.

**OPQUAST** (450 bonnes pratiques) — référentiel de **qualité web** couvrant accessibilité, performance, SEO et UX. Il ne constitue pas un standard d'accessibilité à proprement parler : ses critères accessibilité sont un sous-ensemble non structuré, sans niveaux de conformité formels. Il n'est pas adapté pour démontrer la conformité aux exigences d'accessibilité d'une application web.

**WCAG 2.1** (Web Content Accessibility Guidelines, W3C) — standard international sur lequel le RGAA est fondé. Il définit les critères de succès de manière technologie-agnostique, est reconnu dans toutes les juridictions et constitue la référence de l'industrie. C'est le choix le plus pertinent pour une SPA Angular à vocation internationale.

### Niveau retenu : AA

WCAG 2.1 définit trois niveaux :

- **Niveau A** (minimum) : supprime les barrières les plus critiques, mais laisse des obstacles significatifs pour les utilisateurs de lecteurs d'écran, de navigation clavier ou de technologies d'assistance. Insuffisant pour une application interactive.
- **Niveau AA** (standard) : objectif de référence pour les applications web professionnelles. C'est le niveau exigé par EN 301 549 (directive européenne sur l'accessibilité numérique), par la Section 508 américaine (WCAG 2.0 AA), et par le RGAA lui-même pour les organismes publics. C'est la cible reconnue par l'industrie pour garantir une expérience accessible au plus grand nombre.
- **Niveau AAA** (optimal) : le W3C déclare explicitement qu'il n'est pas possible de satisfaire tous les critères AAA pour l'ensemble d'un site, certains critères étant mutuellement exclusifs selon le type de contenu. Ce niveau est adapté à des contenus spécifiques (vidéo sous-titrée, langue des signes...), pas à une SPA complète.

**Le niveau AA est donc le seul choix raisonnablement atteignable et suffisamment exigeant** pour MazWorld.

### Portée de la conformité

L'application vise la conformité WCAG 2.1 AA sur l'ensemble de son périmètre. Les violations identifiées lors de l'audit (SU #188) ont toutes été corrigées (SUs #191, #190, #189, #215). Une conformité à 100 % certifiée formellement nécessiterait un audit par un expert accrédité ; les outils utilisés (axe-core, Lighthouse, tests manuels) permettent d'affirmer que les critères AA sont **substantiellement respectés** sur le périmètre audité.

---

## Outils d'audit

### Lighthouse (pages publiques)

Les pages ne nécessitant pas d'authentification ont été auditées via Lighthouse (DevTools Chrome). Score obtenu : **≥ 90 %** sur `/` et `/commands`.

Les routes protégées ne sont pas auditables par Lighthouse : le JWT étant stocké en mémoire (choix SU #151), tout nouveau contexte navigateur ouvert par Lighthouse est redirigé vers la home sans token.

### axe-core (pages protégées)

`axe-core` est intégré dans `main.ts` en mode développement. À chaque navigation Angular, les violations sont loggées dans la console avec leur sévérité et le fragment HTML concerné. Cette approche contourne la contrainte JWT puisque l'analyse s'exécute dans le contexte navigateur existant, avec la session active.

Un mécanisme de debounce (500 ms) empêche les doubles exécutions lors des navigations qui déclenchent simultanément l'événement initial et le premier `NavigationEnd`.

```ts
// main.ts — dev uniquement
if (!environment.production) {
  const { default: axe } = await import('axe-core');

  let axeTimer: ReturnType<typeof setTimeout> | null = null;
  const runAxe = () => {
    if (axeTimer) clearTimeout(axeTimer);
    axeTimer = setTimeout(() => {
      axeTimer = null;
      axe.run().then(({ violations }) => {
        if (!violations.length) return;
        console.group(`%c♿ axe — ${violations.length} violation(s)`, 'color:#f87171;font-weight:bold');
        violations.forEach(v => {
          console.warn(`[${v.impact?.toUpperCase()}] ${v.description}`);
          v.nodes.forEach(n => console.warn('  ↳', n.html));
        });
        console.groupEnd();
      });
    }, 500);
  };

  router.events.pipe(filter(e => e instanceof NavigationEnd)).subscribe(runAxe);
  runAxe();
}
```

### Navigation clavier manuelle

Réalisée page par page après implémentation des SUs #189/#190/#191 : Tab, Shift+Tab, Entrée, Espace, Échap, touches directionnelles.

### Chrome DevTools — Accessibility panel

Utilisé pour la vérification des ratios de contraste (SU #215).

---

## État des SUs — Feature #178 (conformité WCAG 2.1 AA)

### SU #188 — Audit initial ✅

Audit complet réalisé sur l'ensemble des 14 templates. Résultats documentés dans ce fichier ; corrections priorisées en SUs #191 → #190 → #189 → #215.

---

### SU #191 — Textes alternatifs & labels accessibles ✅

| Page / Composant | Critère WCAG | Problème identifié | Correction appliquée |
|---|---|---|---|
| `index.html` | 3.1.1 A | `lang="en"`, titre générique "Frontend" | `lang="fr"`, `<title>MazWorld</title>` |
| `index.html` (CSP) | — | axe-core bloqué par CSP lors de la vérification des polices Google | Ajout de `connect-src … https://fonts.googleapis.com` |
| `stat-card` (global) | 1.3.1 A | Valeur et label lus séparément par les AT | `role="group"` + `[attr.aria-label]="value() + ' ' + label()"` |
| Map — panneau ville | 4.1.2 A | Bouton "✕" sans nom accessible | `aria-label="Fermer le panneau"` |
| Shop — btn-buy (loading) | 4.1.2 A | Spinner CSS pur, bouton sans texte pendant l'achat | `[attr.aria-label]="'Achat en cours…'"` + `aria-hidden` sur le dot |
| Inventory — slot-unequip | 4.1.2 A | `title` non fiable pour les AT | `aria-label="Déséquiper"` (title supprimé) |
| Header — hamburger | 4.1.2 A | `aria-expanded` absent, label statique | `[attr.aria-label]` dynamique + `[attr.aria-expanded]="isMobileMenuOpen()"` |
| Shop — pagination | 4.1.2 A | Boutons ◀ ▶ sans label, conteneur `<div>` | `<nav aria-label="Pagination">`, `aria-label` prev/next, `aria-current="page"`, `aria-live="polite"` |
| Leaderboard — pagination | 4.1.2 A | Info de page non annoncée aux AT | `<nav aria-label="Pagination">`, `aria-live="polite"` sur le compteur |
| 13 templates (global) | 1.1.1 A | Emojis décoratifs (icônes, illustrations) lus par les AT | `aria-hidden="true"` sur toutes les balises emoji non porteuses d'information |

---

### SU #190 — Navigation clavier & gestion du focus ✅

| Page / Composant | Critère WCAG | Problème identifié | Correction appliquée |
|---|---|---|---|
| Map — marqueurs villes | 2.1.1 A | `<div>` cliquables inaccessibles au clavier | `role="button"` + `tabindex="0"` + `(keydown.enter)` + `(keydown.space)` |
| Map — panneau (fermeture) | 2.1.1 A | Pas d'échappement clavier du panneau | `(keydown.escape)="closePanel()"` sur l'`<aside>` |
| Header — dropdown utilisateur | 2.1.1 A | Pas de navigation clavier dans le menu | `(keydown)="onUserMenuKeydown($event)"` sur le trigger + `(keydown)="onMenuKeydown($event)"` sur le menu (Échap, flèches) |
| Map — marqueurs | 4.1.2 A | Nom accessible absent sur les zones cliquables | `[attr.aria-label]="city.name"` sur chaque marqueur |

---

### SU #189 — Attributs ARIA sur composants dynamiques ✅

| Composant | Critère WCAG | Problème identifié | Correction appliquée |
|---|---|---|---|
| Header — trigger menu utilisateur | 4.1.2 A | `aria-expanded` et `aria-haspopup` absents | `aria-haspopup="menu"` + `[attr.aria-expanded]="isUserMenuOpen()"` |
| Header — dropdown | 4.1.2 A | Visible aux AT même fermé | `[attr.aria-hidden]="!isUserMenuOpen() \|\| null"` |
| Shop — notification | 4.1.3 AA | Mise à jour non annoncée aux AT | `role="alert"` + `aria-live="assertive"` |
| États de chargement | 4.1.3 AA | Spinner sans rôle sémantique | `role="status"` sur les conteneurs d'état (shop, leaderboard, …) |
| `empty-state` (composant partagé) | 4.1.3 AA | Contenu dynamique non annoncé | `aria-live="polite"` sur le conteneur |
| Leaderboard — tableau | 1.3.1 A | Structure div/span sans sémantique tabulaire | `<table>` + `<thead>` + `<th scope="col">` |

---

### SU #215 — Contraste des textes ✅

Vérification via Chrome DevTools (Accessibility panel) et Lighthouse sur toutes les pages.

- Texte normal : ratio ≥ 4.5:1 (WCAG 1.4.3 AA)
- Grand texte (≥ 18 pt ou 14 pt gras) : ratio ≥ 3:1
- Composants UI (boutons, indicateur de focus) : ratio ≥ 3:1 (WCAG 1.4.11 AA)
- Palette du design system conçue avec des variables CSS garantissant les ratios en mode clair comme sombre

---

## Points conformes (dès l'audit initial)

- `role="menu"` + `role="menuitem"` sur le dropdown utilisateur
- `role="separator"` sur le séparateur du dropdown
- `role="status"` + `aria-label` sur `SpinnerComponent`
- Attribut `alt` requis et renseigné sur tous les avatars (`AvatarComponent`)
- `aria-label="Navigation principale"` et `"Actions rapides"` sur les `<nav>`
- Hiérarchie `h1` → `h2` → `h3` respectée sur toutes les pages
- `aria-hidden="true"` sur les emojis décoratifs des liens de navigation desktop
- `aria-label` sur l'affichage du solde MazCoins et des badges équipés (profil)
- `<span class="error-icon" aria-hidden="true">⚠️</span>` sur la page profil (dès l'origine)
