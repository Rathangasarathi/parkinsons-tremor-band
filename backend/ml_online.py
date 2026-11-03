"""Online inference for a MATLAB-exported models/spec.json.

This module is deliberately independent of server.py: it can be unit-tested and
then wired into the WebSocket handler. It consumes real IMU samples only.
The feature definitions mirror the repository's current matlab/extract_features.m.
"""
from __future__ import annotations
import json
from collections import deque
from pathlib import Path
from typing import Iterable, Optional
import numpy as np
from scipy.signal import butter, filtfilt, periodogram
from scipy.signal.windows import hann

FEATURES = ["domfreq", "bp_4_6", "bp_3_12", "bp_low", "rms_acc", "p2p_acc", "rms_gyr", "conc"]


def _band_power(power: np.ndarray, freq: np.ndarray, band: tuple[float, float]) -> float:
    mask = (freq >= band[0]) & (freq <= band[1])
    if not np.any(mask) or len(freq) < 2:
        return 0.0
    return float(np.sum(power[mask]) * (freq[1] - freq[0]))


class Online:
    """Stateful 4-second window classifier. Call push_packet(seq, samples) per IMU packet.

    samples must contain rows [ax_g, ay_g, az_g, gx_dps, gy_dps, gz_dps].
    Returns None until a complete window is available; then returns a prediction dict
    once per hop. Sequence gaps reset buffered samples to avoid classifying across loss.
    """
    def __init__(self, spec_path: str | Path):
        self.spec_path = Path(spec_path)
        self.spec = json.loads(self.spec_path.read_text(encoding="utf-8"))
        self._validate_spec()
        self.fs = int(self.spec["fs"])
        self.win_n = int(round(float(self.spec["win"]) * self.fs))
        self.hop_n = int(round(float(self.spec["hop"]) * self.fs))
        self.samples: deque[np.ndarray] = deque(maxlen=self.win_n)
        self.last_seq: Optional[int] = None
        self.since_prediction = 0
        self.model_errors = 0

    def _validate_spec(self) -> None:
        s = self.spec
        for key in ("version", "fs", "band", "win", "hop", "sos", "features", "tree", "le"):
            if key not in s:
                raise ValueError(f"Model spec missing required key: {key}")
        if list(s["features"]) != FEATURES:
            raise ValueError(f"Feature order mismatch: expected {FEATURES}, got {s['features']}")
        tree = s["tree"]
        n = len(tree["feat"])
        if not all(len(tree[k]) == n for k in ("cut", "left", "right", "cls")) or n == 0:
            raise ValueError("Malformed tree arrays in model spec")
        sos = np.asarray(s["sos"], dtype=float)
        if sos.ndim != 2 or sos.shape[1] != 6 or not np.isfinite(sos).all():
            raise ValueError("SOS must be a finite N x 6 matrix")
        self.sos = sos

    def reset(self) -> None:
        self.samples.clear()
        self.since_prediction = 0
        self.last_seq = None

    def push_packet(self, seq: int, samples: Iterable[Iterable[float]]) -> Optional[dict]:
        if self.last_seq is not None and seq != self.last_seq + 1:
            self.samples.clear()
            self.since_prediction = 0
        self.last_seq = int(seq)
        arr = np.asarray(list(samples), dtype=float)
        if arr.ndim != 2 or arr.shape[1] != 6 or not np.isfinite(arr).all():
            self.reset()
            raise ValueError("Each IMU packet must be finite rows of six values")
        for row in arr:
            self.samples.append(row.copy())
            self.since_prediction += 1
        if len(self.samples) < self.win_n:
            return None
        if self.since_prediction < self.hop_n:
            return None
        self.since_prediction = 0
        try:
            feat = self._features(np.asarray(self.samples))
            label = self._predict(feat)
            return {"type": "ml", "label": label, "feat": feat, "spec": self.spec["version"]}
        except Exception:
            self.model_errors += 1
            raise

    def _features(self, x: np.ndarray) -> dict:
        acc, gyr = x[:, :3], x[:, 3:]
        # Match current MATLAB extract_features.m: vector magnitude, demean, zero-phase bandpass.
        am = np.linalg.norm(acc, axis=1); am = am - np.mean(am)
        gm = np.linalg.norm(gyr, axis=1); gm = gm - np.mean(gm)
        b, a = butter(4, self.spec["band"], btype="bandpass", fs=self.fs)
        ya = filtfilt(b, a, am); yg = filtfilt(b, a, gm)
        nfft = int(self.spec.get("nfft", 512))
        win = hann(len(ya), sym=True)
        f, P = periodogram(ya, fs=self.fs, window=win, nfft=nfft, detrend=False)
        _, Pr = periodogram(am, fs=self.fs, window=win, nfft=nfft, detrend=False)
        band = tuple(map(float, self.spec["band"]))
        m = (f >= band[0]) & (f <= band[1])
        if not np.any(m):
            raise ValueError("No FFT bins inside configured analysis band")
        dom = float(f[m][np.argmax(P[m])])
        b46 = _band_power(P, f, (4.0, 6.0))
        b312 = _band_power(P, f, band)
        values = [dom, b46, b312, _band_power(Pr, f, (0.5, 2.0)),
                  float(np.sqrt(np.mean(ya ** 2))), float(np.ptp(ya)),
                  float(np.sqrt(np.mean(yg ** 2))), float(b46 / max(b312, np.finfo(float).eps))]
        return dict(zip(FEATURES, values))

    def _predict(self, features: dict) -> str:
        tree = self.spec["tree"]
        node = 0
        for _ in range(len(tree["feat"]) + 1):
            left = int(tree["left"][node])
            if left < 0:
                label = tree["cls"][node]
                if label is None or label == "":
                    raise ValueError("Tree leaf has no class label")
                return str(label)
            idx = int(tree["feat"][node])
            if idx < 0 or idx >= len(FEATURES):
                raise ValueError("Tree node contains invalid feature index")
            value = features[FEATURES[idx]]
            cut = float(tree["cut"][node])
            go_left = value <= cut if bool(self.spec["le"]) else value < cut
            node = int(tree["left"][node] if go_left else tree["right"][node])
            if node < 0 or node >= len(tree["feat"]):
                raise ValueError("Tree child index is out of range")
        raise ValueError("Tree traversal exceeded node count (cycle or malformed tree)")
