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

export interface Metric {
  id: string;
  name: string;
  unit: string;
  dataPoints: MetricDataPoint[];
  stats: MetricStats;
  baseValue: number;
  variance: number;
  adjustment: number; // For manual adjustments
}

export type MetricType = 'errorRate' | 'p95ResponseTime' | 'cpuUsage' | 'memoryUsage'; 