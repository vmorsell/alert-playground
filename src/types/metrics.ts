export interface MetricDataPoint {
  timestamp: Date;
  value: number;
}

export interface MetricStats {
  current: number;
  rolling1Min: {
    avg: number;
    min: number;
    max: number;
  };
  rolling5Min: {
    avg: number;
    min: number;
    max: number;
  };
  rolling15Min: {
    avg: number;
    min: number;
    max: number;
  };
}

export type AlertPriority = 'P0' | 'P1' | 'P2' | 'P3' | 'P4';

export interface AlertThreshold {
  priority: AlertPriority;
  threshold: number;
  operator: 'greater_than' | 'less_than';
  description: string;
  resolveDelaySeconds?: number; // Optional resolve delay to prevent flapping
}

export interface AlertState {
  activeThresholds: ThresholdAlertState[];
  isAlerting: boolean; // true if any threshold is triggered
}

export interface ThresholdAlertState {
  threshold: AlertThreshold;
  isTriggered: boolean;
  triggeredAt?: Date;
  pendingResolveAt?: Date; // When the threshold became untriggered (for resolve delay)
}

export interface IncidentIoConfig {
  enabled: boolean;
  token: string;
  alertSourceConfigId: string;
  metadata: {
    team?: string;
    service?: string;
    [key: string]: string | number | boolean | undefined;
  };
}

export interface Metric {
  displayName: string;
  unit: string;
  dataPoints: MetricDataPoint[];
  stats: MetricStats;
  baseValue: number;
  variance: number;
  adjustment: number; // For manual adjustments
  alertState: AlertState;
} 