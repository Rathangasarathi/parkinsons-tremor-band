"""Creates fake raw sessions (same CSV format) to TEST the pipeline. Not real data - never train on it.
usage: python ml/make_synthetic.py  -> data/synthetic/*.csv"""
import numpy as np, os
rng = np.random.default_rng(0)
os.makedirs("data/synthetic", exist_ok=True)
fs, dur = 100, 60
t = np.arange(dur * fs) / fs
def sig(label):
    if label == "rest":      a = rng.normal(0, 0.003, t.size)
    elif label == "voluntary": a = 0.25*np.sin(2*np.pi*rng.uniform(.5,1.5)*t) + rng.normal(0, .01, t.size)
    elif label == "walking":  a = 0.4*np.sin(2*np.pi*1.9*t) + 0.15*np.sin(2*np.pi*3.8*t) + rng.normal(0, .02, t.size)
    else:                     a = rng.uniform(.04,.12)*np.sin(2*np.pi*rng.uniform(4.2,5.8)*t) + rng.normal(0, .01, t.size)
    return a
for label in ["rest", "voluntary", "walking", "tremor"]:
    for s in range(6):
        a = sig(label)
        ax, ay, az = rng.normal(0, .002, t.size), a, 1 + rng.normal(0, .002, t.size)
        g = np.stack([rng.normal(0, .3, t.size)] * 3, 1) + a[:, None] * 20
        raw = np.column_stack([np.arange(t.size), (t * 1e6).astype(int), ax*8192, ay*8192, az*8192, g*65.5]).astype(int)
        name = f"data/synthetic/2026110{s+1}_1000{s}0_{label}.csv"
        np.savetxt(name, raw, fmt="%d", delimiter=",", header="seq,t_us,ax,ay,az,gx,gy,gz", comments="")
print("done")
