# Tremor-monitoring wearable (engineering prototype)

ESP32 + MPU6050 + MAX30102 + OLED wearable that measures hand motion (tremor-like movement index), heart-rate / SpO₂ **estimates**, raises a local alert (LED/buzzer, acknowledge button) and streams data over Wi-Fi to a laptop-hosted FastAPI backend with a live web dashboard.

> **Not a medical device.** It does not diagnose Parkinson's disease, grade severity or replace clinical assessment. The 0–4 value is an uncalibrated *movement index*; HR/SpO₂ are unvalidated optical estimates.

```
MPU6050 ─┐                                   ┌─ OLED, LED, buzzer (NPN driver), ack button   (work with NO Wi-Fi)
MAX30102 ├─ I²C ─> ESP32 firmware ───────────┤
OLED  ───┘            │ Wi-Fi / WebSocket     └─ event queue (16) flushed when the link returns
                      ▼
          laptop: FastAPI backend (backend/server.py)
            ├─ validates schema v1 (Pydantic), counts rejected packets and lost batches
            ├─ FFT / spectrum, event log, recording (JSONL + CSV export), simulator
            └─ serves the dashboard (frontend/index.html) + /health + REST
```

## Folder layout
| Path | Purpose |
|---|---|
| `firmware/tremor_wearable/` | Arduino sketch. Settings in `config.h`; Wi-Fi/server in `secrets.h` (copy of `secrets.example.h`, git-ignored) |
| `tools/i2c_scanner/` | Run first to confirm each module's I²C address |
| `backend/server.py` | FastAPI app (`python server.py`) |
| `frontend/index.html` | Dashboard (served by the backend, no build step / npm) |
| `hardware/wiring.md`, `hardware/checklists.md` | Pin map, wiring, power design, soldering + test checklists |
| `tests/` | Automated backend tests and a fake ESP32 for end-to-end checks |
| `data/` | Recordings and events (git-ignored) |

## 1. Laptop setup (Windows, PowerShell)
```powershell
cd tremor_wearable
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r backend\requirements.txt
copy .env.example .env          # optional settings
python backend\server.py --simulate      # try the dashboard with LABELLED simulated data
```
Open http://localhost:8000. A purple **SIMULATED DATA** banner shows while the simulator is feeding it. Stop with Ctrl+C. Run without `--simulate` for real hardware (`python backend\server.py`).

**Find your laptop IP** (needed by the ESP32): `ipconfig` → IPv4 Address of the Wi-Fi adapter. It changes when you change networks.
**Firewall** (admin Command Prompt, once): `netsh advfirewall firewall add rule name="tremor8000" dir=in action=allow protocol=TCP localport=8000`, and set the Wi-Fi network profile to **Private**. Never expose port 8000 to the internet.

## 2. Firmware setup (Arduino IDE)
1. Install board package **esp32 by Espressif** (3.x) → board "ESP32 Dev Module".
2. Library Manager: **WebSockets** (Markus Sattler), **Adafruit SSD1306**, **Adafruit GFX Library**, **SparkFun MAX3010x Pulse and Proximity Sensor Library**. (If you also have another MAX30102 library installed, the IDE warns but uses SparkFun's: harmless.)
3. Open `firmware/tremor_wearable/tremor_wearable.ino`. Copy `secrets.example.h` to `secrets.h` and fill in Wi-Fi name (2.4 GHz, no apostrophes/emoji), password and laptop IP. If you set `DEVICE_TOKEN` in `.env`, use the same value here.
4. Check `config.h` (OLED height 32/64, address, pins) → Upload → Serial Monitor 115200.
   Expected: `OLED: OK`, `MPU6050: OK (WHO_AM_I=0x..)`, `MAX30102: OK`, then `WiFi OK, IP ...`.

## 3. Run end to end
Start the backend (without `--simulate`), power the ESP32. The dashboard pill turns **Device connected**; OLED shows `Server: linked`. Test: shake the board at ~4–6 Hz for 3+ s → PENDING → ALERT ACTIVE (LED blinks, buzzer if wired) → touch the GPIO4 wire to GND = acknowledge → hold still ~5 s → resolves. Events appear in the log and `data/events.jsonl`.

## 4. Tests
```powershell
pip install -r tests\requirements-dev.txt
python -m pytest tests -q                       # schema, null handling, bad packets, token, recording, CSV
python backend\server.py                        # terminal 1
python tests\fake_device.py localhost 10        # terminal 2: pretend ESP32 (no hardware)
```
Hardware tests: `hardware/checklists.md`.

## 5. Dashboard behaviour (honesty rules)
HR/SpO₂ show `---` unless the firmware reports a valid value (`null` otherwise) with a quality label. If the device goes silent for 3 s the pill turns **stale**; the alert banner then reads "alert state unknown" rather than showing an old state. Simulated data is always labelled and recorded files carry `_sim`.

## 6. Troubleshooting
| Symptom | Fix |
|---|---|
| `WiFi FAILED` / no IP | Network must be 2.4 GHz (iPhone: Maximize Compatibility); rename hotspot without `’`; retype password; stay on the Personal Hotspot screen |
| Wi-Fi OK, OLED says `Wi-Fi ok, no server` | Wrong `SERVER_HOST`, server not running, or firewall/Public profile; test `http://<laptop-ip>:8000/health` from a phone on the same network |
| Server log: `rejected packet` | Firmware/backend schema mismatch (both v1); dashboard `Link quality` shows lost batches |
| Module missing at boot | Run `tools/i2c_scanner`; recheck 3V3/GND/SDA/SCL; try `Wire.setClock(100000)` |
| `late samples` keeps rising | Wi-Fi/OLED load on I²C; lower OLED rate or report to maintainer |
| Plots empty | Plotly loads from a CDN: laptop needs internet once |
| Buzzer always on / dead | Check transistor pinout and wiring in `hardware/wiring.md` before powering |

## 7. Design decisions vs. the handover
- **Backend/frontend merged:** FastAPI serves the dashboard directly (no Node/npm, one command). The ESP32 uses `/ws/telemetry`; browsers `/ws/dashboard`.
- **Versioned schema + sequence numbers** (Pydantic): invalid sensor values are `null`, never a plausible fake; packet loss is measurable.
- **Wi-Fi connects in the background:** sensing, OLED, alerts and the button start immediately and never wait for Wi-Fi. Events queue (16) while offline and are flushed with a `buffered` flag. High-rate samples are not buffered offline (stated limitation).
- **Power design changed (see `hardware/wiring.md`):** a 5 V buzzer and a 3.7 V cell make a 3.3 V buck-only converter a poor fit (it stops regulating as the cell drains). Recommended path: protected charger module → slide switch → fixed 5 V boost → ESP32 VIN, with the buzzer on the same 5 V rail. Until verified, use USB or a power bank.
- **Simulator** is built into the backend, clearly labelled, and yields to a real device automatically.
- **Optional device token**, CORS limited to local origins, recordings downloadable as JSONL/CSV with path-traversal protection.
- Left out on purpose: BLE (one transport first), battery-voltage readout (no verified divider yet), on-device frequency estimate (laptop FFT provides it), clinical scoring.
