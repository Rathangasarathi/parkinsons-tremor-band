import { useState, useEffect, useRef, useCallback } from 'react';
import {
  VitalsMessage,
  EventMessage,
  AnalysisMessage,
  MLPrediction,
  WebSocketMessage,
  RecordingItem,
  ModelStatusResponse,
  ModelMetricsResponse,
  DeviceState,
} from '../types';

export function useDashboardData() {
  const [wsConnected, setWsConnected] = useState(false);
  const [deviceState, setDeviceState] = useState<DeviceState>('disconnected');
  const [deviceAge, setDeviceAge] = useState<number | null>(null);
  const [isSimulated, setIsSimulated] = useState(false);
  const [recordingName, setRecordingName] = useState<string | null>(null);
  const [lostBatches, setLostBatches] = useState<number>(0);
  const [serverVersion, setServerVersion] = useState<string>('1.0.0');

  const [vitals, setVitals] = useState<VitalsMessage | null>(null);
  const [events, setEvents] = useState<EventMessage[]>([]);
  const [analysis, setAnalysis] = useState<AnalysisMessage | null>(null);
  const [mlPrediction, setMlPrediction] = useState<MLPrediction | null>(null);

  const [recordings, setRecordings] = useState<RecordingItem[]>([]);
  const [modelStatus, setModelStatus] = useState<ModelStatusResponse | null>(null);
  const [modelMetrics, setModelMetrics] = useState<ModelMetricsResponse | null>(null);
  const [isActionLoading, setIsActionLoading] = useState(false);

  // Store recent IMU points for high-performance canvas rendering
  const imuBufferRef = useRef<{
    t: number[];
    ax: number[];
    ay: number[];
    az: number[];
    gx: number[];
    gy: number[];
    gz: number[];
  }>({
    t: [],
    ax: [],
    ay: [],
    az: [],
    gx: [],
    gy: [],
    gz: [],
  });

  const lastServerPingRef = useRef<number>(Date.now());
  const txRef = useRef<number>(0);

  // REST: Fetch recordings
  const fetchRecordings = useCallback(async () => {
    try {
      const res = await fetch('/api/recordings');
      if (res.ok) {
        const data: RecordingItem[] = await res.json();
        setRecordings(data);
      }
    } catch {
      // ignore network errors during reconnect
    }
  }, []);

  // REST: Fetch model status
  const fetchModelStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/model/status');
      if (res.ok) {
        const data: ModelStatusResponse = await res.json();
        setModelStatus(data);
        if (data.last_prediction && !mlPrediction) {
          setMlPrediction(data.last_prediction);
        }
      }
    } catch {
      // ignore
    }
  }, [mlPrediction]);

  // REST: Fetch model metrics
  const fetchModelMetrics = useCallback(async () => {
    try {
      const res = await fetch('/api/model/metrics');
      if (res.ok) {
        const data = await res.json();
        setModelMetrics(data);
      }
    } catch {
      // optional endpoint
    }
  }, []);

  // REST: Start recording
  const startRecording = async () => {
    setIsActionLoading(true);
    try {
      await fetch('/api/recording/start', { method: 'POST' });
      await fetchRecordings();
    } finally {
      setIsActionLoading(false);
    }
  };

  // REST: Stop recording
  const stopRecording = async () => {
    setIsActionLoading(true);
    try {
      await fetch('/api/recording/stop', { method: 'POST' });
      await fetchRecordings();
    } finally {
      setIsActionLoading(false);
    }
  };

  // WebSocket connection & router
  useEffect(() => {
    let ws: WebSocket | null = null;
    let timer: ReturnType<typeof setTimeout> | null = null;
    let isCancelled = false;

    const connect = () => {
      if (isCancelled) return;
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const host = window.location.host;
      // In dev with vite proxy, /ws maps to ws://localhost:8000
      const wsUrl = `${protocol}//${host}/ws/dashboard`;

      ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        setWsConnected(true);
      };

      ws.onclose = () => {
        setWsConnected(false);
        setDeviceState('disconnected');
        if (!isCancelled) {
          timer = setTimeout(connect, 2000);
        }
      };

      ws.onerror = () => {
        ws?.close();
      };

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data) as WebSocketMessage;
          lastServerPingRef.current = Date.now();

          switch (msg.type) {
            case 'status':
              setDeviceState(msg.device);
              setDeviceAge(msg.age);
              setIsSimulated(msg.sim || msg.device === 'simulated');
              setRecordingName(msg.recording);
              setLostBatches(msg.lost);
              setServerVersion(msg.server);
              break;

            case 'snapshot':
              if (msg.events) setEvents(msg.events);
              if (msg.vit) setVitals(msg.vit);
              if (msg.ml) setMlPrediction(msg.ml);
              break;

            case 'vit':
              setVitals(msg);
              break;

            case 'ml':
              setMlPrediction(msg);
              break;

            case 'analysis':
              setAnalysis(msg);
              break;

            case 'evt':
              setEvents((prev) => [msg, ...prev.slice(0, 99)]);
              break;

            case 'imu': {
              const maxPoints = 500;
              const buf = imuBufferRef.current;
              const n = msg.s.length;
              for (let i = 0; i < n; i++) {
                const row = msg.s[i];
                const tVal = txRef.current + i * 0.01;
                buf.t.push(tVal);
                buf.ax.push(row[0]);
                buf.ay.push(row[1]);
                buf.az.push(row[2]);
                buf.gx.push(row[3]);
                buf.gy.push(row[4]);
                buf.gz.push(row[5]);
              }
              txRef.current += n * 0.01;

              if (buf.t.length > maxPoints) {
                const overflow = buf.t.length - maxPoints;
                buf.t.splice(0, overflow);
                buf.ax.splice(0, overflow);
                buf.ay.splice(0, overflow);
                buf.az.splice(0, overflow);
                buf.gx.splice(0, overflow);
                buf.gy.splice(0, overflow);
                buf.gz.splice(0, overflow);
              }
              break;
            }
          }
        } catch {
          // ignore malformed frame
        }
      };
    };

    connect();

    // Initial REST queries
    fetchRecordings();
    fetchModelStatus();
    fetchModelMetrics();

    const recInterval = setInterval(fetchRecordings, 10000);
    const statusInterval = setInterval(fetchModelStatus, 6000);

    return () => {
      isCancelled = true;
      if (timer) clearTimeout(timer);
      clearInterval(recInterval);
      clearInterval(statusInterval);
      ws?.close();
    };
  }, [fetchRecordings, fetchModelStatus, fetchModelMetrics]);

  return {
    wsConnected,
    deviceState,
    deviceAge,
    isSimulated,
    recordingName,
    lostBatches,
    serverVersion,
    vitals,
    events,
    analysis,
    mlPrediction,
    recordings,
    modelStatus,
    modelMetrics,
    isActionLoading,
    startRecording,
    stopRecording,
    imuBufferRef,
  };
}
