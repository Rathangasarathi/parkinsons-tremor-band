# Hardware: pin map, wiring and power

Status tags: **CONFIRMED** (seen working in a test), **PROVISIONAL** (design choice, verify), **NOT VERIFIED**.

## Status
| Item | Status |
|---|---|
| OLED, MPU6050, MAX30102 respond on I²C on jumper wires | CONFIRMED (boot log, 2 Nov 2026) |
| MPU6050 WHO_AM_I earlier read 0x70 (not 0x68) | Likely a clone/MPU6500-type; works with this firmware; firmware now reports it in `hello` |
| GPIO map below | PROVISIONAL (freeze after soldering) |
| Buzzer: 5 V, current, exact model (2501 vs 2510) | rating NOT VERIFIED |
| NPN transistor model/pinout | NOT VERIFIED (read the part number first) |
| Battery type/protection, charger, 5 V boost, slide-switch rating | NOT VERIFIED |
| Soldering | planned, not confirmed done |

## Pin map (PROVISIONAL)
| Signal | ESP32 pin | Notes |
|---|---|---|
| I²C SDA | GPIO21 | shared by MPU6050, MAX30102, OLED |
| I²C SCL | GPIO22 | shared |
| Ack button | GPIO4 → button → GND | `INPUT_PULLUP`, pressed = LOW |
| Buzzer driver | GPIO25 → 1 kΩ → NPN base | HIGH = buzzer on |
| Alarm LED | GPIO2 (on-board) | mirrors the buzzer |
| Sensors' power | 3V3 and GND | never 5 V / VIN |

## Module wiring (all I²C modules in parallel)
| Module pin | To |
|---|---|
| VCC / VIN | ESP32 3V3 |
| GND | GND |
| SDA | GPIO21 |
| SCL | GPIO22 |
MPU6050: leave AD0, INT, XDA, XCL open (address 0x68). MAX30102: leave INT open (address 0x57). OLED: read its silkscreen (VCC/GND order varies); address 0x3C or 0x3D.

## Buzzer driver (low-side NPN, 5 V buzzer)
```
5 V rail (VIN) ──── buzzer + ─┐
                              buzzer −  ── collector
GPIO25 ── 1 kΩ ── base          emitter ── GND   (same GND as ESP32)
Diode across buzzer (recommended): cathode (stripe) to the + side, anode to the − side
```
- **Read the transistor's printed part number and its datasheet before soldering**: BC547, 2N2222 and others have different leg orders. Do not guess.
- Check the buzzer: briefly touch + to VIN and − to GND to confirm it sounds and find its + leg. Measure its current if you have a meter in series (NOT VERIFIED until done). 1 kΩ gives ~2.6 mA base drive: fine for typical small buzzers (tens of mA).
- The diode matters for electromagnetic buzzers and does no harm on piezo ones if oriented correctly.
- Never drive the buzzer straight from a GPIO or power it from 3V3.

## Power design (recommended; NOT VERIFIED until measured)
**Stage A (use now, safe):** power the ESP32 from USB or a USB power bank. No battery in the circuit.
**Stage B (portable):**
```
Li-ion cell ─ protected charger module (charge via its USB) ─ OUT+ ─ slide switch ─ 5 V boost ─ ESP32 VIN
                                                                          └ buzzer + (5 V)
ESP32 3V3 ─ MPU6050, MAX30102, OLED
```
- A 3.3 V **buck** converter can't hold 3.3 V once the cell falls below ~3.4 V, and a 3.3 V rail starves a 5 V buzzer. A fixed **5 V boost** feeding VIN lets the DevKit's own regulator make 3V3 and gives the buzzer its 5 V.
- Needed parts you didn't list: a single-cell charger/protection module matched to your cell, and a 5 V boost (≥1 A). **Set/measure the boost output with a multimeter before connecting the ESP32** (adjustable modules often ship at another voltage).
- Identify the cell first (cylindrical Li-ion vs pouch, protected or not). Never connect a cell directly to 3V3 or to a GPIO. Don't charge while worn.
- SS12D00G3 slide switch: confirm common/outer pins by continuity, and check its current rating against the load; boost input current at low battery voltage can exceed the output-side current. If the rating is marginal, do not use it in the battery path until verified.
- Charger wiring depends on the exact module; follow its datasheet.
