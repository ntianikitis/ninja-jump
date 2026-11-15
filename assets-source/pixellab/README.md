# Ninja de profil (PixelLab)

Personnage PixelLab « Ninja rouge » (id `e32fae94-1350-454e-8450-fe13efe6eaaf`), créé en mode v3 à partir de
`reference-64.png` (première image idle de `assets-source/reference/character-exemple.jpeg`), vue `side`.
Pas encore intégré au jeu : on attend d'avoir aussi la course et le saut.

- `ninja-profil.png` : image statique tournée vers la droite (64×64, ninja de 55 px de haut ≈ 1,5 tuile à l'échelle 0.5).
- `idle-garde.png` / `.gif` : **idle retenu**, garde de combat qui sautille (8 images 84×84, ~10 i/s).
- `idle-combat.png` / `.gif` : variante en garde quasi immobile (5 images 84×84), gardée au cas où.
- `full-sprint.png` / `.gif` : **course retenue**, sprint penché en avant (8 images 84×84, ~12 i/s). Les pieds
  flottent de 3 à 5 px au-dessus du bas de l'image : à recaler à l'intégration.
- `run.png` / `.gif` : variante de course, petit trot droit (8 images 84×84).
- `jump.png` / `.gif` : saut complet (8 images 84×84). Découpage prévu : `jump` = images 2 à 4 (montée),
  `fall` = images 5 et 6 (chute) ; l'image 1 (debout) et les deux dernières (atterrissage) ne servent pas.
- `garde-depart.png` : pose de garde servant de première et dernière image à `idle-garde`.
- `apercu-*.png` : aperçus agrandis.
- `ninja/` : export brut de PixelLab (vues face, dos, gauche, droite et toutes les animations, y compris
  l'essai `sprint` raté, resté droit comme un trot).
