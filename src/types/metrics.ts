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
}

export interface AlertState {
  isAlerting: boolean;
  activePriority?: AlertPriority;
  triggeredThreshold?: AlertThreshold;
  triggeredAt?: Date;
}

export interface Metric {
  id: string;
  name: string;
  unit: string;
  dataPoints: MetricDataPoint[];
  stats: MetricStats;
  baseValue: number;
  variance: number;
  adjustment: number; // For manual adjustments
  alertState: AlertState;
}

export type MetricType = 'errorRate' | 'p95ResponseTime' | 'cpuUsage' | 'memoryUsage'; 