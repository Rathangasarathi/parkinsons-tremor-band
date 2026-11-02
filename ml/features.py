"""Raw CSVs -> windowed features. Mirrors matlab/extract_features.m.
usage: python ml/features.py [raw_dir] [out_csv]"""
import sys, glob, os
import numpy as np, pandas as pd
from scipy.signal import butter, sosfiltfilt, periodogram
from scipy.signal.windows import hann

ACC, GYR = 8192.0, 65.5
BAND, TREM, LOW = (3, 12), (4, 6), (0.5, 2)
WIN, HOP, NFFT = 4.0, 1.0, 512
FEATURES = ["domfreq", "bp_4_6", "bp_3_12", "bp_low", "rms_acc", "p2p_acc", "rms_gyr", "conc"]

def bp(P, f, b):
    return P[(f >= b[0]) & (f <= b[1])].sum() * (f[1] - f[0])

def load(path):
    df = pd.read_csv(path)
    t = df["t_us"].to_numpy(np.float64)
    t = t + np.concatenate([[0], np.cumsum(np.diff(t) < 0)]) * 2**32   # unwrap 32-bit counter
    t = (t - t[0]) / 1e6
    acc = df[["ax", "ay", "az"]].to_numpy(float) / ACC
    gyr = df[["gx", "gy", "gz"]].to_numpy(float) / GYR
    name = os.path.splitext(os.path.basename(path))[0]
    return t, acc, gyr, name, name.split("_")[-1]

def extract(path):
    t, acc, gyr, name, label = load(path)
    fs = 1 / np.median(np.diff(t))
    am = np.linalg.norm(acc, axis=1); am -= am.mean()
    gm = np.linalg.norm(gyr, axis=1); gm -= gm.mean()
    sos = butter(4, BAND, btype="band", fs=fs, output="sos")
    ya, yg = sosfiltfilt(sos, am), sosfiltfilt(sos, gm)
    N, H = round(WIN * fs), round(HOP * fs)
    w = hann(N, sym=True)
    rows = []
    for i in range(0, len(ya) - N + 1, H):
        sl = slice(i, i + N)
        f, P = periodogram(ya[sl], fs, window=w, nfft=NFFT, detrend=False)
        _, Pr = periodogram(am[sl], fs, window=w, nfft=NFFT, detrend=False)
        m = (f >= BAND[0]) & (f <= BAND[1])
        b46, b312 = bp(P, f, TREM), bp(P, f, BAND)
        rows.append([t[i], f[m][np.argmax(P[m])], b46, b312, bp(Pr, f, LOW),
                     np.sqrt(np.mean(ya[sl] ** 2)), np.ptp(ya[sl]),
                     np.sqrt(np.mean(yg[sl] ** 2)), b46 / max(b312, 1e-12), label, name])
    cols = ["t"] + FEATURES[:4] + ["rms_acc", "p2p_acc", "rms_gyr", "conc", "label", "session"]
    return pd.DataFrame(rows, columns=cols), fs

if __name__ == "__main__":
    raw = sys.argv[1] if len(sys.argv) > 1 else "data/raw"
    out = sys.argv[2] if len(sys.argv) > 2 else "data/processed/features_py.csv"
    files = sorted(glob.glob(os.path.join(raw, "*.csv")))
    assert files, f"no CSV files in {raw}"
    dfs = []
    for f in files:
        d, fs = extract(f); dfs.append(d)
        print(f"{os.path.basename(f):38s} fs={fs:.2f} Hz  windows={len(d)}")
    os.makedirs(os.path.dirname(out), exist_ok=True)
    pd.concat(dfs).to_csv(out, index=False); print("saved", out)
