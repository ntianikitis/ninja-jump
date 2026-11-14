# Assets du joueur

Le jeu charge ces trois fichiers ; pour changer de personnage, il suffit de les remplacer.

- `player.png` : planche d'images.
- `player.json` : atlas au format JSON de Phaser (« JSON Hash »), qui décrit chaque image de la planche.
- `character.json` : réglages du personnage.

## Noms des images dans l'atlas

Chaque image s'appelle `<animation>/<numéro>`, numéros sur deux chiffres à partir de `00`
(ex. `run/00`, `run/01`…). Les six animations sont obligatoires :

| Animation | Utilisée quand…                     |
|-----------|-------------------------------------|
| `idle`    | le joueur est au sol, immobile      |
| `run`     | le joueur court au sol              |
| `jump`    | le joueur monte                     |
| `fall`    | le joueur descend                   |
| `hurt`    | le joueur touche un ennemi          |
| `victory` | le joueur atteint le drapeau        |

Les images sont dessinées **tournées vers la droite** : le jeu les retourne pour aller à gauche.

## `character.json`

- `scale` : facteur d'affichage des images (0.5 = images dessinées en double résolution).
- `smooth` : `true` pour lisser les images (personnage non pixel art) ; à omettre pour un personnage en pixel art.
- `hitbox` : zone de collision, en pixels de l'image (avant `scale`) ; centrée horizontalement,
  `bottom` = ligne des pieds mesurée depuis le haut de l'image.
- `animations` : vitesse (`frameRate`, images par seconde) et boucle (`repeat` : -1 = en boucle, 0 = une fois).

## Personnage actuel

`character-r` du pack « Blocky Characters » de Kenney (www.kenney.nl), licence CC0.
Images générées depuis le modèle 3D avec `tools/render-player.html?save=1`
(le pack doit être dans `assets-source/kenney-personnage/`).
