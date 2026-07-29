# Lot 1 — Socle de thème

**Date :** 29 juillet 2026
**Statut :** validé, prêt pour le plan d'implémentation
**Périmètre :** premier des sept lots de la refonte « Modern Productivity / Adaptive Glass UI »

---

## 1. Pourquoi ce lot existe

Le système de design maison *Abysse dichroïque* est rejeté en bloc : couleurs,
composants, boutons, animations — rien n'est conservé. Le remplacement est cadré
par un brief écrit qui couvre sept chantiers indépendants. Ce document ne traite
que le premier : **le socle de thème**, prérequis de tous les autres.

L'état de départ, mesuré et non supposé :

- `src/app/globals.css` fait 880 lignes, mono-thème sombre, avec `color-scheme: dark`
  écrit en dur et une quarantaine de valeurs `rgba()` littérales qui encodent
  toutes une hypothèse de fond sombre.
- Les couleurs sont consommées par variables CSS : **101 références** `var(--color-…)`
  dans le TSX, réparties sur 8 noms, sans aucun utilitaire Tailwind de couleur.
- Il n'existe **aucun** mécanisme de thème.
- `layout.tsx` est déjà en rendu dynamique (il lit `headers()` pour le nonce de CSP).

## 2. Direction visuelle retenue

Arbitrée sur maquettes comparées, pas sur description.

- **Cartes** — surface `--surface-1`, bordure 1 px `--border`, rayon 12,
  et une **barre de 3 px à gauche portant la priorité** (urgente / haute /
  moyenne / basse). La barre encode une donnée réelle ; ce n'est pas un ornement.
- **En-tête de colonne** — le nom en Space Grotesk, puis un **filet horizontal
  sous toute la largeur de la colonne**. Pas de filet inline partant vers la droite.
- **Compteur** — chiffre nu, tabulaire, aligné à droite sur la ligne du nom,
  en `--text-3`. Pas de pastille, pas de fond.
- **Registre général** — sobre. Le verre n'est pas la valeur par défaut ; il
  n'apparaît que lorsqu'un fond riche est actif (lot 2). L'accent est rare.

Cette direction est le **vocabulaire** du lot 1 : elle fixe les rôles, les rayons,
les poids typographiques et les motifs structurels que le reste consommera. Son
application au tableau Kanban — barre de priorité sur les cartes réelles,
en-tête à filet sur les vraies colonnes — relève du **lot 5**. À la fin du lot 1,
les pages existantes sont migrées sur ces tokens mais gardent leur mise en page.

## 3. Architecture des tokens

Trois couches. Un composant ne lit **jamais** la couche 1.

### Couche 1 — primitives

Les hex bruts, dans `@theme` (Tailwind v4). Statiques, jamais redéfinies.

### Couche 2 — rôles

La seule couche que les composants consomment, et la seule que le thème
redéfinit. Elle vit en CSS custom properties classiques, **hors de `@theme`** :
les variables d'un bloc `@theme` sont résolues statiquement au niveau `:root` et
leur redéfinition sous un sélecteur d'attribut ne se propage pas fiablement aux
utilitaires générés.

Aucun utilitaire Tailwind de couleur n'étant utilisé dans le projet, ce choix ne
coûte rien.

### Couche 3 — composants

Uniquement lorsqu'un composant a un besoin propre. Dérivée de la couche 2,
jamais de la couche 1.

## 4. Palettes

| Rôle | Clair | Sombre |
|---|---|---|
| `--bg-canvas` | `#F8FAFC` | `#0B0F19` |
| `--surface-1` | `#FFFFFF` | `#111827` |
| `--surface-2` | `#F1F5F9` | `#161D2C` |
| `--text-1` | `#0F172A` | `#F8FAFC` |
| `--text-2` | `#64748B` | `#94A3B8` |
| `--text-3` | `#94A3B8` | `#64748B` |
| `--border` | `rgb(15 23 42 / .08)` | `rgb(255 255 255 / .06)` |

Le brief définit deux niveaux de texte. Il en faut trois : les métadonnées de
carte (dates, compteurs) ne peuvent pas peser autant que le texte secondaire
d'un paragraphe, sinon la carte s'aplatit.

### Accents, et la contrainte de contraste

`#00CFE8` sur `#FFFFFF` donne environ **1,9:1**. `#8B5CF6` sur `#FFFFFF` plafonne
vers **3,6:1**. Le seuil pour du texte est 4,5:1. Or le brief demande l'accent
sur les liens.

Chaque accent porte donc **deux valeurs**, séparées par usage :

| Rôle | Clair | Sombre | Usage |
|---|---|---|---|
| `--accent` | `#00CFE8` | `#00CFE8` | aplats, remplissages, barres de progression, états actifs |
| `--accent-text` | `#0891A5` | `#00CFE8` | liens, texte accentué |
| `--accent-2` | `#8B5CF6` | `#8B5CF6` | second accent, aplats |
| `--accent-2-text` | `#7C3AED` | `#A78BFA` | texte |

En thème sombre `#00CFE8` sur `#0B0F19` passe largement : le dédoublement ne sert
qu'au thème clair, mais les deux noms existent dans les deux thèmes pour que les
composants n'aient jamais à savoir dans quel thème ils sont.

### Couleurs de statut

`--danger`, `--warning`, `--success`, `--info`, chacune avec sa variante `-text`
soumise à la même règle de contraste.

## 5. Typographie

- **Inter** — corps, formulaires, étiquettes, navigation. Le défaut.
- **Space Grotesk** — trois usages et rien d'autre : titres de page, noms de
  colonne, chiffres. Cette restriction est ce qui l'empêche de devenir décorative.
- **JetBrains Mono est supprimée.** Space Grotesk couvre les chiffres tabulaires ;
  une troisième famille n'a plus d'emploi.

Échelle : 11 · 12,5 · 13 · 15 · 18 · 22 · 30 · 44.
Les chiffres utilisent `font-variant-numeric: tabular-nums` partout où ils
peuvent changer sans que la mise en page bouge.

## 6. Espacements, rayons, ombres

- **Espacements** — base 4 : `4 · 8 · 12 · 16 · 20 · 24 · 32 · 40`.
  16 à 24 à l'intérieur d'un composant, 24 à 40 entre sections.
- **Rayons** — `--r-1: 8px` (champs, boutons) · `--r-2: 12px` (cartes) ·
  `--r-3: 16px` (colonnes, panneaux) · `--r-4: 24px` (modales) · `--r-full: 999px`.
- **Ombres** — deux niveaux, tokenisés par thème. La couleur d'ombre est une
  variable : en clair elle dérive de `#0F172A` à très faible opacité, jamais du
  noir pur, qui produit une tache grise sur `#F8FAFC`.

## 7. Le porteur de thème

### Rendu

`layout.tsx` est déjà dynamique (nonce de CSP). Le thème est donc lu **côté
serveur** depuis un cookie et rendu directement dans le HTML :
`<html data-theme="dark">`.

Conséquence : **aucun script inline anti-flash**. C'est décisif, parce que la CSP
(`src/proxy.ts`) n'autorise pas `unsafe-inline` sur `script-src` — un script
d'usage aurait exigé le nonce, donc de la plomberie supplémentaire. Ici, zéro
script et zéro flash.

### Premier passage, sans cookie

Le serveur ne peut pas connaître le réglage système. Aucun attribut `data-theme`
n'est alors posé, et les rôles sont résolus en CSS pur :

```css
:root                                  { /* rôles clairs */ }
@media (prefers-color-scheme: dark) {
  :root                                { /* rôles sombres */ }
}
:root[data-theme='light']              { /* rôles clairs  — choix explicite */ }
:root[data-theme='dark']               { /* rôles sombres — choix explicite */ }
```

**Piège de spécificité :** `:root` et `[data-theme]` pèsent tous deux `0,1,0`.
Écrits ainsi, le dernier déclaré gagnerait — l'ordre deviendrait porteur de sens,
donc fragile. Les sélecteurs de choix explicite s'écrivent `:root[data-theme='…']`
(`0,2,0`) pour l'emporter quel que soit l'ordre.

### Mémoire du choix

- **Cookie** `tf_theme` — source de vérité du rendu serveur. Non sensible, donc
  lisible par le client ; `SameSite=Lax`, durée longue.
- **Compte** — nouvelle colonne `themePreference` sur `model User`
  (`String?`, valeurs `light` / `dark` / `null` = suivre le système), avec sa
  migration Prisma et une mutation GraphQL.

À la connexion, la préférence du compte est écrite dans le cookie : le thème suit
la personne d'un appareil à l'autre. Le cookie reste ce qui pilote le rendu, pour
qu'aucun aller-retour base ne se glisse dans le chemin critique.

### À ne pas oublier

- `color-scheme` suit le thème, sinon les menus natifs de `<select>` et les
  barres de défilement restent sombres en thème clair.
- `<meta name="theme-color">` suit le thème. Il est aujourd'hui figé à `#04070e`
  dans `layout.tsx`.

## 8. Ce qui est supprimé

- Les 880 lignes d'`globals.css` dans leur intégralité.
- La pile de verre à quatre couches (`.g-refract` / `.g-tint` / `.g-rim` / `.g-body`).
- L'arête dichroïque, la distorsion SVG, le spéculaire au curseur, l'arête
  balayante des boutons (`tf-sweep`), l'entrée floue (`tf-focus-in`), la cascade
  `tf-cascade`, le masque `tf-mask`.
- Les composants `Ground`, `GlassFilters`, le hook `useSpecular`.
- Les polices Bricolage Grotesque, Instrument Sans, JetBrains Mono.

## 9. Composants réécrits

`Surface`, `Button`, `Field`, `Select`, `Pill`, `Avatar`, `Alert`, `Modal`,
`Icon`, `AppShell`, `AuthShell`, `AuthAside`.

Réécrits, pas adaptés : ils ne portent plus de pile de verre mais des surfaces
simples, tokenisées, correctes dans les deux thèmes. Leur API publique est
repensée pour ne plus exposer de notion de matière (`raised`, `panel`, `distort`,
`specular` disparaissent).

Le répertoire `src/components/glass/` devient `src/components/ui/` — le nom actuel
décrit une matière qui n'est plus la valeur par défaut.

## 10. Migration des pages

Les 11 pages et leurs composants locaux : 101 références `var(--color-…)` et
toutes les classes `tf-*`.

**Leur mise en page ne change pas.** L'objectif est qu'aucune page ne soit cassée
ni illisible dans l'un ou l'autre thème à la fin du lot. Les refontes de mise en
page appartiennent aux lots 4, 5 et 7.

## 11. `/lab`

Reconstruit en atelier du nouveau système : rôles de couleur, échelle
typographique, rayons, ombres, et chaque composant dans ses états — repos,
survol, focus, désactivé, erreur — avec une bascule clair / sombre.

C'est l'écran de contrôle des lots suivants.

## 12. Accessibilité

- Tout couple texte/fond atteint 4,5:1, les composants d'interface 3:1. Vérifié
  sur les deux thèmes, pas seulement sur le sombre.
- Focus visible sur toutes les cibles, dans les deux thèmes.
- `prefers-reduced-motion` respecté — le socle motion complet arrive au lot 3,
  mais la règle est posée ici.

## 13. Hors périmètre

Surfaces adaptatives et moteur de fonds (lot 2) · GSAP et micro-interactions
(lot 3) · header et sidebar (lot 4) · Kanban et modale de détail (lot 5) ·
Three.js et mesh gradient (lot 6) · vue mobile et bottom sheet (lot 7).

## 14. Critères d'acceptation

1. Toute page se rend correctement en clair et en sombre, sans texte illisible
   ni surface invisible.
2. Le thème initial suit le réglage système, sans flash au chargement.
3. Le choix explicite persiste après rechargement, et suit le compte d'un
   navigateur à l'autre après connexion.
4. Aucune occurrence résiduelle des anciens tokens ni des classes `tf-*`
   supprimées.
5. `npm run lint` et `npm test` passent.
6. Aucun couple texte/fond sous 4,5:1 dans `/lab`, dans les deux thèmes.

---

## Annexe — Carte de traçabilité du brief

Chaque élément du brief et le lot qui le porte. Rien n'est abandonné ; ce qui
n'est pas dans le lot 1 a une adresse.

### Lot 1 — Socle de thème *(ce document)*
Thème clair · thème sombre · couleurs d'accent et leur retenue · Inter et
Space Grotesk · densité et espacements 4-8 · surfaces et profondeur · coins
arrondis · principe d'évolution visuelle (l'app doit être qualitative sans aucun
fond personnalisé).

### Lot 2 — Surfaces adaptatives et moteur de fonds
Fonds interchangeables : image, gradient, vidéo, animé · surfaces plus
translucides quand un fond est actif · backdrop blur renforcé · overlay de
contraste ajouté automatiquement · glassmorphism progressif, renforcé pour
modales, menus, sidebars · panneau de personnalisation dans les paramètres ·
chargement asynchrone des fonds, jamais bloquant · repli statique sous
`prefers-reduced-motion`.

### Lot 3 — Socle motion et micro-interactions
Installation de GSAP (SplitText, Flip, ScrollTrigger, Observer) · arbitrage
framer-motion · `prefers-reduced-motion` · règles de performance CSS (transform
et opacity, pas de width/height animés, `will-change` parcimonieux) · budget de
feedback sous 100 ms · toasts avec spring `elastic.out(1, 0.5)` et barre de
progression · skeletons à shimmer diagonal · overlay à cercle SVG
`stroke-dashoffset` · toggle à rebond · checkbox au tracé `stroke-dashoffset` ·
ripple de bouton au point du clic · focus d'input avec bordure accentuée et label
flottant · boutons magnétiques (`quickTo`).

### Lot 4 — Chrome : header, sidebar, onglets
Header fixe en glassmorphism, blur 20 px, lisible sur tous les fonds · recherche
qui s'étend de 200 à 400 px, dropdown en cascade 0,03 s · avatar à ring de statut
et pulse en ligne · menu profil en unfold 3D (`rotationX -15deg → 0`) · sidebar
72 / 256 px avec morphing GSAP · items actifs en gradient cyan→violet à 10 % avec
barre latérale glissante de 3 px · accordéon Workspaces au `clip-path` ·
onglets à slider animé (x et width) · validation de formulaire en temps réel,
bordure verte au succès, rouge avec shake à l'erreur.

### Lot 5 — Tableaux, cartes, modale de détail
Cascade des boards, stagger 0,1 s, flip 3D `rotationX 90 → 0` · tilt 3D au survol,
perspective 1000 px, glow pulsé · drag avec lévitation, lerp 0,15, échelle 1,05,
ombre portée · réarrangement par GSAP Flip · ripple circulaire au drop et
micro-vibration de 2 px · scroll horizontal à inertie (Observer ou Lenis) ·
parallaxe légère des titres de colonne · nouvelle carte en morph depuis le
bouton « + » (`scale 0 → 1`, `blur 10 → 0`) · carte au survol : `translateY(-4px)`,
halo sur le bord gauche `0 → 3px`, labels flottants en stagger · compteur de
colonne animé (`scale 0 → 1.2 → 1`) — **sur le chiffre nu, la pastille ayant été
écartée** · bouton « ajouter une carte » qui se transforme en input · cover 16:9,
labels en pills à 20 %, avatars empilés à `-8px` qui s'écartent au survol,
échéance en rouge si dépassée, indicateur de priorité pulsé sur les urgences ·
ouverture de carte en shared element (`Flip.fromTo`), fond flouté `0 → 20px` ·
modale 66/34, colonne droite sticky · éditeur de description léger · checklist à
barre de progression en `scaleX` changeant de couleur · commentaires en threads,
cascade 0,05 s · images en blur-up.

### Lot 6 — Fonds signature
Hero : ~2 000 particules Three.js réagissant à la souris, effet constellation,
gradient cyan→violet · titre décomposé lettre par lettre (SplitText, stagger
0,02 s, fade, `y 30 → 0`, légère rotation) · mesh gradient animé du dashboard,
formes organiques lentes en cyan, violet, bleu nuit · canvas séparé hors du flux
DOM · plafond à 30 FPS · pause quand l'onglet est inactif · densité adaptée à
l'appareil · **grille spatiale obligatoire** : les liens de constellation ne
peuvent pas être calculés en O(n²) sur 2 000 points, ils sont limités au
voisinage du curseur.

### Lot 7 — Responsive
Desktop > 1024 px : Kanban complet, sidebar dépliée · tablette 768-1024 px :
sidebar compacte, scroll horizontal avec snap, fonds simplifiés · mobile
< 768 px : vue en liste empilée, navigation en bottom sheet, pas de Three.js,
gradient CSS ou image statique à la place.

### Règles transverses
Le mouvement sert la clarté, jamais la décoration · chaque animation guide l'œil,
explique un changement d'état ou confirme une action · premier feedback visuel
sous 100 ms · les fonds enrichissent sans concurrencer le contenu · cohérence
d'ensemble, aucun mélange de styles.
