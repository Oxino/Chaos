# Chaos

Jeu d'arcade 3D cartoon basé sur la physique, le lancement de personnages et la destruction en chaîne.

## Présentation

Chaos propose de choisir un lanceur, un personnage et un objet, puis de viser un environnement ouvert avant de lancer le personnage. Les collisions, les dégâts persistants, les destructions et les réactions en chaîne permettent de construire le meilleur score possible.

Le jeu est conçu pour le PC et le mobile en orientation paysage. Il est solo, gratuit et sans publicité. Les personnages ne meurent jamais : ils restent dans le niveau et peuvent participer aux interactions des tirs suivants.

## Fonctionnalités actuelles

- Visée orientée par la caméra avec limites horizontales et verticales.
- Jauge de puissance et aperçu analytique de la trajectoire.
- Lanceur fixe, tir sur PC et tactile.
- Cycle complet d'un tir : visée, vol, stabilisation et résultat.
- Caméras de visée, de suivi et de résultat avec évitement des obstacles.
- Personnages articulés data-driven avec physique Havok.
- Destruction hybride : objets destructibles, bâtiments à sections détachables et débris budgétés.
- Dégâts et état du niveau persistants pendant une partie, puis réinitialisés à la partie suivante.
- Score direct, combos, objectifs de niveau et écran de résultats.
- Builds composés d'un lanceur, d'un personnage et d'un objet.
- Capacités actives Réacteur et Bombe.
- Progression XP, niveaux, quêtes, secrets, compétences et plusieurs niveaux.
- Collection, inventaire, monnaie gagnée en jeu et tirages de gacha.
- Mode libre et météo/heure variables.

## Stack technique

- [Babylon.js](https://www.babylonjs.com/) pour le rendu 3D et l'interface Babylon GUI.
- [Havok](https://www.babylonjs.com/community/) pour la physique.
- TypeScript en mode strict.
- Vite pour le développement et le build web.
- Vitest pour les tests de logique pure.
- IndexedDB pour la sauvegarde versionnée du profil.

## Prérequis

- Node.js 24 ou version compatible avec les dépendances du projet.
- npm.

## Installation

```bash
npm install
```

## Commandes

Lancer le serveur de développement :

```bash
npm run dev
```

Vérifier les types :

```bash
npm run typecheck
```

Lancer les tests :

```bash
npm test
```

Construire la version de production :

```bash
npm run build
```

Prévisualiser le build :

```bash
npm run preview
```

## Contrôles

### PC

- Clic gauche + déplacement : orienter la visée.
- Jauge de puissance : régler la vitesse initiale.
- Bouton **Lancer** ou barre d'espace : lancer le personnage.
- Touche **A** : activer la capacité disponible pendant le vol.
- La molette n'est pas utilisée.

### Mobile

- Glissement tactile : orienter la visée.
- Jauge de puissance : régler la vitesse initiale.
- Bouton **Lancer** : lancer le personnage.
- Bouton de capacité : activer la capacité disponible pendant le vol.

## Architecture

```text
src/
	core/                 Initialisation du moteur et de la physique
	data/
		config/             Valeurs réglables du jeu
		content/            Contenus data-driven : niveaux, personnages, objets...
	game/                 Logique métier et services de gameplay
	rendering/            Trajectoire, caméras et effets visuels
	ui/                   HUD, sélection de build, collection et résultats
```

Les identifiants et le code sont en anglais. L'interface utilisateur est en français. Les données de contenu et les valeurs provisoires doivent rester séparées de la logique de gameplay.

## Documentation

- [Spécification maîtresse](Docs/CHAOS_MASTER_SPEC_V3.md) : vision, règles de gameplay, décisions validées et feuille de route.
- [Documentation du dossier game](src/game/README.md) : organisation des systèmes de jeu.
- [Documentation du contenu](src/data/content/README.md) : conventions des données de contenu.
- [Commandes de debug](Docs/DEBUG_COMMANDS.md) : outils de développement et de diagnostic.

## Principes du projet

- Priorité au prototype de tir, à la caméra, à la physique et à la destruction.
- Architecture modulaire et data-driven.
- Physique arcade lisible plutôt que simulation réaliste.
- Persistance des dégâts, débris et personnages entre les tirs d'une même partie.
- Aucun multijoueur, aucune publicité, aucune monnaie payante et aucune mort de personnage.

## Statut

Le prototype jouable couvre les systèmes principaux du jeu : tir, caméra, ragdoll, destruction, score, progression, collection, secrets, niveaux et mode libre. Les fonctionnalités marquées `[FUTUR]` ou `[À DÉFINIR]` dans la spécification ne sont pas considérées comme des engagements de la version actuelle.
