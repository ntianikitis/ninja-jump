"""
Compose et génère la musique « ninja » du jeu : la boucle de fond (sans coupure) et les jingles de victoire.

Gamme japonaise « in » (ré, mi bémol, sol, la, si bémol), mélodie au son pincé façon koto
(synthèse de corde Karplus-Strong), basse douce, tambour grave façon taiko et bloc de bois.

Utilisation (depuis la racine du projet) :
    tools/.venv/bin/python tools/make_music.py
Produit dans assets-source/music/ : ninja-loop, ninja-victory-a, ninja-victory-b et ninja-gong (.wav, puis
.m4a avec l'outil macOS afconvert).
"""

from __future__ import annotations

import subprocess
import wave
from pathlib import Path

import numpy as np

OUTPUT = Path('assets-source/music')
RATE = 32000
BPM = 112
STEP = 60 / BPM / 2  # une croche
STEPS_PER_BAR = 8

NOTES = {'C': 0, 'D': 2, 'Eb': 3, 'E': 4, 'F': 5, 'G': 7, 'A': 9, 'Bb': 10, 'B': 11}


def freq(note: str) -> float:
    """'A4' -> 440 Hz."""
    name, octave = note[:-1], int(note[-1])
    midi = 12 * (octave + 1) + NOTES[name]
    return 440 * 2 ** ((midi - 69) / 12)


# Mélodie : une case par croche, None = silence. 8 mesures.
MELODY = [
    ['D5', None, 'A4', None, 'Bb4', 'A4', 'G4', None],
    ['A4', None, None, None, 'D4', None, 'Eb4', None],
    ['G4', None, 'A4', None, 'Bb4', None, 'D5', None],
    ['Eb5', None, 'D5', None, 'A4', None, None, None],
    ['D5', None, 'Eb5', 'D5', 'Bb4', None, 'A4', None],
    ['G4', None, 'A4', None, 'Bb4', 'A4', 'G4', None],
    ['Eb4', None, 'G4', None, 'A4', None, 'Bb4', 'A4'],
    ['D4', None, None, None, None, None, None, None],
]
# Note de basse de chaque mesure (octave 2).
BASS_ROOTS = ['D', 'D', 'G', 'A', 'Bb', 'G', 'Eb', 'D']

MIX = {'koto': 0.55, 'bass': 0.35, 'taiko': 0.6, 'wood': 0.18}


def koto(f: float, duration: float = 1.6) -> np.ndarray:
    """Corde pincée (Karplus-Strong) : bruit filtré qui résonne dans une boucle de retard."""
    n = int(RATE * duration)
    period = max(2, int(round(RATE / f)))
    rng = np.random.default_rng(int(f * 100))
    buf = rng.uniform(-1, 1, period)
    buf = np.convolve(buf, [0.5, 0.5], mode='same')  # attaque un peu moins brillante
    out = np.empty(n)
    decay = 0.996
    for i in range(n):
        j = i % period
        out[i] = buf[j]
        buf[j] = decay * 0.5 * (buf[j] + buf[(j + 1) % period])
    fade = np.ones(n)
    fade[-int(0.05 * RATE):] = np.linspace(1, 0, int(0.05 * RATE))
    return out * fade


def bass(f: float, duration: float = 0.5) -> np.ndarray:
    t = np.arange(int(RATE * duration)) / RATE
    tone = np.sin(2 * np.pi * f * t) + 0.25 * np.sin(2 * np.pi * 2 * f * t)
    return tone * np.exp(-t * 6) * np.minimum(1, t / 0.005)


def taiko(strength: float = 1.0) -> np.ndarray:
    """Tambour grave : sinus dont la hauteur chute, plus un souffle de bruit."""
    t = np.arange(int(RATE * 0.6)) / RATE
    pitch = 55 + 70 * np.exp(-t * 18)
    phase = 2 * np.pi * np.cumsum(pitch) / RATE
    body = np.sin(phase) * np.exp(-t * 7)
    noise = np.random.default_rng(1).uniform(-1, 1, len(t)) * np.exp(-t * 40) * 0.3
    return strength * (body + noise)


def gong(duration: float = 3.0) -> np.ndarray:
    """Gong : partiels non harmoniques qui s'éteignent lentement, avec un léger battement."""
    t = np.arange(int(RATE * duration)) / RATE
    partials = [(98, 1.0, 1.2), (161, 0.6, 1.6), (233, 0.45, 2.0), (318, 0.3, 2.6), (421, 0.2, 3.4), (99.5, 0.5, 1.3)]
    tone = sum(a * np.sin(2 * np.pi * f * t) * np.exp(-t * d) for f, a, d in partials)
    return tone * np.minimum(1, t / 0.01)


def wood() -> np.ndarray:
    t = np.arange(int(RATE * 0.08)) / RATE
    return (np.sin(2 * np.pi * 1250 * t) + 0.5 * np.sin(2 * np.pi * 1900 * t)) * np.exp(-t * 70)


def compose() -> tuple[list[tuple[float, np.ndarray]], float]:
    """Liste (instant en s, son) pour une boucle, et la durée de la boucle."""
    events: list[tuple[float, np.ndarray]] = []
    for bar, steps in enumerate(MELODY):
        bar_start = bar * STEPS_PER_BAR * STEP
        for i, note in enumerate(steps):
            if note:
                events.append((bar_start + i * STEP, MIX['koto'] * koto(freq(note))))
        root = BASS_ROOTS[bar]
        events.append((bar_start, MIX['bass'] * bass(freq(f'{root}2'))))
        events.append((bar_start + 4 * STEP, MIX['bass'] * bass(freq(f'{root}2'))))
        events.append((bar_start + 6 * STEP, 0.6 * MIX['bass'] * bass(freq(f'{root}3'))))
        events.append((bar_start, MIX['taiko'] * taiko(1.0)))
        events.append((bar_start + 4 * STEP, MIX['taiko'] * taiko(0.6)))
        for i in (2, 6) + ((7,) if bar % 2 else ()):
            events.append((bar_start + i * STEP, MIX['wood'] * wood()))
        if bar == len(MELODY) - 1:  # petit roulement de taiko pour relancer la boucle
            for i in (5, 6, 7):
                events.append((bar_start + i * STEP, MIX['taiko'] * taiko(0.45)))
    return events, len(MELODY) * STEPS_PER_BAR * STEP


def mix(events: list[tuple[float, np.ndarray]], length: float) -> np.ndarray:
    """Place chaque son à son instant, sur une piste de `length` secondes, puis normalise."""
    track = np.zeros(int(RATE * length))
    for time, sound in events:
        start = int(round(time * RATE))
        end = min(len(track), start + len(sound))
        track[start:end] += sound[: end - start]
    fade = int(0.15 * RATE)
    track[-fade:] *= np.linspace(1, 0, fade)
    return 0.85 * track / np.abs(track).max()


def victory_a() -> np.ndarray:
    """« Envolée » : montée rapide au koto, puis accord éclatant sur un grand coup de taiko (~2 s)."""
    run = ['D4', 'Eb4', 'G4', 'A4', 'Bb4', 'D5', 'Eb5', 'G5']
    sixteenth = STEP / 2
    events = [(i * sixteenth, MIX['koto'] * koto(freq(n), 0.8)) for i, n in enumerate(run)]
    events += [(0, MIX['taiko'] * taiko(0.6)), (4 * sixteenth, MIX['taiko'] * taiko(0.5))]
    end = len(run) * sixteenth + 0.05
    for i, n in enumerate(['D5', 'A5', 'D6']):  # accord « gratté »
        events.append((end + i * 0.02, 0.8 * MIX['koto'] * koto(freq(n), 1.4)))
    events += [(end, 1.3 * MIX['taiko'] * taiko(1.0)), (end, 0.6 * MIX['wood'] * wood())]
    return mix(events, end + 1.3)


def victory_b() -> np.ndarray:
    """« Gong du maître » : deux coups de taiko, phrase au koto, gong et accord qui résonne (~3,5 s)."""
    events = [(0, MIX['taiko'] * taiko(0.9)), (STEP, MIX['taiko'] * taiko(0.9))]
    phrase = [('A4', 2), ('Bb4', 3), ('A4', 4), ('G4', 5), ('D5', 6)]
    events += [(i * STEP, MIX['koto'] * koto(freq(n), 1.2)) for n, i in phrase]
    end = 7 * STEP
    events.append((end, 0.9 * gong()))
    for i, n in enumerate(['D4', 'A4', 'D5', 'A5']):
        events.append((end + i * 0.03, 0.8 * MIX['koto'] * koto(freq(n), 2.2)))
    events.append((end, 1.2 * MIX['taiko'] * taiko(1.0)))
    return mix(events, end + 2.4)


def gong_jingle() -> np.ndarray:
    """Gong de départ (« Jouer », « Recommencer ») : coup de taiko et gong qui résonne (~2,5 s)."""
    return mix([(0, 0.9 * gong(2.5)), (0, MIX['taiko'] * taiko(1.0))], 2.5)


def render() -> np.ndarray:
    events, loop = compose()
    length = int(round(loop * RATE))
    # On joue la boucle 3 fois et on garde celle du milieu : les résonances de la fin
    # se prolongent ainsi naturellement sur le début, sans coupure au bouclage.
    track = np.zeros(3 * length + RATE * 2)
    for copy in range(3):
        for time, sound in events:
            start = copy * length + int(round(time * RATE))
            track[start:start + len(sound)] += sound
    loop_audio = track[length:2 * length]
    return 0.85 * loop_audio / np.abs(loop_audio).max()


def save(name: str, audio: np.ndarray) -> None:
    wav_path = OUTPUT / f'{name}.wav'
    with wave.open(str(wav_path), 'wb') as f:
        f.setnchannels(1)
        f.setsampwidth(2)
        f.setframerate(RATE)
        f.writeframes((audio * 32767).astype('<i2').tobytes())
    m4a_path = OUTPUT / f'{name}.m4a'
    subprocess.run(['afconvert', '-f', 'm4af', '-d', 'aac', '-b', '96000', str(wav_path), str(m4a_path)], check=True)
    print(f'{name} : {len(audio) / RATE:.1f} s -> {m4a_path}')


def main() -> None:
    OUTPUT.mkdir(parents=True, exist_ok=True)
    save('ninja-loop', render())
    save('ninja-victory-a', victory_a())
    save('ninja-victory-b', victory_b())
    save('ninja-gong', gong_jingle())


if __name__ == '__main__':
    main()
