"""Tremor wearable backend (FastAPI).  Run:  python server.py [--simulate]

ESP32  --WebSocket-->  /ws/telemetry   (validated, schema v1)
Browser <--WebSocket-- /ws/dashboard   (live data + status)
Also serves the dashboard at "/" and a small REST API (/health, /api/...).
Engineering prototype: nothing here is a diagnosis or a clinical measurement.
"""
import asyncio, csv, io, json, math, os, random, re, sys, time
from collections import deque
from contextlib import asynccontextmanager
from pathlib import Path
from typing import Annotated, Literal, Optional, Union

import numpy as np
from fastapi import FastAPI, HTTPException, Query, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, Response
from pydantic import BaseModel, Field, TypeAdapter, ValidationError

ROOT = Path(__file__).resolve().parent.parent
_env = ROOT / ".env"
if _env.exists():                                   # tiny .env loader (no extra dependency)
    for _l in _env.read_text(encoding="utf-8").splitlines():
        if "=" in _l and not _l.strip().startswith("#"):
            _k, _v = _l.split("=", 1); os.environ.setdefault(_k.strip(), _v.strip())

VERSION, SCHEMA_V = "1.0.0", 1
HOST, PORT = os.getenv("HOST", "0.0.0.0"), int(os.getenv("PORT", "8000"))
TOKEN = os.getenv("DEVICE_TOKEN", "")
SIM = os.getenv("SIMULATE", "0") == "1" or "--simulate" in sys.argv
DATA = Path(os.getenv("DATA_DIR") or ROOT / "data"); DATA.mkdir(parents=True, exist_ok=True)
FS, WIN, BAND, STALE_S = 100, 400, (3.0, 12.0), 3.0   # analysis band is adjustable, not a diagnostic threshold

# ------------------------------------------------------------------ telemetry schema v1
class _B(BaseModel):
    v: int = SCHEMA_V

class Hello(_B):
    type: Literal["hello"]; device: str; fw: str
    who: Optional[int] = None; sensors: dict[str, bool] = {}

class Imu(_B):          # batch of samples: [ax,ay,az (g), gx,gy,gz (deg/s)] every 1/fs s starting at t (device ms)
    type: Literal["imu"]; seq: int; t: int; fs: int = 100
    s: list[Annotated[list[float], Field(min_length=6, max_length=6)]] = Field(min_length=1, max_length=50)

class Vit(_B):          # 1 Hz status; hr/spo2 are null whenever the reading is not valid
    type: Literal["vit"]; seq: int; t: int
    hr: Optional[int] = None; spo2: Optional[int] = None
    q: Literal["ok", "no_finger", "settling", "no_sensor"] = "no_sensor"
    finger: bool = False; rms: float = 0.0; idx: int = Field(0, ge=0, le=4)
    state: Literal["NORMAL", "PENDING", "ACTIVE", "ACKED"]; id: int = 0; late: int = 0

class Evt(_B):
    type: Literal["evt"]; id: int; state: Literal["ACTIVE", "ACKNOWLEDGED", "RESOLVED"]
    t: int; rms: float = 0.0; buffered: bool = False

adapter = TypeAdapter(Annotated[Union[Hello, Imu, Vit, Evt], Field(discriminator="type")])

# ------------------------------------------------------------------ shared state
class Hub:
    def __init__(self):
        self.ui, self.dev = set(), None
        self.hello = self.vit = None
        self.last_rx, self.last_seq, self.lost = 0.0, None, 0
        self.counts = {"imu": 0, "vit": 0, "evt": 0, "bad": 0}
        self.events, self.buf = deque(maxlen=100), deque(maxlen=WIN)
        self.last_fft, self.rec, self.rec_name, self.sim_active = 0.0, None, None, False
hub = Hub()

async def bcast(obj):
    txt = json.dumps(obj)
    for c in list(hub.ui):
        try: await c.send_text(txt)
        except Exception: hub.ui.discard(c)

def device_state():
    age = time.time() - hub.last_rx if hub.last_rx else None
    if hub.dev is not None:
        return ("connected" if age is not None and age < STALE_S else "stale"), age
    if hub.sim_active and age is not None and age < STALE_S:
        return "simulated", age
    return "disconnected", age

def status_msg():
    state, age = device_state()
    return {"type": "status", "device": state, "age": None if age is None else round(age, 1),
            "sim": hub.sim_active and hub.dev is None, "recording": hub.rec_name, "lost": hub.lost,
            "counts": hub.counts, "server": VERSION, "schema": SCHEMA_V}

def analyse():
    a = np.array(hub.buf)[:, :3]; a = a - a.mean(0)
    P = (np.abs(np.fft.rfft(a * np.hanning(len(a))[:, None], axis=0)) ** 2).sum(1)
    f = np.fft.rfftfreq(len(a), 1 / FS)
    band, tot, k = (f >= BAND[0]) & (f <= BAND[1]), (f >= 0.5) & (f <= 25), f <= 20
    return {"type": "analysis", "f": np.round(f[k], 2).tolist(), "p": np.round(P[k], 5).tolist(),
            "dom": round(float(f[band][np.argmax(P[band])]), 2),
            "bp": round(float(P[band].sum() / max(P[tot].sum(), 1e-12)), 3),
            "amp": round(float(np.sqrt((a ** 2).sum(1).mean())), 4), "band": list(BAND)}

async def handle(m, sim=False):
    d = m.model_dump(); d["rx"] = round(time.time(), 3); d["sim"] = sim
    hub.last_rx = time.time()
    if m.type == "hello": hub.hello = d
    elif m.type == "imu":
        hub.counts["imu"] += 1
        if hub.last_seq is not None and m.seq > hub.last_seq + 1: hub.lost += m.seq - hub.last_seq - 1
        hub.last_seq = m.seq; hub.buf.extend(m.s)
        if len(hub.buf) == WIN and time.time() - hub.last_fft > 0.5:
            hub.last_fft = time.time(); await bcast({**analyse(), "sim": sim})
    elif m.type == "vit": hub.vit = d; hub.counts["vit"] += 1
    elif m.type == "evt":
        hub.counts["evt"] += 1; hub.events.appendleft(d)
        if not sim:
            with open(DATA / "events.jsonl", "a", encoding="utf-8") as f: f.write(json.dumps(d) + "\n")
    if hub.rec: hub.rec.write(json.dumps(d) + "\n")
    await bcast(d)

# ------------------------------------------------------------------ simulator (always labelled sim=true)
async def simulator():
    seq = vseq = eid = 0; t0 = time.time(); prev = "NORMAL"
    while True:
        await asyncio.sleep(0.1)
        if hub.dev is not None: hub.sim_active = False; continue
        if not hub.sim_active: hub.sim_active = True; hub.buf.clear(); hub.last_seq = None; seq = 0
        now = time.time() - t0; rows = []
        for i in range(10):
            tt = now - 0.1 + i * 0.01; ph = tt % 24; A = 0.005 if ph < 8 else 0.15   # 24 s cycle: rest, then 5 Hz tremor-like
            w = math.sin(2 * math.pi * 5 * tt); g = random.gauss
            rows.append([A * w + g(0, .003), 0.5 * A * math.sin(2 * math.pi * 5 * tt + 1) + g(0, .003), 1 + 0.3 * A * w + g(0, .003),
                         40 * A * w + g(0, .3), 20 * A * w + g(0, .3), g(0, .3)])
        await handle(adapter.validate_python({"v": 1, "type": "imu", "seq": seq, "t": int(now * 1000), "fs": 100, "s": rows}), sim=True)
        seq += 1
        ph = now % 24; A = 0.005 if ph < 8 else 0.15; rms = A * 0.8
        state = "NORMAL" if ph < 8 else "PENDING" if ph < 11 else "ACTIVE" if ph < 17 else "ACKED"
        if state == "ACTIVE" and prev != "ACTIVE": eid += 1; await handle(Evt(type="evt", id=eid, state="ACTIVE", t=int(now * 1000), rms=rms), sim=True)
        if state == "ACKED" and prev == "ACTIVE": await handle(Evt(type="evt", id=eid, state="ACKNOWLEDGED", t=int(now * 1000), rms=rms), sim=True)
        if state == "NORMAL" and prev == "ACKED": await handle(Evt(type="evt", id=eid, state="RESOLVED", t=int(now * 1000), rms=rms), sim=True)
        prev = state
        if seq % 10 == 0:
            idx = sum(rms > x for x in (0.02, 0.05, 0.10, 0.20))
            await handle(Vit(type="vit", seq=vseq, t=int(now * 1000), hr=72 + int(3 * math.sin(now / 5)), spo2=97, q="ok",
                             finger=True, rms=round(rms, 3), idx=idx, state=state, id=eid), sim=True); vseq += 1

async def status_loop():
    while True:
        await asyncio.sleep(1); await bcast(status_msg())

@asynccontextmanager
async def lifespan(_):
    tasks = [asyncio.create_task(status_loop())] + ([asyncio.create_task(simulator())] if SIM else [])
    yield
    for t in tasks: t.cancel()
    if hub.rec: hub.rec.close(); hub.rec = None

app = FastAPI(title="Tremor wearable backend", version=VERSION, lifespan=lifespan)
app.add_middleware(CORSMiddleware, allow_methods=["GET", "POST"],
                   allow_origins=os.getenv("CORS_ORIGINS", "http://localhost:8000,http://127.0.0.1:8000").split(","))

# ------------------------------------------------------------------ routes
@app.get("/")
def index():
    f = ROOT / "frontend" / "index.html"
    if not f.exists(): raise HTTPException(404, "frontend/index.html missing")
    return FileResponse(f)

@app.get("/health")
def health():
    state, age = device_state()
    return {"status": "ok", "server": VERSION, "schema": SCHEMA_V, "device": state, "last_packet_age_s": None if age is None else round(age, 1),
            "simulator_enabled": SIM, "recording": hub.rec_name, "counts": hub.counts, "lost_imu_batches": hub.lost}

@app.get("/api/events")
def events(): return list(hub.events)

REC_RE = re.compile(r"^session_\d{8}_\d{6}(_sim)?\.jsonl$")

@app.post("/api/recording/start")
def rec_start():
    if hub.rec: raise HTTPException(409, "already recording")
    name = time.strftime("session_%Y%m%d_%H%M%S") + ("_sim" if hub.sim_active else "") + ".jsonl"
    hub.rec = open(DATA / name, "w", buffering=1, encoding="utf-8"); hub.rec_name = name
    return {"recording": name}

@app.post("/api/recording/stop")
def rec_stop():
    if not hub.rec: raise HTTPException(409, "not recording")
    hub.rec.close(); name = hub.rec_name; hub.rec, hub.rec_name = None, None
    return {"saved": name}

@app.get("/api/recordings")
def recordings():
    return [{"name": p.name, "bytes": p.stat().st_size} for p in sorted(DATA.glob("session_*.jsonl"), reverse=True) if REC_RE.match(p.name)]

@app.get("/api/recordings/{name}")
def recording(name: str, format: Literal["jsonl", "csv"] = "jsonl"):
    p = DATA / name
    if not REC_RE.match(name) or not p.is_file(): raise HTTPException(404, "no such recording")
    if format == "jsonl":
        return Response(p.read_text(encoding="utf-8"), media_type="application/x-ndjson",
                        headers={"Content-Disposition": f'attachment; filename="{name}"'})
    out = io.StringIO(); w = csv.writer(out); w.writerow(["t_ms", "ax_g", "ay_g", "az_g", "gx_dps", "gy_dps", "gz_dps", "simulated"])
    for line in p.read_text(encoding="utf-8").splitlines():
        d = json.loads(line)
        if d.get("type") == "imu":
            for i, s in enumerate(d["s"]): w.writerow([round(d["t"] + i * 1000 / d["fs"], 1)] + s + [d["sim"]])
    return Response(out.getvalue(), media_type="text/csv", headers={"Content-Disposition": f'attachment; filename="{name[:-6]}.csv"'})

@app.websocket("/ws/dashboard")
async def dashboard(ws: WebSocket):
    await ws.accept(); hub.ui.add(ws)
    await ws.send_text(json.dumps({"type": "snapshot", "hello": hub.hello, "vit": hub.vit, "events": list(hub.events)}))
    await ws.send_text(json.dumps(status_msg()))
    try:
        while True: await ws.receive_text()
    except WebSocketDisconnect: pass
    finally: hub.ui.discard(ws)

@app.websocket("/ws/telemetry")
async def telemetry(ws: WebSocket, token: str = Query("")):
    if TOKEN and token != TOKEN:
        await ws.close(code=4401); return
    await ws.accept()
    hub.dev, hub.sim_active, hub.last_seq, hub.hello = ws, False, None, None
    hub.buf.clear(); print("ESP32 connected")
    try:
        while True:
            txt = await ws.receive_text()
            try: m = adapter.validate_python(json.loads(txt))
            except (ValueError, ValidationError) as e:
                hub.counts["bad"] += 1; print("rejected packet:", str(e)[:120]); continue
            await handle(m)
    except WebSocketDisconnect: pass
    finally:
        if hub.dev is ws: hub.dev = None
        print("ESP32 disconnected"); await bcast(status_msg())

if __name__ == "__main__":
    import uvicorn
    print(f"Tremor backend {VERSION} on http://{HOST}:{PORT}  (simulator: {'ON' if SIM else 'off'})")
    uvicorn.run(app, host=HOST, port=PORT, log_level="info")
