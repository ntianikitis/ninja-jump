# Ninja Jump

Jeu de plateforme 2D pour un enfant : un petit ninja original saute par-dessus des obstacles.

## Stack

- Vite + TypeScript (template vanilla-ts), Phaser 4
- Résolution 320x180 agrandie par un facteur entier (`pixelArt`, zoom max recalculé au redimensionnement), Arcade Physics
- Graphismes : pack Kenney « Pixel Platformer » (tuiles 18 px, `public/assets/kenney/`)
- Niveaux : maps Tiled en JSON (`public/assets/maps/level1.tmj`), lues par `src/levels/tiledLevel.ts`
- Scènes dans `src/scenes/` (`BootScene` charge les assets puis lance `GameScene`)

## Commandes

- `npm run dev -- --host` : serveur de dev accessible depuis un téléphone sur le même réseau
- `npx tsc --noEmit` : vérification TypeScript
- `npm run build` : build de production

## Éditer un niveau avec Tiled

Tiled est gratuit : `brew install --cask tiled` (ou mapeditor.org).

- **Ouvrir** : dans Tiled, *Fichier > Ouvrir* `public/assets/maps/level1.tmj`.
- **Calques** : `Fond` (image d'horizon, parallaxe réglée dans ses propriétés), `DecorArriere` (décor derrière
  le joueur), `Terrain` (**toute tuile posée ici est solide** ; un trou = pas de tuile), `Objets`, `PremierPlan`
  (décor devant le joueur).
- **Ajouter une pièce** : sélectionner le calque `Objets`, choisir la pièce dans le tileset `kenney-tiles`,
  outil *Insérer une tuile* (T), cliquer à l'endroit voulu (les pieds de l'objet = bas de l'image ; *Vue > Aimanter
  à la grille* aide), puis dans *Propriétés* taper le **Nom** : `coin`.
- **Ajouter un ennemi** : pareil, avec la bestiole du tileset `kenney-characters`, nom `enemy`, posée sur le sol.
  Propriété facultative `patrol` (entier) : largeur de patrouille en tuiles (4 par défaut).
- **Noms reconnus** : `player-start` (un seul), `enemy`, `coin`, `heart`, `energy` (+1 shuriken), `checkpoint`,
  `flag` (un seul, l'arrivée), `chest` (propriété facultative `shurikens`, 5 par défaut). Le tileset `markers`
  sert de repère visuel pour le départ, le coffre et l'énergie. Un nom inconnu est ignoré (message dans la console).
- **Exporter** : il n'y a rien à exporter, la map est déjà au format du jeu : **Cmd+S** (*Fichier > Enregistrer*)
  suffit, le navigateur se recharge tout seul.
- **À ne pas changer** : garder le format des calques en **CSV** (*Carte > Propriétés de la carte*) et les
  tilesets **intégrés** à la map (ne pas les exporter en `.tsx`), sinon Phaser ne sait pas lire le fichier.

## Règles

- **Jeu indulgent** : game over doux avec 3 vies, ton toujours encourageant, checkpoints fréquents.
- **Clavier ET tactile** : toute fonctionnalité doit marcher au clavier et au tactile, sur desktop comme sur smartphone, depuis la même URL.
- **Réglages centralisés** : les réglages de gameplay (gravité, vitesse, saut…) vivent dans `src/config.ts`, jamais en dur dans les scènes.
- **Petites étapes** : on avance une petite étape à la fois ; proposer un plan avant tout changement important.
- **Git** : après chaque étape validée par l'utilisateur, proposer un commit avec un message clair en français, puis le pousser sur GitHub (`origin`, branche `main`).
- **Langue** : répondre en français.
