// Tremor-monitoring wearable firmware v1.0.0 (ESP32 DevKit V1, Arduino-ESP32 3.x)
// Engineering prototype - NOT a diagnostic device. The 0-4 index is an uncalibrated
// "tremor-like movement index", not a clinical scale.
// Libraries: WebSockets (Markus Sattler), Adafruit SSD1306, Adafruit GFX,
//            SparkFun MAX3010x. Board: "ESP32 Dev Module".
// Local sensing, OLED, alert logic, button and buzzer never depend on Wi-Fi.
#include <Wire.h>
#include <WiFi.h>
#include <WebSocketsClient.h>
#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>
#include "MAX30105.h"
#include "spo2_algorithm.h"
#include "config.h"
#include "secrets.h"

enum State { S_NORMAL, S_PENDING, S_ACTIVE, S_ACKED };
const char* STN[] = {"NORMAL", "PENDING", "ACTIVE", "ACKED"};
State st = S_NORMAL; uint32_t tPend = 0, tLow = 0, evtId = 0;

Adafruit_SSD1306 oled(OLED_W, OLED_H, &Wire, -1, 400000UL, 400000UL);
WebSocketsClient ws; bool wsUp = false, needHello = false;
MAX30105 pox;
bool mpuOK = false, oledOK = false, maxOK = false; int mpuWho = -1;
char tx[1200];

// ---------------- I2C helpers + MPU6050 (100 Hz, +-4 g, +-500 dps, DLPF 44 Hz) ----------------
int rd8(uint8_t a, uint8_t r) {
  Wire.beginTransmission(a); Wire.write(r);
  if (Wire.endTransmission(false) != 0) return -1;
  if (Wire.requestFrom(a, (uint8_t)1) != 1) return -1;
  return Wire.read();
}
void mpuW(uint8_t r, uint8_t v) { Wire.beginTransmission(0x68); Wire.write(r); Wire.write(v); Wire.endTransmission(); }
float gb[3] = {0, 0, 0};
bool mpuRead(float* o) {            // ax ay az (g), gx gy gz (dps)
  Wire.beginTransmission(0x68); Wire.write(0x3B);
  if (Wire.endTransmission(false) != 0) return false;
  if (Wire.requestFrom((uint8_t)0x68, (uint8_t)14) != 14) return false;
  int16_t v[7];
  for (int i = 0; i < 7; i++) { uint8_t h = Wire.read(); uint8_t l = Wire.read(); v[i] = (int16_t)((h << 8) | l); }
  for (int i = 0; i < 3; i++) o[i] = v[i] / 8192.0f;
  for (int i = 0; i < 3; i++) o[3 + i] = v[4 + i] / 65.5f - gb[i];
  return true;
}

// ---------------- local tremor-like feature: band-pass (~2-12 Hz) RMS ----------------
const float DT = 0.01f;
float aHP = DT / (1.0f / (2 * PI * 2.0f) + DT), aLP = DT / (1.0f / (2 * PI * 12.0f) + DT);
float slow[3], fast[3], msq = 0, rms = 0; bool first = true; int idx = 0;
void feature(const float* a) {
  float e = 0;
  for (int i = 0; i < 3; i++) {
    if (first) slow[i] = a[i];
    slow[i] += aHP * (a[i] - slow[i]);
    fast[i] += aLP * ((a[i] - slow[i]) - fast[i]);
    e += fast[i] * fast[i];
  }
  first = false;
  msq += 0.01f * (e - msq); rms = sqrtf(msq);          // ~1 s window
  idx = (rms > RMS_T[0]) + (rms > RMS_T[1]) + (rms > RMS_T[2]) + (rms > RMS_T[3]);
}

// ---------------- MAX30102 (non-blocking; values only when finger present and valid) ----------------
uint32_t irB[100], redB[100]; int mI = 0;
int32_t sp2, hr; int8_t vSp2, vHr; bool finger = false; int shHR = -1, shSp2 = -1;
void maxPoll() {
  pox.check();
  while (pox.available()) {
    uint32_t r = pox.getFIFORed(), ir = pox.getFIFOIR(); pox.nextSample();
    finger = ir > MAX_FINGER_IR;
    if (!finger) { shHR = shSp2 = -1; }
    redB[mI] = r; irB[mI] = ir; mI++;
    if (mI == 100) {
      maxim_heart_rate_and_oxygen_saturation(irB, 100, redB, &sp2, &vSp2, &hr, &vHr);
      memmove(redB, redB + 25, 75 * 4); memmove(irB, irB + 25, 75 * 4); mI = 75;
      shHR  = (finger && vHr  && hr  >= 40 && hr  <= 180) ? hr  : -1;
      shSp2 = (finger && vSp2 && sp2 >= 80 && sp2 <= 100) ? sp2 : -1;
    }
  }
}

// ---------------- events: small offline queue, flushed when the server link returns ----------------
struct Ev { uint32_t id, t; uint8_t s; float rms; };
const char* EVN[] = {"ACTIVE", "ACKNOWLEDGED", "RESOLVED"};
Ev eq[16]; uint8_t eN = 0, eH = 0;
void pushEv(uint8_t s) {
  if (eN == 16) { eH = (eH + 1) % 16; eN--; }            // drop oldest
  eq[(eH + eN) % 16] = {evtId, millis(), s, rms}; eN++;
}
void flushEv() {
  while (wsUp && eN) {
    Ev& e = eq[eH];
    int n = snprintf(tx, sizeof(tx), "{\"v\":1,\"type\":\"evt\",\"id\":%lu,\"state\":\"%s\",\"t\":%lu,\"rms\":%.3f,\"buffered\":%s}",
                     (unsigned long)e.id, EVN[e.s], (unsigned long)e.t, e.rms, (millis() - e.t > 1500) ? "true" : "false");
    ws.sendTXT(tx, n); eH = (eH + 1) % 16; eN--;
  }
}

// ---------------- telemetry ----------------
uint32_t imuSeq = 0, vitSeq = 0;
float bat[BATCH][6]; int bn = 0; uint32_t bT0 = 0;
void sendHello() {
  int n = snprintf(tx, sizeof(tx), "{\"v\":1,\"type\":\"hello\",\"device\":\"%s\",\"fw\":\"%s\",\"who\":%d,\"sensors\":{\"mpu\":%s,\"max\":%s,\"oled\":%s}}",
                   DEVICE_ID, FW_VERSION, mpuWho, mpuOK ? "true" : "false", maxOK ? "true" : "false", oledOK ? "true" : "false");
  ws.sendTXT(tx, n); needHello = false;
}
void sendBatch() {
  if (wsUp) {
    int n = snprintf(tx, sizeof(tx), "{\"v\":1,\"type\":\"imu\",\"seq\":%lu,\"t\":%lu,\"fs\":100,\"s\":[", (unsigned long)imuSeq, (unsigned long)bT0);
    for (int i = 0; i < bn; i++)
      n += snprintf(tx + n, sizeof(tx) - n, "%s[%.3f,%.3f,%.3f,%.1f,%.1f,%.1f]", i ? "," : "",
                    bat[i][0], bat[i][1], bat[i][2], bat[i][3], bat[i][4], bat[i][5]);
    n += snprintf(tx + n, sizeof(tx) - n, "]}");
    ws.sendTXT(tx, n);
  }
  imuSeq++; bn = 0;
}
uint32_t lateCnt = 0, tVit = 0;
void vitStep() {
  if (millis() - tVit < 1000) return;
  tVit = millis();
  if (!wsUp) return;
  char h[8], s[8];
  if (shHR > 0) snprintf(h, 8, "%d", shHR); else strcpy(h, "null");     // invalid -> null, never a fake number
  if (shSp2 > 0) snprintf(s, 8, "%d", shSp2); else strcpy(s, "null");
  const char* q = !maxOK ? "no_sensor" : !finger ? "no_finger" : (shHR > 0 && shSp2 > 0) ? "ok" : "settling";
  int n = snprintf(tx, sizeof(tx), "{\"v\":1,\"type\":\"vit\",\"seq\":%lu,\"t\":%lu,\"hr\":%s,\"spo2\":%s,\"q\":\"%s\",\"finger\":%s,\"rms\":%.3f,\"idx\":%d,\"state\":\"%s\",\"id\":%lu,\"late\":%lu}",
                   (unsigned long)vitSeq++, (unsigned long)millis(), h, s, q, finger ? "true" : "false", rms, idx, STN[st], (unsigned long)evtId, (unsigned long)lateCnt);
  ws.sendTXT(tx, n);
}
void wsEvent(WStype_t t, uint8_t*, size_t) {
  if (t == WStype_CONNECTED) { wsUp = true; needHello = true; }
  if (t == WStype_DISCONNECTED) wsUp = false;
}
void wifiWatch() {
  static uint32_t t = 0; static bool had = false;
  bool up = WiFi.status() == WL_CONNECTED;
  if (up && !had) { had = true; Serial.printf("WiFi OK, IP %s\n", WiFi.localIP().toString().c_str()); }
  if (!up) { had = false; if (millis() - t > 10000) { t = millis(); WiFi.disconnect(); WiFi.begin(WIFI_SSID, WIFI_PASS); } }
}

// ---------------- alert state machine, button, outputs ----------------
void alertStep() {
  uint32_t now = millis();
  if (st == S_NORMAL && idx >= 3) { st = S_PENDING; tPend = now; }
  else if (st == S_PENDING) {
    if (idx < 3) st = S_NORMAL;
    else if (now - tPend >= HOLD_MS) { st = S_ACTIVE; evtId++; pushEv(0); }
  } else if (st == S_ACTIVE || st == S_ACKED) {
    if (idx <= 1) { if (!tLow) tLow = now; if (now - tLow >= CLEAR_MS) { pushEv(2); st = S_NORMAL; tLow = 0; } }
    else tLow = 0;
  }
}
void buttonStep() {
  static bool last = HIGH; static uint32_t t = 0;
  bool r = digitalRead(PIN_BTN);
  if (r != last && millis() - t > 30) {                 // 30 ms debounce
    t = millis(); last = r;
    if (r == LOW && st == S_ACTIVE) { st = S_ACKED; pushEv(1); }   // silence only; event and monitoring continue
  }
}
void outputStep() {
  bool on = (st == S_ACTIVE) && ((millis() / 300) % 2);
  digitalWrite(PIN_BUZ, on); digitalWrite(PIN_LED, on);
}
void oledStep() {
  static uint32_t t = 0;
  if (!oledOK || millis() - t < 500) return;
  t = millis();
  oled.clearDisplay(); oled.setTextSize(1); oled.setTextColor(SSD1306_WHITE); oled.setCursor(0, 0);
  if (shHR > 0) oled.printf("HR %d ", shHR); else oled.print("HR --- ");
  if (shSp2 > 0) oled.printf("SpO2 %d", shSp2); else oled.print("SpO2 ---");
  oled.setCursor(0, 8);  oled.printf("Idx %d  rms %.3f", idx, rms);
  oled.setCursor(0, 16); oled.print(STN[st]);
  oled.setCursor(0, 24);
  oled.print(wsUp ? "Server: linked" : (WiFi.status() == WL_CONNECTED ? "Wi-Fi ok, no server" : "Wi-Fi: offline"));
  oled.display();
}

// ---------------- setup / loop ----------------
void setup() {
  Serial.begin(115200);
  pinMode(PIN_BTN, INPUT_PULLUP); pinMode(PIN_LED, OUTPUT); pinMode(PIN_BUZ, OUTPUT);
  digitalWrite(PIN_BUZ, LOW);
  Wire.begin(PIN_SDA, PIN_SCL); Wire.setClock(400000);

  oledOK = oled.begin(SSD1306_SWITCHCAPVCC, OLED_ADDR);
  Serial.printf("OLED: %s\n", oledOK ? "OK" : "NOT FOUND");

  Wire.beginTransmission(0x68); mpuOK = (Wire.endTransmission() == 0);
  if (mpuOK) {
    mpuWho = rd8(0x68, 0x75);                            // 0x68 genuine; clones may differ (e.g. 0x70)
    mpuW(0x6B, 0x00); delay(100); mpuW(0x1A, 0x03); mpuW(0x1B, 0x08); mpuW(0x1C, 0x08);
    Serial.printf("MPU6050: OK (WHO_AM_I=0x%02X) - keep still for 2 s\n", mpuWho);
    float s[6], sum[3] = {0, 0, 0}; int n = 0;
    for (int i = 0; i < 200; i++) { if (mpuRead(s)) { for (int k = 0; k < 3; k++) sum[k] += s[3 + k]; n++; } delay(10); }
    if (n) for (int k = 0; k < 3; k++) gb[k] = sum[k] / n;
  } else Serial.println("MPU6050: NOT FOUND - no motion data or alerts");

  maxOK = pox.begin(Wire, I2C_SPEED_FAST);
  if (maxOK) pox.setup(60, 4, 2, 100, 411, 4096);        // 25 effective samples/s
  Serial.printf("MAX30102: %s\n", maxOK ? "OK" : "NOT FOUND (HR/SpO2 report null)");

  WiFi.mode(WIFI_STA); WiFi.setAutoReconnect(true); WiFi.begin(WIFI_SSID, WIFI_PASS);   // non-blocking
  String path = "/ws/telemetry";
  if (strlen(DEVICE_TOKEN)) path += String("?token=") + DEVICE_TOKEN;
  ws.begin(SERVER_HOST, SERVER_PORT, path);
  ws.onEvent(wsEvent); ws.setReconnectInterval(3000); ws.enableHeartbeat(15000, 3000, 2);
}

uint32_t nextUs = 0;
void sampleStep() {
  uint32_t now = micros();
  if (nextUs == 0) nextUs = now;
  if ((int32_t)(now - nextUs) < 0) return;
  if ((int32_t)(now - nextUs) > SAMPLE_US) { lateCnt++; nextUs = now; }   // missed a slot
  nextUs += SAMPLE_US;
  float s[6];
  if (!mpuOK || !mpuRead(s)) return;
  feature(s); alertStep();
  if (bn == 0) bT0 = millis();
  memcpy(bat[bn++], s, sizeof(s));
  if (bn == BATCH) sendBatch();
}
void loop() {
  ws.loop(); wifiWatch();
  if (maxOK) maxPoll();
  sampleStep(); buttonStep(); outputStep();
  if (wsUp) { if (needHello) sendHello(); flushEv(); }
  vitStep(); oledStep();
}
