import type {
  AlertPriority,
  AlertState,
  AlertThreshold,
  ThresholdAlertState,
} from '../types/metrics';

export interface MetricConfig {
  name: string;
  displayName: string;
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

export const METRIC_CONFIGS: MetricConfig[] = [
  {
    name: 'error_rate',
    displayName: 'Error Rate',
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
      {
        priority: 'P1',
        threshold: 15,
        operator: 'greater_than',
        description: 'Error rate high',
        resolveDelaySeconds: 5,
      },
      {
        priority: 'P2',
        threshold: 5,
        operator: 'greater_than',
        description: 'Error rate elevated',
        resolveDelaySeconds: 5,
      },
    ],
  },
  {
    name: 'p95_response_time',
    displayName: 'P95 Response Time',
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
      {
        priority: 'P1',
        threshold: 1000,
        operator: 'greater_than',
        description: 'Response time high',
        resolveDelaySeconds: 5,
      },
      {
        priority: 'P3',
        threshold: 400,
        operator: 'greater_than',
        description: 'Response time elevated',
        resolveDelaySeconds: 5,
      },
    ],
  },
  {
    name: 'cpu_usage',
    displayName: 'CPU Usage',
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
      {
        priority: 'P1',
        threshold: 90,
        operator: 'greater_than',
        description: 'CPU usage critical',
        resolveDelaySeconds: 5,
      },
      {
        priority: 'P3',
        threshold: 75,
        operator: 'greater_than',
        description: 'CPU usage high',
        resolveDelaySeconds: 5,
      },
    ],
  },
  {
    name: 'memory_usage',
    displayName: 'Memory Usage',
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
      {
        priority: 'P1',
        threshold: 95,
        operator: 'greater_than',
        description: 'Memory usage critical',
        resolveDelaySeconds: 5,
      },
      {
        priority: 'P2',
        threshold: 85,
        operator: 'greater_than',
        description: 'Memory usage high',
        resolveDelaySeconds: 5,
      },
    ],
  },
];

// Helper functions to work with metric configs
export const getMetricConfig = (metricName: string): MetricConfig => {
  const config = METRIC_CONFIGS.find((config) => config.name === metricName);
  if (!config) {
    throw new Error(`Metric config not found for: ${metricName}`);
  }
  return config;
};

export const getAllMetricConfigs = (): MetricConfig[] => {
  return METRIC_CONFIGS;
};

export const getMetricStepSizes = (metricName: string) => {
  return getMetricConfig(metricName).stepSizes;
};

export const getMetricColor = (metricName: string): string => {
  return getMetricConfig(metricName).color;
};

export const getMetricAlertThresholds = (
  metricName: string,
): AlertThreshold[] => {
  return getMetricConfig(metricName).alertThresholds;
};

// Alert priority colors
export const ALERT_COLORS: Record<AlertPriority, string> = {
  P1: '#dc2626', // Red-600 - Critical
  P2: '#d97706', // Amber-600 - Medium
  P3: '#ca8a04', // Yellow-600 - Low
  P4: '#65a30d', // Lime-600 - Info
};

export const NORMAL_COLOR = '#10b981'; // Green-500 - Normal state

// Utility function to evaluate alert state
export const evaluateAlertState = (
  value: number,
  thresholds: AlertThreshold[],
): AlertState => {
  const activeThresholds: ThresholdAlertState[] = [];

  // Check each threshold independently
  for (const threshold of thresholds) {
    const isTriggered =
      threshold.operator === 'greater_than'
        ? value > threshold.threshold
        : value < threshold.threshold;

    if (isTriggered) {
      activeThresholds.push({
        threshold,
        isTriggered: true,
        triggeredAt: new Date(),
      });
    }
  }

  return {
    activeThresholds,
    isAlerting: activeThresholds.length > 0,
  };
};

// Get color based on alert state
export const getAlertColor = (alertState: AlertState): string => {
  if (alertState.isAlerting && alertState.activeThresholds.length > 0) {
    // Return the color of the highest priority active threshold
    const priorities = { P1: 1, P2: 2, P3: 3, P4: 4 };
    const highestPriorityThreshold = alertState.activeThresholds.sort(
      (a, b) =>
        priorities[a.threshold.priority] - priorities[b.threshold.priority],
    )[0];
    return ALERT_COLORS[highestPriorityThreshold.threshold.priority];
  }
  return NORMAL_COLOR;
};
