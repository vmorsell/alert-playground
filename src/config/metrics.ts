import type { MetricType, AlertThreshold, AlertPriority, AlertState } from '../types/metrics';

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
  alertThresholds: AlertThreshold[];
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
    alertThresholds: [
      { priority: 'P0', threshold: 15, operator: 'greater_than', description: 'Error rate critical' },
      { priority: 'P2', threshold: 5, operator: 'greater_than', description: 'Error rate high' },
    ],
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
    alertThresholds: [
      { priority: 'P1', threshold: 1000, operator: 'greater_than', description: 'Response times severely impacted' },
      { priority: 'P3', threshold: 400, operator: 'greater_than', description: 'Response times elevated' },
    ],
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
    alertThresholds: [
      { priority: 'P1', threshold: 90, operator: 'greater_than', description: 'CPU usage critical' },
      { priority: 'P3', threshold: 75, operator: 'greater_than', description: 'CPU usage high' },
    ],
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
    alertThresholds: [
      { priority: 'P1', threshold: 95, operator: 'greater_than', description: 'Memory usage critical' },
      { priority: 'P2', threshold: 85, operator: 'greater_than', description: 'Memory usage high' },
    ],
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

export const getMetricAlertThresholds = (metricType: MetricType): AlertThreshold[] => {
  return METRIC_CONFIGS[metricType].alertThresholds;
};

// Alert priority colors
export const ALERT_COLORS: Record<AlertPriority, string> = {
  P0: '#dc2626', // Red-600 - Critical
  P1: '#ea580c', // Orange-600 - High
  P2: '#d97706', // Amber-600 - Medium
  P3: '#ca8a04', // Yellow-600 - Low
  P4: '#65a30d', // Lime-600 - Info
};

export const NORMAL_COLOR = '#10b981'; // Green-500 - Normal state

// Utility function to evaluate alert state
export const evaluateAlertState = (value: number, thresholds: AlertThreshold[]): AlertState => {
  // Sort thresholds by priority (P0 is highest priority)
  const sortedThresholds = [...thresholds].sort((a, b) => {
    const priorityOrder = { P0: 0, P1: 1, P2: 2, P3: 3, P4: 4 };
    return priorityOrder[a.priority] - priorityOrder[b.priority];
  });

  // Check each threshold starting with highest priority
  for (const threshold of sortedThresholds) {
    const isTriggered = threshold.operator === 'greater_than' 
      ? value > threshold.threshold 
      : value < threshold.threshold;
    
    if (isTriggered) {
      return {
        isAlerting: true,
        activePriority: threshold.priority,
        triggeredThreshold: threshold,
        triggeredAt: new Date(),
      };
    }
  }

  return {
    isAlerting: false,
  };
};

// Get color based on alert state
export const getAlertColor = (alertState: AlertState): string => {
  if (alertState.isAlerting && alertState.activePriority) {
    return ALERT_COLORS[alertState.activePriority];
  }
  return NORMAL_COLOR;
}; 