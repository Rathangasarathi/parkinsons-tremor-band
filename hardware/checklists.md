# Soldering and test checklists
Keep the battery **disconnected** during all soldering and continuity checks.

## Soldering (one section at a time; tick only when verified)
- [ ] Photo/marking of each module and the transistor checked against `wiring.md`
- [ ] Shared rails: 3V3, GND, SDA, SCL joints inspected (no bridges, no cold joints, no stray strands)
- [ ] Continuity: 3V3↔GND is **open** (no short) before powering
- [ ] Transistor legs identified from datasheet, then soldered; diode orientation checked
- [ ] Slide switch common/outer pin found by continuity; button wired GPIO4–GND
- [ ] Power only from USB first; measure 3V3 at each module

## Test sequence (record result and date)
| # | Test | Pass when |
|---|---|---|
| T1 | `tools/i2c_scanner`, one module at a time | 0x68 / 0x3C(or 0x3D) / 0x57 found; all three together |
| T2 | Upload firmware, Serial 115200 | OLED, MPU6050, MAX30102 "OK"; `WiFi OK, IP` |
| T3 | Backend `/health` from phone browser | `status: ok` |
| T4 | Dashboard with real device | Device connected; plots live; `lost` stays ~0; `late` low |
| T5 | Shake 4–6 Hz for 3 s | PENDING → ALERT ACTIVE, LED blinks |
| T6 | Touch GPIO4 wire to GND (or button) | ACKED, LED/buzzer silent, event stays logged, monitoring continues |
| T7 | Buzzer through NPN | Beeps only during ACTIVE; transistor not hot |
| T8 | Stop the backend mid-run | OLED `Wi-Fi ok, no server`; alert still works; dashboard pill goes stale/disconnected; events queued then flushed on reconnect |
| T9 | Fingertip on MAX30102 | HR/SpO₂ appear after ~10 s, `---` when removed |
| T10 | Recording start/stop, CSV download | Rows present; simulated files end in `_sim` |
| T11 | Battery stage (only after power path verified) | 3V3 stable under Wi-Fi + buzzer; no heating; no brownout |
