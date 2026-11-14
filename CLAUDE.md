# Ninja Jump

Jeu de plateforme 2D pour un enfant : un petit ninja original saute par-dessus des obstacles.

## Stack

- Vite + TypeScript (template vanilla-ts), Phaser 4
- Résolution 960x540, Scale Manager en FIT centré, Arcade Physics
- Scènes dans `src/scenes/` (`BootScene` charge les assets puis lance `GameScene`)

## Commandes

- `npm run dev -- --host` : serveur de dev accessible depuis un téléphone sur le même réseau
- `npx tsc --noEmit` : vérification TypeScript
- `npm run build` : build de production

## Règles

- **Jeu indulgent** : pas de game over frustrant, checkpoints fréquents.
- **Clavier ET tactile** : toute fonctionnalité doit marcher au clavier et au tactile, sur desktop comme sur smartphone, depuis la même URL.
- **Réglages centralisés** : les réglages de gameplay (gravité, vitesse, saut…) vivent dans `src/config.ts`, jamais en dur dans les scènes.
- **Petites étapes** : on avance une petite étape à la fois ; proposer un plan avant tout changement important.
- **Langue** : répondre en français.
