# Audit d'accessibilité — MazWorld

**Date :** juillet 2026
**Périmètre :** 14 templates Angular (pages publiques + protégées)
**Référentiel :** WCAG 2.1 niveau AA

---

## Choix du référentiel

L'audit s'appuie sur **WCAG 2.1 AA** plutôt que sur le RGAA 4.1.

Le RGAA est le référentiel national français et constitue une déclinaison de WCAG 2.1 adaptée au cadre légal français (loi du 11 février 2005, décret 2019). Sa conformité est obligatoire pour les organismes publics. MazWorld est une application privée : cette obligation ne s'applique pas.

Par ailleurs, le RGAA ajoute 56 critères propres à la méthodologie française au-delà des 50 critères WCAG AA. Implémenter ces critères supplémentaires représente un effort significatif pour un gain marginal dans ce contexte. Toute application conforme RGAA est automatiquement conforme WCAG 2.1 AA, mais l'inverse n'est pas vrai : WCAG 2.1 AA reste le standard international reconnu et suffisant pour ce projet.

---

## Résumé

| Sévérité | Nombre | Critères WCAG concernés |
|---|---|---|
| Critique (niveau A bloqué) | 4 | 1.1.1, 2.1.1, 2.4.1, 4.1.2 |
| À améliorer (AA partiel) | 7 | 1.1.1, 1.3.1, 4.1.2, 4.1.3 |
| Conforme | 9 | — |

---

## Violations identifiées

### SU #191 — Textes alternatifs & labels accessibles

| Page / Composant | Critère | Sévérité | Problème | Correction |
|---|---|---|---|---|
| Header (nav mobile) | 1.1.1 A | Améliorer | Émojis des liens non masqués aux AT | `<span aria-hidden="true">` |
| Map — panneau ville | 1.1.1 A | **Critique** | Bouton "✕" sans label accessible | `aria-label="Fermer le panneau"` |
| Shop — pagination | 1.1.1 A | Améliorer | Boutons ◀ ▶ sans label | `aria-label="Page précédente/suivante"` |
| Shop — slots badge | 1.1.1 A | Améliorer | `[title]` non fiable pour AT | `aria-label="Équiper badge en slot N"` |
| `stat-card` (global) | 1.3.1 A | Améliorer | Valeur et label lus séparément | `aria-label` combinant les deux |

### SU #190 — Navigation clavier & gestion du focus

| Page / Composant | Critère | Sévérité | Problème | Correction |
|---|---|---|---|---|
| Global | 2.4.1 A | **Critique** | Pas de skip link | Lien "Aller au contenu principal" |
| Map — marqueurs villes | 2.1.1 A | **Critique** | `<div>` cliquables non accessibles au clavier | `role="button"` + `tabindex="0"` + keydown |
| Header — dropdown | 2.1.1 A | Améliorer | Pas de navigation clavier (Échap, flèches) | Handler `(keydown)` |
| Map — panneau ville | 2.4.3 A | Améliorer | Focus non déplacé à l'ouverture du panneau | `focus()` sur premier élément |

### SU #189 — Attributs ARIA sur composants dynamiques

| Composant | Critère | Sévérité | Problème | Correction |
|---|---|---|---|---|
| Header — bouton trigger menu | 4.1.2 A | **Critique** | Ni `aria-expanded` ni `aria-haspopup` | Ajouter les deux attributs |
| Header — hamburger | 4.1.2 A | Améliorer | `aria-expanded` absent | `[attr.aria-expanded]` |
| Header — dropdown | 4.1.2 A | Améliorer | Visible aux AT même fermé | `aria-hidden` conditionnel |
| Shop — notification | 4.1.3 AA | Améliorer | Mise à jour non annoncée | `role="alert"` |
| `empty-state` | 4.1.3 AA | Améliorer | Contenu dynamique non annoncé | `aria-live="polite"` |
| Leaderboard — tableau | 1.3.1 A | Améliorer | Structure div/span sans sémantique tabulaire | `<table>` avec `<th scope="col">` |

---

## Points conformes

- `aria-hidden="true"` sur les émojis décoratifs (nav desktop, carte, profil)
- `role="menu"` + `role="menuitem"` sur le dropdown utilisateur
- `role="separator"` sur le séparateur du dropdown
- `aria-label="Ouvrir le menu"` sur le bouton hamburger
- `role="status"` + `aria-label` sur `SpinnerComponent`
- Attribut `alt` requis et renseigné sur tous les avatars
- `aria-hidden="true"` sur la section visuelle décorative du hero
- `aria-label` sur l'affichage du solde MazCoins (profil)
- `aria-label="Navigation principale"` et `"Actions rapides"` sur les `<nav>`
- Hiérarchie des titres `h1` → `h2` → `h3` respectée sur toutes les pages

---

## Outils utilisés

**Lighthouse (pages publiques)** : les pages ne nécessitant pas d'authentification ont été auditées via Lighthouse dans les DevTools. Score obtenu : ≥ 90 % sur `/` et `/commands`.

Les routes protégées ne sont pas auditables par Lighthouse : le token JWT étant stocké en mémoire (choix fait en SU #151 pour des raisons de sécurité), tout nouveau contexte navigateur ouvert par Lighthouse est redirigé vers la home sans token.

**axe-core (pages protégées)** : `axe-core` est intégré directement dans `main.ts` en mode développement. À chaque navigation Angular, les violations sont loggées dans la console avec leur sévérité et le fragment HTML concerné. Cette approche contourne la contrainte JWT puisque l'analyse s'exécute dans le contexte navigateur existant, avec la session active.

```ts
// main.ts — dev uniquement
if (!environment.production) {
  const { default: axe } = await import('axe-core');
  router.events.pipe(filter(e => e instanceof NavigationEnd)).subscribe(runAxe);
}
```

**Navigation clavier manuelle** — à réaliser sur chaque page après implémentation des SUs #189/#190/#191 : Tab, Shift+Tab, Entrée, Espace, touches directionnelles.