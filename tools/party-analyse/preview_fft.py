#!/usr/bin/env python3
"""
Fase D (eksperiment): gjør 30 s smakebitene om til samme FFT-format som telefonens Visualizer
(2048 samples, ~20 bilder/s, 8-bit: [R0, R(n/2), R1, I1, R2, I2, …]) og lagrer dem som .fft.gz
(samme format som FftRecorder). Da kan PartyReplayTest kjøre smakebiten gjennom den ekte analysen
(HardstyleAudio/HardstyleSpectrum) og lage et «drop-fingeravtrykk».

Kjør: <venv>/bin/python tools/party-analyse/preview_fft.py
"""
import glob
import gzip
import os
import struct

import numpy as np

DATA = os.path.expanduser("~/Vibe-kode/Projects/Bilnett-AA-assets/party-analyse")
N, HOP_MS, SR = 2048, 50, 44100


def write_utf(f, s):
    b = s.encode("utf-8")
    f.write(struct.pack(">H", len(b)) + b)


def convert(path, out):
    import essentia.standard as es
    audio = es.MonoLoader(filename=path, sampleRate=SR)()
    hop = int(SR * HOP_MS / 1000)
    win = np.hanning(N)
    with gzip.open(out, "wb") as f:
        write_utf(f, "BNFFT1"); write_utf(f, os.path.basename(path))
        for i, start in enumerate(range(0, len(audio) - N, hop)):
            x = audio[start:start + N]
            peak = np.abs(x).max()
            if peak > 1e-6:
                x = x / peak                       # Visualizer NORMALIZED: full range per capture
            spec = np.fft.rfft(x * win) / N * 4    # rough 8-bit fixed-point scale
            b = np.zeros(N, dtype=np.int8)
            clip = lambda v: int(max(-128, min(127, round(v * 127))))
            b[0] = clip(spec[0].real); b[1] = clip(spec[N // 2].real)
            for k in range(1, N // 2):
                b[2 * k] = clip(spec[k].real); b[2 * k + 1] = clip(spec[k].imag)
            t = i * HOP_MS
            f.write(struct.pack(">qqih", t, t, SR, N) + b.tobytes())


def main():
    out_dir = os.path.join(DATA, "previews-fft")
    os.makedirs(out_dir, exist_ok=True)
    n = 0
    for p in sorted(glob.glob(os.path.join(DATA, "previews", "*"))):
        if p.endswith(".tmp"):
            continue
        out = os.path.join(out_dir, os.path.splitext(os.path.basename(p))[0] + ".fft.gz")
        if not os.path.exists(out):
            convert(p, out); n += 1
    print(f"{n} smakebiter gjort om til FFT")


if __name__ == "__main__":
    main()
