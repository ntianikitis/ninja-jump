# Ninja de profil (PixelLab)

Personnage PixelLab « Ninja rouge » (id `e32fae94-1350-454e-8450-fe13efe6eaaf`), créé en mode v3 à partir de
`reference-64.png` (première image idle de `assets-source/reference/character-exemple.jpeg`), vue `side`.
Pas encore intégré au jeu : on attend d'avoir aussi la course et le saut.

- `ninja-profil.png` : image statique tournée vers la droite (64×64, ninja de 55 px de haut ≈ 1,5 tuile à l'échelle 0.5).
- `idle-garde.png` / `.gif` : **idle retenu**, garde de combat qui sautille (8 images 84×84, ~10 i/s).
- `idle-combat.png` / `.gif` : variante en garde quasi immobile (5 images 84×84), gardée au cas où.
- `garde-depart.png` : pose de garde servant de première et dernière image à `idle-garde`.
- `apercu-*.png` : aperçus agrandis.
- `ninja/` : export brut de PixelLab (vues face, dos, gauche, droite et toutes les animations).
