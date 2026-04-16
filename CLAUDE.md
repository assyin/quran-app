# Projet Quran App

## Vue d'ensemble

Monorepo pnpm + Turborepo pour une application Quran multiplateforme (web + mobile), entièrement en TypeScript. Projet gratuit et open-source.

## Structure

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

## Règles de placement du code (package boundaries)

Quand tu crées un nouveau fichier, applique cette règle :

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

## Commandes courantes

Toutes les commandes se lancent depuis la racine du monorepo :

```bash
# Développement
pnpm dev                                 # lance tous les dev servers en parallèle
pnpm --filter @quran/web dev             # lance uniquement le dev server web

# Build
pnpm build                               # build tous les packages + apps
pnpm --filter @quran/web build           # build uniquement l'app web

# Qualité
pnpm lint                                # lint toutes les apps/packages
pnpm --filter @quran/web lint            # lint uniquement l'app web
pnpm --filter @quran/web type-check      # vérifie les types de l'app web

# Dépendances
pnpm install                             # installe toutes les dépendances du monorepo
pnpm --filter @quran/web add <lib>       # ajoute une lib à l'app web
pnpm --filter @quran/web add @quran/core --workspace  # lie un package interne
```

## Conventions de base

- TypeScript partout (pas de `.js` sauf configs)
- Server components par défaut dans Next.js ; client components seulement si nécessaire
- Import alias `@/*` pour les imports internes à `apps/web/`
- Fichiers de composants en PascalCase (ex: `QuranReader.tsx`)
- Fichiers utilitaires en camelCase (ex: `formatVerse.ts`)
- Commits : Conventional Commits (`feat`, `fix`, `chore`, `docs`, `refactor`, `test`)

## Contexte à enrichir

Ce fichier est intentionnellement minimal pour l'instant. Les règles suivantes seront ajoutées progressivement :

- Contexte métier (public cible, mission du projet)
- i18n : langues supportées (arabe, français, anglais)
- Règles d'intégrité du contenu coranique (sources, attributions)
- Règles de l'assistant IA (pas de fatwas, redirection vers savants)
- Structure des données Coran/Hadith
- Règles d'accessibilité RTL/LTR
