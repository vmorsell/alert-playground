import { useCallback, useEffect, useRef, useState } from 'react';
import { isAfter, subMinutes } from 'date-fns';
import { getMetricConfig, METRIC_CONFIGS } from '../config/metrics';
import type { Metric, MetricDataPoint, MetricStats } from '../types/metrics';
import type { AlertManagerReturn } from './useAlertManager';

const SIMULATION_INTERVAL = 1000;
const DATA_RETENTION_MINUTES = 15;

const createInitialMetric = (metricName: string): Metric => {
  const config = getMetricConfig(metricName);
  const now = new Date();

  return {
    displayName: config.displayName,
    unit: config.unit,
    dataPoints: [{ timestamp: now, value: config.baseValue }],
    stats: {
      current: config.baseValue,
      rolling1Min: {
        avg: config.baseValue,
        min: config.baseValue,
        max: config.baseValue,
      },
      rolling5Min: {
        avg: config.baseValue,
        min: config.baseValue,
        max: config.baseValue,
      },
      rolling15Min: {
        avg: config.baseValue,
        min: config.baseValue,
        max: config.baseValue,
      },
    },
    baseValue: config.baseValue,
    variance: config.variance,
    adjustment: 0,
  };
};

const calculateStats = (
  dataPoints: MetricDataPoint[],
  now: Date,
): MetricStats => {
  const getDataInWindow = (minutes: number) =>
    dataPoints.filter((point) =>
      isAfter(point.timestamp, subMinutes(now, minutes)),
    );

  const computeRollingStats = (data: MetricDataPoint[]) => {
    if (data.length === 0) return { avg: 0, min: 0, max: 0 };

    const values = data.map((d) => d.value);
    return {
      avg: values.reduce((sum, val) => sum + val, 0) / values.length,
      min: Math.min(...values),
      max: Math.max(...values),
    };
  };

  return {
    current: dataPoints[dataPoints.length - 1]?.value || 0,
    rolling1Min: computeRollingStats(getDataInWindow(1)),
    rolling5Min: computeRollingStats(getDataInWindow(5)),
    rolling15Min: computeRollingStats(getDataInWindow(15)),
  };
};

export const useMetricSimulator = (alertManager: AlertManagerReturn) => {
  const [metrics, setMetrics] = useState<Record<string, Metric>>(() => {
    const initialMetrics = {} as Record<string, Metric>;
    METRIC_CONFIGS.forEach((config) => {
      initialMetrics[config.name] = createInitialMetric(config.name);
    });
    return initialMetrics;
  });

  const thresholdsSetup = useRef(false);

  useEffect(() => {
    if (!thresholdsSetup.current) {
      METRIC_CONFIGS.forEach((config) => {
        alertManager.alertManager.addThresholds(
          config.name,
          config.alertThresholds,
        );
      });
      thresholdsSetup.current = true;
    }
  }, [alertManager.alertManager]);

  const cleanupOldData = useCallback(
    (dataPoints: MetricDataPoint[], now: Date): MetricDataPoint[] => {
      const cutoff = subMinutes(now, DATA_RETENTION_MINUTES);
      return dataPoints.filter((point) => isAfter(point.timestamp, cutoff));
    },
    [],
  );

  const dataGenerationTimer = useRef<number | null>(null);
  const latestMetricsRef = useRef<Record<string, Metric>>(metrics);

  // data generation loop
  useEffect(() => {
    const startDataGeneration = () => {
      dataGenerationTimer.current = window.setInterval(() => {
        const now = new Date();

        setMetrics((prevMetrics) => {
          const newMetrics = { ...prevMetrics };

          for (const [metricName, metric] of Object.entries(newMetrics)) {
            const config = getMetricConfig(metricName);

            const randomChange = (Math.random() - 0.5) * config.variance * 2;
            const newValue = Math.max(
              0,
              metric.baseValue + metric.adjustment + randomChange,
            );

            const newDataPoint: MetricDataPoint = {
              timestamp: now,
              value: newValue,
            };

            const updatedDataPoints = [...metric.dataPoints, newDataPoint];
            const cleanedDataPoints = cleanupOldData(updatedDataPoints, now);
            const newStats = calculateStats(cleanedDataPoints, now);

            newMetrics[metricName] = {
              ...metric,
              dataPoints: cleanedDataPoints,
              stats: newStats,
            };
          }

          // Update the ref with the latest metrics
          latestMetricsRef.current = newMetrics;
          return newMetrics;
        });
      }, SIMULATION_INTERVAL);
    };

    startDataGeneration();

    return () => {
      if (dataGenerationTimer.current) {
        clearInterval(dataGenerationTimer.current);
      }
    };
  }, [cleanupOldData]);

  const evaluationState = useRef({
    isEvaluating: false,
    timeoutId: null as number | null,
  });

  const evaluateAlerts = useCallback(async () => {
    if (evaluationState.current.isEvaluating) {
      return;
    }

    evaluationState.current.isEvaluating = true;

    try {
      const currentMetrics = latestMetricsRef.current;

      for (const [metricName, metric] of Object.entries(currentMetrics)) {
        if (metric.stats.current !== undefined) {
          try {
            console.log(`Evaluating ${metricName}: ${metric.stats.current}`);
            await alertManager.evaluateMetric(metricName, metric.stats.current);
          } catch (error) {
            console.error(`Error evaluating metric ${metricName}:`, {
              metricName,
              currentValue: metric.stats.current,
              error: error instanceof Error ? error.message : String(error),
            });
          }
        }
      }
    } finally {
      evaluationState.current.isEvaluating = false;
    }
  }, [alertManager]);

  // debounced alert evaluation
  useEffect(() => {
    const state = evaluationState.current;

    if (state.timeoutId) {
      clearTimeout(state.timeoutId);
    }

    state.timeoutId = window.setTimeout(() => {
      evaluateAlerts();
      state.timeoutId = null;
    }, 100);

    return () => {
      if (state.timeoutId) {
        clearTimeout(state.timeoutId);
        state.timeoutId = null;
      }
    };
  }, [metrics, evaluateAlerts]);

  const adjustMetric = useCallback((metricName: string, adjustment: number) => {
    setMetrics((prev) => ({
      ...prev,
      [metricName]: {
        ...prev[metricName],
        adjustment,
      },
    }));
  }, []);

  return {
    metrics,
    adjustMetric,
  };
};
