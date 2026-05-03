# Projet Quran App

## Vue d'ensemble

Monorepo pnpm + Turborepo pour une application Quran multiplateforme (web + mobile), entièrement en TypeScript. Projet gratuit et open-source conçu comme une **sadaqah jariyah** : aucune publicité, aucun abonnement, aucune collecte de données utilisateur.

## Contexte métier

### Mission

Offrir à tous les musulmans du monde un accès libre, gratuit et à vie au Coran et à la Sunna prophétique, accompagné d'outils modernes (recherche intelligente, assistant IA, mémorisation) pour aider à l'étude, la réflexion et la pratique religieuse.

Le projet accueille également les non-musulmans curieux qui souhaitent découvrir le Coran avec des traductions fiables et des outils d'exploration respectueux du texte.

Ce projet est conçu comme une sadaqah jariyah : une œuvre destinée à profiter à l'oumma, dans laquelle rien n'est vendu, rien n'est monétisé, et aucune donnée utilisateur n'est exploitée.

### Public cible

- Public principal : musulmans de tous niveaux et tous âges
- Débutants ayant besoin d'interfaces simples et guidées
- Étudiants et pratiquants souhaitant approfondir leur connaissance
- Chercheurs ayant besoin d'outils de recherche avancés
- Non-musulmans curieux de découvrir le Coran (accueil bienveillant, glossaire accessible, explications adaptées)
- Utilisateurs en régions avec connexion internet limitée (mode offline prévu dès la conception)

### Principes fondateurs (non négociables)

1. **Gratuité totale à vie** : aucun abonnement, aucun achat in-app, aucun paywall, aucune feature premium cachée.
2. **Aucune publicité** : ni bannière, ni tracker publicitaire, ni sponsor commercial apparent dans l'app.
3. **Respect absolu de la vie privée** : pas de collecte superflue, pas de revente de données, pas de profilage, pas d'analytics intrusifs. Les données personnelles (favoris, progression) restent sous le contrôle de l'utilisateur.
4. **Intégrité du contenu religieux** : texte coranique inviolable, hadiths attribués à leurs sources authentifiées, tafsirs toujours liés à leurs auteurs. Aucune interprétation personnelle injectée dans le contenu.
5. **Prudence théologique** : l'assistant IA n'émet jamais de fatwa, ne prend jamais position sur les questions théologiquement contestées, et redirige systématiquement vers des savants qualifiés.
6. **Open-source assumé** : code source ouvert sous AGPL-3.0, contributions publiques bienvenues, transparence totale sur le fonctionnement interne de l'application.
7. **Accessibilité en connexion limitée** : l'application doit rester fluide et utilisable même sur connexions lentes ou instables. Cela impose : optimisation agressive des ressources, lazy-loading, mode offline pour les fonctionnalités centrales (lecture, récitations téléchargées, favoris), bundle JavaScript minimal.

## Langues et internationalisation (i18n)

### Langues supportées

L'application est **trilingue** dès sa conception :

| Langue | Code | Direction | Rôle |
|---|---|---|---|
| Arabe | `ar` | RTL | Langue du contenu source (Coran, hadiths, duas) |
| Français | `fr` | LTR | Langue principale de l'interface (public francophone) |
| Anglais | `en` | LTR | Langue d'ouverture internationale |

**Règle absolue** : le contenu coranique et les hadiths en arabe sont affichés **exclusivement en arabe**, jamais traduits ni translittérés en lieu et place de l'original. Les traductions sont toujours présentées **à côté** du texte arabe, jamais en remplacement.

### Stratégie technique

- Bibliothèque i18n : **next-intl** (standard pour Next.js App Router)
- Détection automatique : à la première visite, détection de la langue du navigateur
- **Langue par défaut** : **arabe** si aucune correspondance détectée (le public principal du projet est arabophone)
- Changement de langue : possible à tout moment depuis l'interface, préférence stockée localement (sans compte requis)

### URLs localisées

Structure : `/{locale}/...`

Exemples :
- `/ar/surahs/al-fatiha` → Al-Fatiha (contenu arabe, interface arabe)
- `/fr/sourates/al-fatiha` → Al-Fatiha (contenu arabe + traduction française)
- `/en/surahs/al-fatiha` → Al-Fatiha (contenu arabe + traduction anglaise)

**Décision** : les slugs d'URL restent en caractères **latins translittérés** pour toutes les locales, y compris arabe, pour :
- Meilleur SEO (indexation Google)
- URLs partageables (copier-coller ne casse pas l'encodage)
- Compatibilité universelle (emails, SMS, réseaux sociaux)
- Débogage plus facile

Seul le **contenu affiché** diffère selon la locale, jamais la structure de l'URL.

### Gestion RTL / LTR

- Attribut `dir="rtl"` appliqué dynamiquement au `<html>` quand la locale est arabe
- Tailwind CSS : utiliser les classes logiques (`ms-*`, `me-*`, `ps-*`, `pe-*`, `start-*`, `end-*`) plutôt que les classes directionnelles fixes (`ml-*`, `mr-*`, `pl-*`, `pr-*`, `left-*`, `right-*`) pour que le layout s'inverse automatiquement en RTL
- Le texte coranique et les hadiths en arabe restent **toujours** en RTL, indépendamment de la locale de l'interface

### Polices typographiques

**Pour le texte coranique (priorité absolue) :**
- **Priorité 1 : KFGQPC Uthmanic Hafs V20** (fichier upstream `uthmanic_hafs_v20.ttf` depuis `nuqayah/qpc-fonts @ mushaf-v4-hafs/`, converti en WOFF2 localement via `ttf2woff2` — repackage sfnt lossless, aucune modification de glyphe). Rendu authentique du Mushaf de Médine, avec support des caractères Quranic Unicode 9.0+ (open tanwin U+08F0-F2, marqueurs waqf, iqlab, etc.).
- Priorité 2 : **Amiri Quran** (licence SIL Open Font — alternative entièrement libre si jamais des questions de licence se posent sur KFGQPC en distribution open-source)
- Fallback : **Scheherazade New**

**Historique de décision** : la version initialement intégrée (UthmanicHafs Ver09, ~2014) pré-datait l'ajout Unicode 9.0 des open-tanwin en 2016, d'où des gaps visibles sur les mots avec U+08F0 + alef silencieux. Upgrade vers V20 appliqué le 2026-04-18. `UthmanicHafs1-Ver09.woff2` et `UthmanTN1-Ver10.woff2` sont conservés sur disque pour rollback 1-ligne dans `apps/web/app/fonts/quran-font.ts`. Voir `apps/web/public/fonts/quran/README.md` pour le détail.

**Note juridique** : la licence de distribution de KFGQPC Uthmanic Hafs dans un projet open-source n'est pas parfaitement claire. Usage pragmatique pour l'instant, mais Amiri Quran reste un plan B 100% licite prêt à être substitué si besoin. À revoir si une clarification juridique est obtenue.

**Point ouvert** : quelques open-tanwin (particulièrement U+08F1/F2 en position word-final) présentent encore des résidus visuels subtils avec V20. Option d'amélioration future : charger Amiri Quran en parallèle en fallback effectif pour les caractères non couverts (option "B3" non encore implémentée).

**Pour l'arabe d'interface (menus, hadiths hors Coran) :**
- **Noto Naskh Arabic** (équilibre lisibilité + rendu propre)
- Fallback système

**Pour le latin (français, anglais) :**
- **Inter** ou **System UI** (lisibilité écran optimale)

### Fichiers de traduction

Tous les textes d'interface sont stockés dans :

```
packages/i18n/locales/
  ar/
    common.json       # textes réutilisables (boutons, menus)
    home.json         # page d'accueil
    quran.json        # navigation Coran
    hadith.json       # navigation Hadiths
    errors.json       # messages d'erreur
  fr/
    [mêmes fichiers]
  en/
    [mêmes fichiers]
```

**Règle absolue** : aucun texte d'interface en dur dans le code. Tout passe par les fichiers i18n, même les messages courts ("Accueil", "OK", "Annuler").

## Structure du monorepo

```
quran-app/
├── apps/
│   ├── web/          # Next.js 16 — app web (package: @quran/web)
│   └── mobile/       # React Native + Expo — app mobile (à venir)
├── packages/
│   ├── core/         # @quran/core — logique, types, clients API
│   ├── data/         # @quran/data — données JSON (Coran, Hadith)
│   ├── i18n/         # @quran/i18n — traductions ar/fr/en
│   └── config/       # @quran/config — tsconfig + eslint partagés
├── package.json      # orchestrateur (private, Node >=22)
├── pnpm-workspace.yaml
├── turbo.json
└── CLAUDE.md
```

## Stack technique

- Package manager : pnpm 10.33.0 (fixé via `packageManager`)
- Task runner : Turborepo 2.x
- Node.js : >=22 (engine déclaré)
- TypeScript : strict + `noUncheckedIndexedAccess`
- ESLint : flat config (`eslint.config.mjs`)
- Framework web : Next.js 16 (App Router, Turbopack)
- Styling web : Tailwind CSS 4
- Mobile : React Native + Expo (pas encore scaffoldé)
- i18n : next-intl
- Recherche textuelle : Meilisearch (prévu)
- Recherche sémantique : Qdrant (vector DB, prévu)
- Assistant IA : Claude API (prévu, Phase 2)

## Conventions de code

### TypeScript

- **TypeScript partout**, aucun `.js` sauf fichiers de configuration (`eslint.config.mjs`, `postcss.config.mjs`, `next.config.ts`)
- **Mode strict activé** (`strict: true` + `noUncheckedIndexedAccess: true`)
- Jamais de `any` sans commentaire justificatif (`// any justified here because...`)
- Préférer les types `interface` pour les objets publics, `type` pour les unions, intersections, génériques

### React / Next.js

- **Server components par défaut** dans Next.js App Router
- Client components uniquement si nécessaire (interactivité, hooks navigateur, localStorage) — ajouter `"use client"` en tête
- Éviter les `useEffect` inutiles (préférer les server components)
- Préférer les composants courts et ciblés plutôt que les monolithes
- Props toujours typées, jamais de `any`

### Nommage des fichiers et symboles

- Composants React : **PascalCase** (`QuranReader.tsx`, `SurahCard.tsx`)
- Hooks : camelCase préfixé par `use` (`useBookmarks.ts`, `useAudio.ts`)
- Utilitaires, helpers : **camelCase** (`formatVerse.ts`, `getSurah.ts`)
- Types partagés : **PascalCase** (`Verse`, `Surah`, `Hadith`)
- Constantes : **SCREAMING_SNAKE_CASE** (`MAX_VERSES_PER_PAGE`)
- Variables, fonctions : **camelCase** (`verseNumber`, `fetchSurah`)
- Fichiers de config : kebab-case (`next.config.ts`, `eslint.config.mjs`)

### Imports

- Toujours utiliser l'alias `@/*` pour les imports internes à `apps/web/`
- Pour les packages workspace : `@quran/core`, `@quran/data`, etc.
- Ordre des imports (géré par ESLint) :
  1. Modules Node.js natifs (`fs`, `path`)
  2. Packages externes (`react`, `next`, `zod`)
  3. Packages workspace (`@quran/core`, `@quran/data`)
  4. Imports absolus internes (`@/components/...`)
  5. Imports relatifs (`./`, `../`)

### Styling (Tailwind CSS)

- **Uniquement Tailwind**, pas de CSS modules, pas de styled-components
- Classes logiques pour RTL : `ms-4` plutôt que `ml-4`, `pe-2` plutôt que `pr-2`, etc.
- **Dark mode par défaut** (choix délibéré — confort de lecture tôt le matin ou tard le soir, moins fatigant pour les yeux pour du texte long comme le Coran)
- **Light mode disponible en option** (l'utilisateur peut basculer explicitement)
- La préférence utilisateur est stockée localement (sans compte requis)
- Design tokens centralisés dans la config Tailwind

### Commentaires dans le code

- **Langue des commentaires : anglais** (standard industrie, accueil des contributeurs internationaux)
- Expliquer le *pourquoi*, pas le *quoi* (le code explique déjà le quoi)
- JSDoc pour les fonctions exportées importantes (surtout celles touchant au contenu religieux)
- Éviter les commentaires évidents (`// increment i`)
- Pour les décisions non évidentes, préciser le contexte (`// Using toLocaleString('ar-SA') because ...`)

### Commits Git (Conventional Commits)

- **Format obligatoire** : `<type>(<scope>): <description courte>`
- **Langue des messages de commit : anglais**
- **Types autorisés** :
  - `feat` : nouvelle fonctionnalité utilisateur
  - `fix` : correction de bug
  - `docs` : documentation
  - `style` : formatage (pas de changement de logique)
  - `refactor` : refactor sans changement de comportement
  - `perf` : amélioration de performance
  - `test` : ajout ou modification de tests
  - `chore` : maintenance, config, dépendances
  - `ci` : configuration CI/CD
- **Scopes courants** : `web`, `mobile`, `core`, `data`, `i18n`, `config`, `repo`, `deps`

**Exemples de bons messages :**
- `feat(web): add Al-Fatiha display with RTL rendering`
- `fix(core): handle missing verse index safely`
- `docs: expand CLAUDE.md with business rules`
- `refactor(i18n): split translation files by feature`

### Accessibilité (a11y)

- Chaque élément interactif a un `aria-label` traduit selon la locale active (ar, fr, en)
- Navigation complète possible au clavier
- Contraste de couleurs respectant WCAG AA minimum (en mode dark comme en mode light)
- Support des lecteurs d'écran pour le texte coranique (`lang="ar"` correctement déclaré sur chaque élément arabe)
- Focus states visibles (jamais `outline: none` sans alternative)
- Tester systématiquement en RTL/LTR et en dark/light mode

## Règles de placement du code (package boundaries)

| Type de code | Package |
|---|---|
| Composants UI spécifiques au web | `apps/web/components/` |
| Composants UI spécifiques au mobile | `apps/mobile/components/` |
| Types TypeScript partagés (Verse, Surah, Hadith) | `packages/core/src/types/` |
| Fonctions pures partagées (formatage, validation) | `packages/core/src/lib/` |
| Client API du backend | `packages/core/src/api/` |
| Fichiers JSON (Coran, Hadith, métadonnées) | `packages/data/` |
| Fichiers de traduction (ar.json, fr.json, en.json) | `packages/i18n/locales/` |
| Config TS/ESLint partagée | `packages/config/` |

**Règle d'or** : si un bout de code pourrait servir AUTANT côté web QUE mobile, il appartient à `packages/core`. Si un bout de code est spécifique à UNE plateforme, il reste dans l'app correspondante.

## Structure des données religieuses

### Types TypeScript pour le Coran

Situés dans `packages/core/src/types/`.

**Surah (Sourate)**

```ts
interface Surah {
  number: number;              // 1 à 114
  slug: string;                // "al-fatiha"
  nameArabic: string;          // "الفاتحة"
  nameTransliterated: string;  // "Al-Fatiha"
  nameTranslations: {
    fr: string;                // "L'Ouverture"
    en: string;                // "The Opening"
  };
  revelationType: "meccan" | "medinan";
  verseCount: number;
  position: {
    juz: number[];
    hizb: number[];
    page: number[];
  };
}
```

**Verse (Verset / Ayah) — multi-Qira'at dès la conception**

```ts
type QiraatId = "hafs" | "warsh" | "qalun" | "duri";

interface Verse {
  id: string;                  // "1:1"
  surahNumber: number;
  verseNumber: number;
  textArabic: Record<QiraatId, string>;
  textArabicSimple: string;    // pour recherche (sans signes de tajwid)
  translations: Record<string, VerseTranslation>;
  audio: {
    [reciterId: string]: {
      url: string;
      qiraatId: QiraatId;
    };
  };
  meta: {
    juz: number;
    hizb: number;
    page: number;
    ruku: number;
    sajda: boolean;
  };
}

interface VerseTranslation {
  language: "fr" | "en" | "ar";
  translator: string;
  text: string;
  footnotes?: string[];
}
```

**Word (Mot) — analyse mot-à-mot + morphologie**

```ts
interface Word {
  id: string;                  // "1:1:1"
  position: number;
  textArabic: string;
  textArabicByQiraat?: Record<QiraatId, string>;
  transliteration: string;
  translations: {
    fr: string;
    en: string;
  };
  morphology: {
    root: string;              // racine trilitère (ex: "ر-ح-م")
    partOfSpeech: string;
    lemma: string;
    features: string[];
  };
}
```

### Types TypeScript pour les Hadiths

**HadithCollection (Recueil)**

```ts
interface HadithCollection {
  id: string;                  // "bukhari", "muslim"
  nameArabic: string;
  nameTransliterated: string;
  author: {
    nameArabic: string;
    nameTransliterated: string;
    deathYearHijri: number;
  };
  bookCount: number;
  hadithCount: number;
}

interface HadithBook {
  id: string;                  // "bukhari-1"
  collectionId: string;
  number: number;
  nameArabic: string;
  nameTranslations: { fr: string; en: string };
}
```

**Hadith — structure simplifiée v1, enrichissement v2 prévu**

```ts
interface Hadith {
  id: string;                  // "bukhari-1-1"
  collectionId: string;
  bookId: string;
  number: number;
  globalNumber: number;
  textArabic: string;

  // V1 : informations essentielles
  narrator: string;
  authentication: {
    grade: "sahih" | "hasan" | "daif" | "mawdu" | "unknown";
    scholar?: string;
    notes?: string;
  };

  // V2 prévu : chaîne complète
  isnad?: string[];

  translations: Record<string, HadithTranslation>;
  topics: string[];
  references: {
    relatedHadiths: string[];
    quranVerses: string[];
  };
}

interface HadithTranslation {
  language: "fr" | "en";
  translator: string;
  text: string;
  explanation?: string;
}
```

### Stratégie d'implémentation par phases

**Phase 1 — MVP Coran (priorité immédiate)**
- Texte Hafs complet (source : Tanzil)
- 1 traduction française (Hamidullah)
- 2 traductions anglaises (Sahih International + Pickthall)
- Métadonnées complètes des 114 sourates
- Audio 1 récitateur (via CDN)
- Analyse mot-à-mot + morphologie (source : Quranic Arabic Corpus)

**Phase 2 — Enrichissement Coran**
- Texte Warsh complet
- 2-3 récitateurs supplémentaires
- Tafsir (Ibn Kathir, Saadi, Jalalayn)
- Traductions supplémentaires (Maududi, etc.)

**Phase 3 — Hadiths (base)**
- Sahih Bukhari et Sahih Muslim (textes arabes + grades)
- 1 traduction française par recueil
- Narrateur principal (sans isnad complet)
- Topics thématiques de base

**Phase 4 — Hadiths (extension)**
- 4 autres livres (Tirmidhi, Abu Dawud, Nasa'i, Ibn Majah)

**Phase 5 — Versions enrichies**
- Isnad complets des hadiths
- Qira'at supplémentaires (Qalun, Duri, etc.)
- Tafsir complets (Tabari, Qurtubi)

### Organisation des fichiers de données

```
packages/data/
├── quran/
│   ├── metadata/
│   │   ├── surahs.json
│   │   └── juzs.json
│   ├── text/
│   │   ├── hafs.json
│   │   ├── warsh.json        # Phase 2
│   │   └── simple.json
│   ├── translations/
│   │   ├── fr-hamidullah.json
│   │   ├── en-sahih-international.json
│   │   └── ...
│   ├── tafsir/
│   │   └── ...               # Phase 2+
│   ├── words/
│   │   └── morphology.json   # Quranic Arabic Corpus
│   └── indexes/
│       └── by-root.json      # index inversé racines
│
├── hadith/
│   ├── collections/
│   ├── texts/
│   ├── translations/
│   └── references/
│
└── common/
    ├── reciters.json
    ├── translators.json
    └── scholars.json
```

### Principes de stockage

1. **Fichiers JSON indépendants** par type de données (chargement sélectif)
2. **Indexation par ID stable** : `1:1`, `bukhari-1-1`, jamais modifiés
3. **Pas de duplication** : une traduction référencée depuis les versets
4. **Compression transport** : JSON gzippés en réseau (ratio ~1:5)
5. **Lazy loading** : chargement à la demande selon l'écran
6. **Audio via CDN** : jamais dans `packages/data/`, stockage Cloudflare R2

## Règles d'intégrité du contenu religieux

Ces règles sont **absolues et non négociables**.

### Règle 1 — Texte coranique inviolable

Le texte coranique ne doit **JAMAIS** :
- Être modifié, corrigé ou "amélioré"
- Être paraphrasé ou reformulé
- Être généré par l'IA ou complété automatiquement
- Être fragmenté au point de perdre le sens

Si une erreur est détectée :
1. Ne pas corriger manuellement
2. Vérifier avec la source originale
3. Si confirmée dans la source : remonter, ne pas modifier localement
4. Si propre à notre copie : resynchroniser depuis la source

### Règle 2 — Sources vérifiées uniquement

**Coran (texte arabe)** :
- Tanzil (tanzil.net)
- King Saud University (kfgqpc.gov.sa)
- Quran.com API (api.quran.com)

**Traductions françaises** : Muhammad Hamidullah + autres approuvées

**Traductions anglaises** : Sahih International, Pickthall, Yusuf Ali, Maududi

**Tafsir (liste extensible)** : Ibn Kathir, As-Saadi, At-Tabari, Al-Qurtubi, Al-Jalalayn

**Hadiths** : Sunnah.com, Dorar.net, sources académiques reconnues

**Morphologie Coran** : Quranic Arabic Corpus (corpus.quran.com, Université de Leeds)

**Interdiction stricte** :
- Jamais de sources anonymes ou non-vérifiées
- Jamais de traduction ou tafsir générés par IA présentés comme "sources"
- L'IA peut commenter, pas remplacer un tafsir humain

### Règle 3 — Attribution systématique

Chaque élément religieux affiché doit être attribué :
- Traductions : nom du traducteur
- Tafsir : nom de l'exégète + source
- Hadiths : recueil + numéro + narrateur + grade + savant

**Ne jamais afficher sans attribution.**

### Règle 4 — Séparation texte original / contenu dérivé

Distinguer visuellement :
- Texte coranique (principal, typographie spéciale)
- Traductions (présentées comme telles, jamais "le Coran dit")
- Tafsir (commentaires humains, avec nom de l'auteur)
- Réponses IA (icône distincte, bannière d'avertissement)

L'utilisateur ne doit jamais confondre contenu IA et contenu savant humain.

### Règle 5 — Messages d'erreur respectueux

- Pas de formulations désinvoltes ni d'émojis
- À ÉVITER : "Oops, verse not found lol 😅"
- CORRECT : "Ce verset n'est pas disponible. Vérifiez la référence ou consultez la sourate complète."

### Règle 6 — Priorité aux bugs de contenu

Tout bug affectant le contenu religieux est **prioritaire** sur tous les autres. Correction immédiate, même en hotfix production.

### Règle 7 — Versioning et traçabilité

Chaque fichier de données porte un `_meta` avec version, source, date, vérification. Tout traitement post-import (nettoyage typographique, normalisation de whitespace, etc.) est listé dans `_meta.postProcessing` pour transparence et reproductibilité.

### Règle 8 — Conventions Unicode du rasm uthmani

Le rasm uthmani moderne (King Fahd Complex, Unicode 9.0+) utilise plusieurs code points qui coexistent avec des formes plus anciennes. Ne jamais "normaliser" sous prétexte de simplification — chaque couple a un rôle distinct.

**Dualité du sukun** :
- `U+06E1` (ARABIC SMALL HIGH DOTLESS HEAD OF KHAH, ۡ) — **sukun phonétique** sur une consonne effectivement prononcée sans voyelle.
- `U+0652` (ARABIC SUKUN, ْ) — marqueur **orthographique** sur une lettre silencieuse (الف الوقاية / alef al-wiqâyah) : l'alef final muet de `كَفَرُوا`, `آمَنُوا`, `كَانُوا`, `فَعَلُوا` ou le و silencieux de `أُولَٰٓئِك`.

Les deux coexistent dans la même sourate. Al-Fatiha n'a aucun perfectif pluriel masculin, donc 0 × U+0652. Al-Baqara a ~396 × U+0652 (365 sur alef, 31 sur و) + ~2882 × U+06E1. Distribution canonique.

**Open tanwin** :
- `U+08F0/F1/F2` (OPEN FATHATAN / DAMMATAN / KASRATAN) — formes modernes où le tanwin est positionné au-dessus d'un espace dans la calligraphie papier. En imprimerie, la source peut insérer un `U+0020` entre le caractère tanwin et la lettre suivante (artefact typographique).
- Les tanwin classiques `U+064B/C/D` restent valides mais ne portent pas la même information de rendu.

**Pattern alef al-wiqâyah en encodage "open"** : `consonne + U+08F0 + U+0020 + ا|ى` où le ا|ى est silencieux et termine le mot. Le `U+0020` est un artefact d'imprimerie à retirer pour le rendu web (voir `packages/data/scripts/clean-open-tanwin-spaces.mjs`). **Ne jamais retirer l'espace après U+08F0/F1/F2 suivi d'autre chose** (ce sont des vraies frontières de mots).

### Règle 9 — Classification exhaustive avant toute transformation bulk

Toute opération qui modifie en masse le texte coranique (regex replace, script de nettoyage, normalisation Unicode, etc.) doit d'abord produire une **table de fréquences des matchs groupée par contexte linguistique**. Un pattern "visiblement typographique" peut masquer d'autres catégories (frontières de mots, usages orthographiques distincts, etc.).

**Ordre d'opération obligatoire** :
1. Identifier le pattern cible
2. Scanner la donnée et **classifier chaque match** par contexte (lettre suivante, fin de mot vs continuation, présence de marque waqf, etc.)
3. Ne garder dans la transformation que les catégories unanimement validées
4. Documenter dans le commentaire du script les catégories **incluses** ET **exclues** avec leur justification
5. Rendre le script **idempotent** (2ᵉ exécution = no-op) pour permettre les reruns sans risque

Précédent : la première itération de nettoyage des open-tanwin (2026-04-18) a collapsé 225 frontières de mots légitimes faute de classification. Restauration nécessaire depuis la source, regex restreinte. Cette règle évite la récidive.

### Règle 10 — Caractères Bidi-mirrored à éviter dans le contenu arabe

L'algorithme **Unicode Bidirectional (Bidi)** considère certains caractères comme "mirrored" : leur apparence visuelle s'inverse selon la direction du texte. En contexte RTL (arabe), cela cause des bugs visuels invisibles côté code mais visibles à l'utilisateur arabophone.

**Caractères concernés (liste non-exhaustive)** :
- Comparaison : `<`, `>`, `≤`, `≥`
- Crochets et parenthèses non-symétriques (les rondes `()` sont auto-mirrored et OK, mais d'autres types peuvent poser problème)
- Flèches : `←`, `→`, `↑`, `↓` (avec parfois de la subtilité selon la police)

**Exemple concret rencontré dans le projet (commit 712aeeb)** :

Texte JSON original : `"sizeLong": "طويلة (> 100 آية)"` (intention : "longue, plus de 100 versets")
Rendu visuel à l'utilisateur arabophone : `< 100 آية` — sens inversé !

**Solution adoptée** : remplacer les symboles mirrored par des **mots arabes naturels** :

| Avant (cassé) | Après (correct) | Sens |
|---|---|---|
| `≤ 20 آية` | `حتى 20 آية` | jusqu'à 20 versets |
| `21-100 آية` | `21 إلى 100 آية` | de 21 à 100 versets |
| `> 100 آية` | `أكثر من 100 آية` | plus de 100 versets |

**Règle générale pour tout futur contenu arabe** :
- Pour exprimer une comparaison ou plage : utiliser **les mots arabes naturels** (حتى, إلى, أكثر من, أقل من, مساوي لـ)
- Si vraiment besoin d'un symbole : tester en RTL avant de commit
- Pour les flèches de navigation/UI, utiliser des SVG plutôt que des caractères Unicode (contrôle total du rendu)

**Test simple** pour détecter ces bugs : afficher la chaîne dans un contexte RTL réel (`<div dir="rtl">{text}</div>`) et vérifier visuellement que ce qu'on voit correspond à l'intention.

Référence : https://www.w3.org/TR/css-writing-modes-3/#bidi-mirroring

## Pièges techniques de développement

### Règle 11 — HMR Tailwind/Turbopack peut rater les ajouts de classes CSS

Pendant le développement, ajouter ou refactoriser des classes CSS dans `globals.css` (notamment des sélecteurs avec attributes `[data-X]` ou pseudo-classes) ne déclenche pas toujours la régénération du bundle CSS par Turbopack. Le navigateur sert l'ancienne version du fichier CSS, donnant l'illusion que le code ne fonctionne pas alors qu'il est correct.

**Symptômes typiques** :
- Une nouvelle règle CSS n'a aucun effet visible
- Le hard refresh navigateur ne suffit pas
- `type-check` et `lint` passent (le code est correct)

**Diagnostic** :
- Curler la page rendue, extraire l'URL du CSS depuis le `<link>`, et grep les nouvelles règles dans le bundle servi
- Si elles ne sont pas dans le CSS servi → c'est un cache HMR

**Remédiation** (par ordre de simplicité) :
1. `touch apps/web/app/globals.css` puis attendre 4-5 s pour la recompilation
2. Append un commentaire au fichier (`echo "/* rebuild */" >> apps/web/app/globals.css`)
3. Nucléaire : `rm -rf apps/web/.next && pnpm --filter @quran/web dev`

**Conséquence pratique** : après chaque ajout/refacto significatif de CSS, toujours vérifier que les règles sont bien dans le bundle servi avant de penser que le code a un bug. Précédent : trois itérations de doute infondé sur des règles `.mushaf-*` parfaitement écrites mais cachées par Turbopack.

### Règle 12 — Intégration de datasets académiques externes

Quand on consomme un dataset linguistique tiers (Quranic Arabic Corpus, futurs corpus de hadiths, Quranic Phrase Corpus, etc.), suivre ce pattern :

1. **Source raw jamais committée** : téléchargement dans un dossier cache sous `packages/data/.<source>-cache/` (gitignored). Permet la régénération sans polluer le repo. Ex : `packages/data/.qac-cache/`.
2. **Sortie dérivée committée** : seul le fichier dérivé (mappings, indexes, normalisations) est versionné, dans `packages/data/quran/search/<source>-<artifact>.json`. Format JSON avec `_meta` complet (source, license, mirror utilisé, attribution requise, generatedAt, stats).
3. **Idempotence du script d'import** : 2ᵉ exécution = no-op si la source cache existe et a la taille attendue. Sortie déterministe (clés triées) pour des diffs lisibles si la source change.
4. **Compatibilité de licence** : QAC est GPL, notre projet AGPL-3.0 (compatible — AGPL est dérivé GPL). Pour toute nouvelle source : vérifier compat avant intégration. Documenter dans le `_meta.license` ET dans le disclaimer utilisateur visible.
5. **Attribution dans l'UI** : la mention de la source académique doit apparaître au moins dans le help text du mode concerné (ex: `filters.helpRootMvp` cite "Quranic Arabic Corpus (Univ. of Leeds, Kais Dukes 2011)").

Précédent : Phase C QAC integration, 2026-05-03. Pattern formalisé pour réutilisation lors de l'ajout de hadith corpora ou Quranic Phrase Corpus en v2.

### Règle 13 — Tables d'overrides pour datasets académiques

Quand le dataset académique a un comportement légitime mais qui ne match pas la convention populaire (ex: QAC traite "محمد" comme nom propre opaque sans racine, alors que المعجم المفهرس le rattache à H-M-D), on peut ajouter une **table d'overrides ciblée** sous deux conditions strictes :

1. **Documentation per-entrée obligatoire** : chaque override JSON doit porter `{ form_buckwalter, form_arabic, root_buckwalter, root_arabic, lemma_meaning, occurrences, justification }`. La justification cite la source classique (Lisan al-Arab, Mufradat al-Raghib, etc.).
2. **Override ne overwrite jamais** : applique l'override uniquement si le dataset retourne null/absent pour cette entrée. Si le dataset a déjà un tag, c'est lui qui gagne (cohérence académique préservée).

Pour Phase C QAC : 6 overrides ciblant Muhammad, Ahmad, Yahya, Makkah, Bakkah, Quraysh — tous noms propres arabes étymologiquement transparents. Audit préalable obligatoire (Phase C-0.6) pour valider que la forme Buckwalter exacte n'est pas déjà couverte. La table reste petite (audit de 15 candidats, 6 retenus, 9 redondants éliminés).

### Règle 14 — Expansion clitic-aware pour la recherche en arabe

Le Mushaf orthographique colle systématiquement les clitics (و, ف, ب, ل, ك, ال, et le vocatif يَٰ → ى après normalisation) aux mots qu'ils précèdent. Une recherche surface-only manque donc les versets où le terme cherché apparaît sous forme clitique-attachée.

Solution adoptée Phase C-X (2026-05-03) :

1. **Champ parallèle** : `textArabicExpanded` à côté de `textArabicSimple`. Le premier contient les variantes prefix-strippées validées contre le corpus, le second reste strict.
2. **Mode `phrase` cible textArabicExpanded** : recherche tolérante aux clitics. User tape "موسى" → trouve aussi يَٰمُوسَىٰ (`ىموسى` après normalize), وَمُوسَىٰ, بِمُوسَىٰ, لِمُوسَىٰ.
3. **Mode `exact` reste sur textArabicSimple** : strict, le user qui veut le token exact bare l'obtient.
4. **Validation contre BARE_TOKENS** : un préfixe n'est strippé que si le résultat existe ailleurs dans le corpus comme bare token. Empêche les faux positifs (ex: `الموسع` ne devient pas `موسع` car `موسع` n'apparaît jamais bare). Effort O(N) (1 pass de collection + 1 pass d'expansion).
5. **Liste des préfixes longest-first** : `وال`, `بال`, `فال`, `كال`, `لل`, `ست`, `ال`, `ى` (vocatif), `و`, `ف`, `ب`, `ل`, `ك`, `س`. Single-pass sans cumul (les compounds sont déjà dans la liste).

Stats Phase C-X : index 6.60 → 7.58 MB raw / 1.74 → 1.84 MB gz (+15% raw, +6% gz). Gains : Moses 101→131 verses, Ibrahim 0→51, Allah 1566→1736.

## Règles de l'assistant IA

### Approche générale — permissions progressives

L'approche retenue : **ne pas censurer l'IA**, mais **contrôler l'accès** selon le profil utilisateur avec responsabilisation claire.

### Architecture à 3 niveaux d'accès (Phase 3)

| Niveau | Fonctionnalités IA | Public |
|---|---|---|
| **Guest** (invité) | Aucune | Visiteurs non-inscrits |
| **Member** (inscrit) | Recherche sémantique, comparaison de traductions, glossaire, suggestions par thème | Inscription email = auto |
| **Advanced** (avancé) | Tout + analyse thématique, comparaison tafsirs, dialogue libre | Demande explicite + validation admin |

### Stratégie d'implémentation

**Phase 1 — MVP sans IA**
- Pas d'authentification, pas de comptes, pas d'IA
- Focus : affichage Coran, traductions, recherche textuelle, audio, navigation, recherche par racine

**Phase 2 — IA publique avec disclaimer**
- IA accessible à tous avec **gros disclaimer obligatoire**
- Logs d'usage anonymisés pour comprendre les patterns
- Feedback utilisateur

**Phase 3 — Permissions granulaires**
- Auth + rôles + panel admin
- Niveaux définis selon les usages réels observés en Phase 2

### Garde-fous absolus (tous niveaux)

1. **Pas de fatwa** — redirige vers savants qualifiés
2. **Pas de positionnement sur divergences entre écoles**
3. **Citation obligatoire des sources**
4. **Admission d'incertitude**
5. **Détection de contexte sensible** (détresse → redirection)
6. **Pas de dialogue inter-religieux polémique**

### Disclaimer affiché

> **L'IA n'est pas un savant.**
>
> Les réponses de l'assistant ne sont pas des fatwas et n'engagent pas les auteurs de cette application.
>
> Pour toute question importante, consultez un savant qualifié.
>
> En utilisant cet assistant, vous reconnaissez avoir compris ces limitations et assumez la responsabilité de l'usage.

Acceptation explicite requise avant première utilisation (mémorisée localement).

### Logging et amélioration

- Conversations anonymisées pour détection de patterns
- Aucune donnée personnelle avec les logs
- Désactivation possible dans les paramètres
- Jamais utilisé pour personnalisation publicitaire (inexistante)

## Fonctionnalité emblématique : recherche lexicale et sémantique

Cette fonctionnalité est **le pilier qui différencie l'application** des autres apps Coran. Inspirée du livre de référence **المعجم المفهرس لألفاظ القرآن الكريم** de **Muhammad Fouad Abdul Baqi (محمد فؤاد عبد الباقي)** (1945), elle vise à offrir gratuitement la puissance de cet outil académique sous forme d'expérience numérique interactive.

### Vision

Permettre à tout musulman (étudiant, débutant, chercheur) d'explorer le vocabulaire du Coran et de la Sunna avec la rapidité et l'intelligence d'un outil moderne.

### Fonctionnalités cibles

**F1 — Recherche par mot et identification de la racine**

L'utilisateur saisit un mot arabe (avec/sans voyelles). L'application retourne :
- Racine trilitère (ex: `ر-ح-م` pour `رحمة`)
- Sens général de la racine
- Toutes les dérivations
- Nombre total d'occurrences dans le Coran
- Répartition par forme grammaticale

**F2 — Exploration d'une racine**
- Tous les versets du Coran contenant la racine
- Filtres (forme exacte vs racine complète)
- Visualisation par sourate
- Racines sémantiquement proches

**F3 — Recherche dans les hadiths par racine** *(MVP v1.1)*
- Commencer par Bukhari + Muslim
- Étendre aux 6 livres principaux
- Attribution complète (recueil, livre, numéro, narrateur, grade)

**F4 — Recherche sémantique assistée par IA**
- Recherche par concept (ex: "versets sur la patience dans l'adversité")
- Combinaison racine + recherche vectorielle Qdrant
- Attribution rigoureuse, jamais d'invention

### Sources de données

**Coran** : Quranic Arabic Corpus (corpus.quran.com, Université de Leeds)
- Analyse morphologique complète des 77 429 mots
- Licence : libre avec attribution

**Hadiths** :
- Sunnah.com pour les textes
- Approche hybride pour la morphologie (tagging manuel/IA avec validation humaine)

### Architecture technique

**Stockage** :
- `packages/data/quran/words/morphology.json`
- `packages/data/quran/indexes/by-root.json`
- `packages/data/hadith/words/` (progressif)

**Recherche** :
- **Meilisearch** pour recherche textuelle instantanée
- **Qdrant** pour recherche sémantique par concept
- Index par racine précalculé pour lookups O(1)

**Performance attendue** :
- Recherche par mot : < 100 ms
- Exploration d'une racine : < 200 ms
- Recherche sémantique IA : < 2 secondes

### Impact sur le planning

- MVP v1.0 (Coran seul) : ~2-3 mois
- MVP v1.1 (+ Bukhari + Muslim) : ~1 mois supplémentaire
- Autres recueils de hadiths : Phase 2

## Commandes courantes

Toutes les commandes se lancent depuis la racine du monorepo.

```bash
# Développement
pnpm dev                                 # tous les dev servers en parallèle
pnpm --filter @quran/web dev             # uniquement le dev server web

# Build
pnpm build                               # build tous les packages + apps
pnpm --filter @quran/web build           # uniquement l'app web

# Qualité
pnpm lint                                # lint toutes les apps/packages
pnpm --filter @quran/web lint            # uniquement l'app web
pnpm --filter @quran/web type-check      # types de l'app web

# Dépendances
pnpm install                             # installe toutes les dépendances
pnpm --filter @quran/web add <lib>       # ajoute une lib à l'app web
pnpm --filter @quran/web add @quran/core --workspace  # lie un package interne
```
