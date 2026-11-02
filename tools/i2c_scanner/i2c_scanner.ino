// STAGE 1 - I2C scanner. Run after wiring EACH module, one at a time.
// Expected: MPU6050 = 0x68 (or 0x69), OLED = 0x3C (or 0x3D), MAX30102 = 0x57
#include <Wire.h>
void setup() {
  Serial.begin(115200);
  Wire.begin(21, 22);          // SDA = GPIO21, SCL = GPIO22
  Wire.setClock(100000);
  delay(500);
}
void loop() {
  int found = 0;
  Serial.println("\nScanning I2C bus...");
  for (uint8_t a = 1; a < 127; a++) {
    Wire.beginTransmission(a);
    if (Wire.endTransmission() == 0) {
      Serial.printf("  device at 0x%02X", a);
      if (a == 0x68 || a == 0x69) Serial.print("  <- MPU6050");
      if (a == 0x3C || a == 0x3D) Serial.print("  <- OLED");
      if (a == 0x57) Serial.print("  <- MAX30102");
      Serial.println();
      found++;
    }
  }
  if (!found) Serial.println("  nothing found - check power/GND/SDA/SCL wires");
  delay(3000);
}
