#pragma once
// All tunable settings in one place. Pins are PROVISIONAL until soldered and verified
// (see hardware/wiring.md). Wi-Fi/server details live in secrets.h (not committed).
#define FW_VERSION "1.0.0"
#define DEVICE_ID  "wrist-01"

// ---- Pins (ESP32 DevKit V1) ----
#define PIN_SDA 21      // I2C data  (MPU6050, MAX30102, OLED)
#define PIN_SCL 22      // I2C clock
#define PIN_BTN 4       // acknowledge button to GND (INPUT_PULLUP)
#define PIN_BUZ 25      // -> 1k -> NPN base (low-side buzzer driver)
#define PIN_LED 2       // on-board LED, mirrors the alarm

// ---- OLED ----
#define OLED_W 128
#define OLED_H 32       // use 64 if your module is 128x64
#define OLED_ADDR 0x3C  // confirm with tools/i2c_scanner

// ---- Sampling / alerting ----
#define SAMPLE_US 10000          // 100 Hz
#define BATCH 10                 // samples per Wi-Fi packet (10 packets/s)
#define MAX_FINGER_IR 50000      // IR level above which a finger is assumed present
#define HOLD_MS  3000            // index >= 3 must persist this long before ALERT
#define CLEAR_MS 5000            // index <= 1 must persist this long to resolve
// Placeholder thresholds on band-passed (2-12 Hz) RMS acceleration, in g.
// NOT clinically validated: tune from your own recordings.
static const float RMS_T[4] = {0.02f, 0.05f, 0.10f, 0.20f};
