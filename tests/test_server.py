"""Backend integration tests (no hardware needed).  Run from project root:  python -m pytest tests -q"""
import json, os, sys, tempfile
from pathlib import Path
os.environ["DATA_DIR"] = tempfile.mkdtemp()
sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "backend"))
import pytest
from fastapi.testclient import TestClient
from starlette.websockets import WebSocketDisconnect
import server

HELLO = {"v": 1, "type": "hello", "device": "t", "fw": "x", "who": 112, "sensors": {"mpu": True}}
def imu(seq): return {"v": 1, "type": "imu", "seq": seq, "t": seq * 100, "fs": 100, "s": [[0, 0, 1, 0, 0, 0]] * 10}
VIT = {"v": 1, "type": "vit", "seq": 0, "t": 1, "hr": None, "spo2": None, "q": "no_finger", "finger": False,
       "rms": 0.01, "idx": 0, "state": "NORMAL", "id": 0, "late": 0}

def drain(dash, want, limit=30):
    seen = {}
    for _ in range(limit):
        m = dash.receive_json(); seen.setdefault(m["type"], m)
        if want <= seen.keys(): break
    return seen

def test_health():
    with TestClient(server.app) as c:
        assert c.get("/health").json()["status"] == "ok"

def test_pipeline_null_and_bad_packets_and_gaps():
    with TestClient(server.app) as c, c.websocket_connect("/ws/dashboard") as dash:
        drain(dash, {"snapshot", "status"})
        with c.websocket_connect("/ws/telemetry") as dev:
            for p in (HELLO, imu(1), imu(4), VIT): dev.send_json(p)
            dev.send_text("garbage"); dev.send_json({"type": "vit", "idx": 9})   # malformed -> rejected, link survives
            seen = drain(dash, {"hello", "imu", "vit"})
        assert seen["vit"]["hr"] is None and seen["vit"]["sim"] is False
        h = c.get("/health").json()
        assert h["counts"]["bad"] >= 2 and h["lost_imu_batches"] == 2

def test_token_enforced(monkeypatch):
    monkeypatch.setattr(server, "TOKEN", "abc")
    with TestClient(server.app) as c:
        with pytest.raises(WebSocketDisconnect):
            with c.websocket_connect("/ws/telemetry"): pass
        with c.websocket_connect("/ws/telemetry?token=abc"): pass

def test_recording_and_csv_export():
    with TestClient(server.app) as c:
        name = c.post("/api/recording/start").json()["recording"]
        with c.websocket_connect("/ws/telemetry") as dev: dev.send_json(imu(1)); dev.send_json(VIT)
        c.post("/api/recording/stop")
        assert name in [r["name"] for r in c.get("/api/recordings").json()]
        rows = c.get(f"/api/recordings/{name}?format=csv").text.strip().splitlines()
        assert len(rows) == 11 and rows[0].startswith("t_ms")
        assert c.get("/api/recordings/..%2Fsecret").status_code == 404
