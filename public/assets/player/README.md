# Assets du joueur

Le jeu charge ces trois fichiers ; pour changer de personnage, il suffit de les remplacer.

- `player.png` : planche d'images.
- `player.json` : atlas au format JSON de Phaser (« JSON Hash »), qui décrit chaque image de la planche.
- `character.json` : réglages du personnage.

## Noms des images dans l'atlas

Chaque image s'appelle `<animation>/<numéro>`, numéros sur deux chiffres à partir de `00`
(ex. `run/00`, `run/01`…). Les six premières animations sont obligatoires, les deux dernières facultatives :

| Animation | Utilisée quand…                     |
|-----------|-------------------------------------|
| `idle`    | le joueur est au sol, immobile      |
| `run`     | le joueur court au sol              |
| `jump`    | le joueur monte                     |
| `fall`    | le joueur descend                   |
| `hurt`    | le joueur touche un ennemi          |
| `victory` | le joueur atteint le drapeau        |
| `throw`   | (facultative) lancer de shuriken    |
| `death`   | (facultative) perte d'une vie       |

Les images sont dessinées **tournées vers la droite** : le jeu les retourne pour aller à gauche, autour du
**centre de l'image** : le corps (la tête) doit donc être centré horizontalement dans chaque image.

## `character.json`

- `scale` : facteur d'affichage des images. Le monde est zoomé ×2 : avec 0.5, chaque pixel du dessin reste un
  pixel à l'écran (personnage deux fois plus fin que les tuiles).
- `smooth` : `true` pour lisser les images (personnage non pixel art) ; à omettre pour un personnage en pixel art.
- `hitbox` : zone de collision, en pixels de l'image (avant `scale`) ; centrée horizontalement,
  `bottom` = ligne des pieds mesurée depuis le haut de l'image.
- `animations` : vitesse (`frameRate`, images par seconde) et boucle (`repeat` : -1 = en boucle, 0 = une fois).

## Personnage actuel

Ninja rouge en pixel art, nettoyé depuis la planche `assets-source/reference/character-exemple.jpeg`
par l'outil `tools/clean_spritesheet.py`, qui écrit directement ces trois fichiers :

    tools/.venv/bin/python tools/clean_spritesheet.py --game public/assets/player

(Environnement Python : `python3 -m venv tools/.venv && tools/.venv/bin/pip install -r tools/requirements.txt`.)
