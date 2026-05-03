# Quran App

**Application web et mobile pour le Saint Coran et la Sunna prophétique, propulsée par l'IA**

[![License: AGPL v3](https://img.shields.io/badge/License-AGPL_v3-blue.svg)](./LICENSE)

## À propos

Projet pensé comme une *sadaqah jariyah* : offrir un accès libre, gratuit et respectueux au Coran et à la Sunna, avec des outils modernes (recherche, assistant IA, mémorisation) pour aider à l'apprentissage et à la réflexion. Aucune publicité, aucune collecte ni revente de données utilisateurs. Le code source est ouvert et placé sous licence AGPL-3.0.

## Vision & principes

- **Gratuité à vie** : aucun abonnement, aucun achat in-app, aucun paywall, jamais.
- **Sans publicité** : aucune bannière, aucun tracker publicitaire, aucun sponsor.
- **Respect de la vie privée** : aucune collecte inutile, aucune revente de données, aucun profilage.
- **Intégrité du contenu** : le texte coranique n'est jamais modifié ; les hadiths sont attribués à leurs sources ; les tafsirs citent leurs auteurs.
- **Prudence théologique** : l'assistant IA n'émet pas de fatwas et redirige systématiquement vers les savants pour toute question religieuse.
- **Open-source assumé** : code ouvert, contributions bienvenues, licence AGPL-3.0 pour garantir que tout fork restera gratuit et libre.

## État du projet

En cours de développement actif — les premières fondations techniques sont en place, l'application n'est pas encore fonctionnelle pour les utilisateurs finaux.

## Stack technique

- **Next.js 16** (App Router, Turbopack) pour l'app web
- **React Native + Expo** pour l'app mobile (à venir)
- **TypeScript** (strict) sur l'ensemble du code
- **pnpm** + **Turborepo** pour la gestion du monorepo
- **Tailwind CSS 4** pour le styling web

## Structure du monorepo

```
quran-app/
├── apps/
│   ├── web/          # Next.js — app web
│   └── mobile/       # React Native + Expo — app mobile (à venir)
└── packages/
    ├── core/         # logique partagée, types, clients API
    ├── data/         # données JSON (Coran, Hadith)
    ├── i18n/         # traductions (ar, fr, en)
    └── config/       # tsconfig + eslint partagés
```

## Démarrage rapide

Prérequis : Node.js >=22 et pnpm 10.33.0.

```bash
pnpm install                       # installe toutes les dépendances
pnpm --filter @quran/web dev       # lance le dev server web sur localhost:3000
pnpm --filter @quran/web build     # build de production
```

## Licence

Ce projet est distribué sous licence **GNU Affero General Public License v3.0 (AGPL-3.0)**. Voir le fichier [LICENSE](./LICENSE) pour le texte complet.

## Remerciements et sources

L'application n'aurait pas été possible sans le travail patient de plusieurs équipes académiques et religieuses qui mettent leurs ressources à disposition de la communauté :

- **Quranic Arabic Corpus v0.4** (2011) par Kais Dukes, Université de Leeds — étiquetage morphologique académique de chaque mot du Coran (racine, lemme, fonction grammaticale). Utilisé sous licence GNU GPL ; alimente le mode de recherche par racine. http://corpus.quran.com
- **Tanzil** — texte Uthmani vérifié du Coran, sous licence Creative Commons BY-ND 3.0. http://tanzil.net
- **Muhammad Hamidullah** (1959) — traduction française du Coran
- **Sahih International** (1997) — traduction anglaise du Coran
- **King Fahd Glorious Quran Printing Complex** — typographie KFGQPC Uthmanic Hafs V20
- **المعجم المفهرس لألفاظ القرآن الكريم** de Muhammad Fu'ad Abdul-Baqi (1945) — référence académique qui inspire l'UX de la recherche par racine et par lemme

## Feuille de route

- [x] Fondations techniques (monorepo pnpm + Turborepo, Next.js 16, TypeScript strict)
- [ ] Affichage du Coran en arabe (rasm uthmani) avec rendu RTL authentique
- [ ] Récitations audio avec synchronisation verset par verset
- [ ] Traductions multilingues (français, anglais) et interface i18n
- [ ] Moteur de recherche sémantique dans le Coran et les hadiths (assisté par IA)
- [ ] Assistant IA pour l'étude et la compréhension
- [ ] Module de mémorisation avec reconnaissance vocale
- [ ] Application mobile native (iOS et Android via Expo)
- [ ] Gestion des favoris et notes personnelles (synchronisation optionnelle)

## Contribution

Les contributions sont les bienvenues. Le projet est encore jeune et les fondations évoluent rapidement — merci d'ouvrir une *issue* avant toute contribution significative pour en discuter.

Le contenu religieux (texte coranique, hadiths, traductions) doit impérativement provenir de sources reconnues et correctement attribuées. Toute contribution touchant à ce contenu sera examinée avec une attention particulière sur l'intégrité et les références.
