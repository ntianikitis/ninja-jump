// Réglages de gameplay centralisés (distances en pixels du jeu, 320x180 ; une tuile = 18 px).
export const GRAVITY = 400

export const PLAYER_SPEED = 87
// Saut d'environ 3 tuiles de haut (v² / 2g ≈ 54 px).
export const JUMP_VELOCITY = -207

// Aides au saut (en millisecondes).
export const COYOTE_TIME_MS = 100
export const JUMP_BUFFER_MS = 120

export const ENEMY_SPEED = 27
// Distance totale parcourue entre les deux demi-tours (4 tuiles).
export const ENEMY_PATROL_DISTANCE = 72

// Vies au début du niveau (têtes de ninja en haut à gauche).
export const PLAYER_START_LIVES = 3
// Durée de l'animation de perte d'une vie (la tête clignote puis disparaît).
export const LIFE_LOST_MS = 900

// Cœurs : nombre de segments de la barre.
export const PLAYER_MAX_HEALTH = 5
// Invincibilité (clignotement) après avoir été touché par un ennemi.
export const PLAYER_INVINCIBLE_MS = 1500
// Recul quand un ennemi touche le joueur (vitesses), et durée sans contrôle.
export const KNOCKBACK_X = 73
export const KNOCKBACK_Y = -107
export const KNOCKBACK_MS = 300

// Shurikens : munitions au départ et par coffre, vitesse (px/s), portée (8 tuiles), délai entre deux lancers.
export const SHURIKEN_START = 3
export const SHURIKENS_PER_CHEST = 5
export const SHURIKEN_SPEED = 180
export const SHURIKEN_RANGE = 144
export const SHURIKEN_COOLDOWN_MS = 350

// Plateformes mobiles : vitesse moyenne (px/s) ; ressorts : vitesse d'éjection (~6 tuiles de haut).
export const PLATFORM_SPEED = 30
export const SPRING_VELOCITY = -300
// Ennemi volant : vitesse horizontale (px/s) et durée d'une vague (ms).
export const FLYER_SPEED = 30
export const FLYER_WAVE_MS = 1600

// Contours de collision visibles (utile pour régler hitbox et niveau).
export const DEBUG_PHYSICS = false
