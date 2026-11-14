// Réglages de gameplay centralisés.
export const GRAVITY = 1200

export const PLAYER_SPEED = 260
export const JUMP_VELOCITY = -620

// Aides au saut (en millisecondes).
export const COYOTE_TIME_MS = 100
export const JUMP_BUFFER_MS = 120

export const ENEMY_SPEED = 80
// Distance totale parcourue entre les deux demi-tours.
export const ENEMY_PATROL_DISTANCE = 200

// Vies au début du niveau (têtes de ninja en haut à gauche).
export const PLAYER_START_LIVES = 3
// Durée de l'animation de perte d'une vie (la tête clignote puis disparaît).
export const LIFE_LOST_MS = 900

// Cœurs : nombre de segments de la barre.
export const PLAYER_MAX_HEALTH = 5
// Invincibilité (clignotement) après avoir été touché par un ennemi.
export const PLAYER_INVINCIBLE_MS = 1500
// Recul quand un ennemi touche le joueur (vitesses), et durée sans contrôle.
export const KNOCKBACK_X = 220
export const KNOCKBACK_Y = -320
export const KNOCKBACK_MS = 300

// Contours de collision visibles (utile pour régler hitbox et niveau).
export const DEBUG_PHYSICS = false
