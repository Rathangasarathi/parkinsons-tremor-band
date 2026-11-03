export type DeviceState = 'connected' | 'simulated' | 'stale' | 'disconnected';

export type AlertState = 'NORMAL' | 'PENDING' | 'ACTIVE' | 'ACKED';

export type FingerQuality = 'ok' | 'no_finger' | 'settling' | 'no_sensor';

export interface StatusMessage {
  type: 'status';
  device: DeviceState;
  age: number | null;
  sim: boolean;
  recording: string | null;
  lost: number;
  counts: {
    imu: number;
    vit: number;
    evt: number;
    bad: number;
  };
  server: string;
  schema: number;
}

export interface VitalsMessage {
  type: 'vit';
  seq: number;
  t: number;
  hr: number | null;
  spo2: number | null;
  q: FingerQuality;
  finger: boolean;
  rms: number;
  idx: number;
  state: AlertState;
  id: number;
  late: number;
  sim?: boolean;
}

export interface EventMessage {
  type: 'evt';
  id: number;
  state: 'ACTIVE' | 'ACKNOWLEDGED' | 'RESOLVED';
  t: number;
  rms: number;
  buffered?: boolean;
  sim?: boolean;
  rx?: number;
}

export interface AnalysisMessage {
  type: 'analysis';
  f: number[];
  p: number[];
  dom: number;
  bp: number;
  amp: number;
  band: [number, number];
  sim?: boolean;
}

export interface MLFeatures {
  domfreq: number;
  bp_4_6: number;
  bp_3_12: number;
  bp_low: number;
  rms_acc: number;
  p2p_acc: number;
  rms_gyr: number;
  conc: number;
  [key: string]: number;
}

export interface MLPrediction {
  type: 'ml';
  label: string;
  feat: MLFeatures;
  spec: string;
  sim?: boolean;
  received_at?: number;
}

export interface ImuBatchMessage {
  type: 'imu';
  seq: number;
  t: number;
  fs: number;
  s: number[][]; // [ax, ay, az, gx, gy, gz]
  sim?: boolean;
}

export interface SnapshotMessage {
  type: 'snapshot';
  hello?: Record<string, unknown> | null;
  vit?: VitalsMessage | null;
  events: EventMessage[];
  ml?: MLPrediction | null;
}

export type WebSocketMessage =
  | StatusMessage
  | VitalsMessage
  | EventMessage
  | AnalysisMessage
  | MLPrediction
  | ImuBatchMessage
  | SnapshotMessage;

export interface RecordingItem {
  name: string;
  bytes: number;
}

export interface ModelStatusResponse {
  loaded: boolean;
  version: string | null;
  load_error: string | null;
  inference_errors: number;
  last_prediction: MLPrediction | null;
}

export interface ModelMetricsResponse {
  accuracy?: number;
  f1?: number;
  precision?: number;
  recall?: number;
  auc?: number;
  samples?: number;
  folds?: number;
  [key: string]: unknown;
}

