"""Pretend to be the ESP32 for end-to-end testing:  python tests/fake_device.py [host] [seconds]
Sends real-schema packets over the real WebSocket path (labelled as a test device in 'hello')."""
import asyncio, json, math, sys, websockets
host = sys.argv[1] if len(sys.argv) > 1 else "localhost"; secs = float(sys.argv[2]) if len(sys.argv) > 2 else 10
async def main():
    async with websockets.connect(f"ws://{host}:8000/ws/telemetry") as ws:
        await ws.send(json.dumps({"v": 1, "type": "hello", "device": "fake-test-device", "fw": "test", "who": 104, "sensors": {"mpu": True}}))
        for seq in range(int(secs * 10)):
            rows = [[0.1 * math.sin(2 * math.pi * 5 * (seq * .1 + i * .01)), 0, 1, 0, 0, 0] for i in range(10)]
            await ws.send(json.dumps({"v": 1, "type": "imu", "seq": seq, "t": seq * 100, "fs": 100, "s": rows}))
            if seq % 10 == 0:
                await ws.send(json.dumps({"v": 1, "type": "vit", "seq": seq // 10, "t": seq * 100, "hr": None, "spo2": None, "q": "no_finger",
                                          "finger": False, "rms": 0.07, "idx": 2, "state": "NORMAL", "id": 0, "late": 0}))
            await asyncio.sleep(0.1)
asyncio.run(main())
