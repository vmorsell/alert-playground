import type { MetricType } from '../types/metrics';

export interface MetricConfig {
  id: MetricType;
  name: string;
  unit: string;
  baseValue: number;
  variance: number;
  stepSizes: {
    small: number;
    large: number;
  };
  color: string;
  description?: string;
}

export const METRIC_CONFIGS: Record<MetricType, MetricConfig> = {
  errorRate: {
    id: 'errorRate',
    name: 'Error Rate',
    unit: '%',
    baseValue: 2,
    variance: 1,
    stepSizes: {
      small: 0.5,
      large: 2.0,
    },
    color: '#ef4444',
    description: 'Percentage of requests that result in errors',
  },
  p95ResponseTime: {
    id: 'p95ResponseTime',
    name: 'P95 Response Time',
    unit: 'ms',
    baseValue: 150,
    variance: 50,
    stepSizes: {
      small: 10,
      large: 50,
    },
    color: '#f59e0b',
    description: '95th percentile of response times',
  },
  cpuUsage: {
    id: 'cpuUsage',
    name: 'CPU Usage',
    unit: '%',
    baseValue: 45,
    variance: 15,
    stepSizes: {
      small: 5,
      large: 20,
    },
    color: '#3b82f6',
    description: 'Percentage of CPU resources being used',
  },
  memoryUsage: {
    id: 'memoryUsage',
    name: 'Memory Usage',
    unit: '%',
    baseValue: 65,
    variance: 10,
    stepSizes: {
      small: 5,
      large: 15,
    },
    color: '#10b981',
    description: 'Percentage of memory resources being used',
  },
};

// Helper functions to work with metric configs
export const getMetricConfig = (metricType: MetricType): MetricConfig => {
  return METRIC_CONFIGS[metricType];
};

export const getAllMetricConfigs = (): MetricConfig[] => {
  return Object.values(METRIC_CONFIGS);
};

export const getMetricStepSizes = (metricType: MetricType) => {
  return METRIC_CONFIGS[metricType].stepSizes;
};

export const getMetricColor = (metricType: MetricType): string => {
  return METRIC_CONFIGS[metricType].color;
}; 