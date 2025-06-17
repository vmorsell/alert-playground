import { useCallback, useEffect, useRef, useState } from 'react';
import { isAfter, subMinutes } from 'date-fns';
import {
  getMetricAlertThresholds,
  getMetricConfig,
  METRIC_CONFIGS,
} from '../config/metrics';
import { IncidentIoService } from '../services/incidentIo';
import type {
  AlertState,
  AlertThreshold,
  IncidentIoConfig,
  Metric,
  MetricDataPoint,
  MetricStats,
  ThresholdAlertState,
} from '../types/metrics';

const SIMULATION_INTERVAL = 1000; // 1 second
const DATA_RETENTION_MINUTES = 15; // Keep 15 minutes of data

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
    alertState: { activeThresholds: [], isAlerting: false },
  };
};

const calculateStats = (
  dataPoints: MetricDataPoint[],
  now: Date,
): MetricStats => {
  if (dataPoints.length === 0) {
    return {
      current: 0,
      rolling1Min: { avg: 0, min: 0, max: 0 },
      rolling5Min: { avg: 0, min: 0, max: 0 },
      rolling15Min: { avg: 0, min: 0, max: 0 },
    };
  }

  const current = dataPoints[dataPoints.length - 1]?.value || 0;

  const calculateRollingStats = (minutes: number) => {
    const cutoff = subMinutes(now, minutes);
    const relevantPoints = dataPoints.filter((point) =>
      isAfter(point.timestamp, cutoff),
    );

    if (relevantPoints.length === 0) {
      return { avg: 0, min: 0, max: 0 };
    }

    const values = relevantPoints.map((point) => point.value);
    const sum = values.reduce((acc, val) => acc + val, 0);
    const avg = sum / values.length;
    const min = Math.min(...values);
    const max = Math.max(...values);

    return { avg, min, max };
  };

  return {
    current,
    rolling1Min: calculateRollingStats(1),
    rolling5Min: calculateRollingStats(5),
    rolling15Min: calculateRollingStats(15),
  };
};

const generateValue = (
  baseValue: number,
  variance: number,
  adjustment: number,
): number => {
  const randomVariation = (Math.random() - 0.5) * variance * 2;
  const value = baseValue + randomVariation + adjustment;
  return Math.max(0, value); // Ensure non-negative values
};

export const useMetricSimulator = (incidentIoConfig: IncidentIoConfig) => {
  const [metrics, setMetrics] = useState<Record<string, Metric>>(() => {
    const initialMetrics = {} as Record<string, Metric>;
    METRIC_CONFIGS.forEach((config) => {
      initialMetrics[config.name] = createInitialMetric(config.name);
    });
    return initialMetrics;
  });

  const incidentIoService = useRef<IncidentIoService>(
    new IncidentIoService(incidentIoConfig),
  );
  const previousThresholdStates = useRef<
    Record<string, Record<string, boolean>>
  >({} as Record<string, Record<string, boolean>>);
  const thresholdTimestamps = useRef<Record<string, Record<string, Date>>>(
    {} as Record<string, Record<string, Date>>,
  );
  const pendingResolves = useRef<Record<string, Record<string, Date>>>(
    {} as Record<string, Record<string, Date>>,
  );

  // Update service when config changes
  useEffect(() => {
    incidentIoService.current.updateConfig(incidentIoConfig);
  }, [incidentIoConfig]);

  const cleanupOldData = useCallback(
    (dataPoints: MetricDataPoint[], now: Date): MetricDataPoint[] => {
      const cutoff = subMinutes(now, DATA_RETENTION_MINUTES);
      return dataPoints.filter((point) => isAfter(point.timestamp, cutoff));
    },
    [],
  );

  const handleThresholdStateChanges = useCallback(
    async (metricName: string, currentValue: number) => {
      const thresholds = getMetricAlertThresholds(metricName);
      const previousStates = previousThresholdStates.current[metricName] || {};
      const timestamps = thresholdTimestamps.current[metricName] || {};
      const pending = pendingResolves.current[metricName] || {};
      const serviceName = incidentIoConfig.metadata.service || 'demo-service';
      const now = new Date();

      const currentStates: Record<string, boolean> = {};

      // Check each threshold independently
      for (const threshold of thresholds) {
        const thresholdKey = `${threshold.priority}-${threshold.threshold}`;
        const isCurrentlyTriggered =
          threshold.operator === 'greater_than'
            ? currentValue > threshold.threshold
            : currentValue < threshold.threshold;

        const wasPreviouslyTriggered = previousStates[thresholdKey] || false;
        const hasPendingResolve = pending[thresholdKey] !== undefined;
        currentStates[thresholdKey] = isCurrentlyTriggered;

        // Handle state changes for this specific threshold
        if (isCurrentlyTriggered && !wasPreviouslyTriggered) {
          // Threshold just crossed - clear any pending resolve and post alert immediately
          delete pending[thresholdKey];
          const triggeredAt = new Date();
          timestamps[thresholdKey] = triggeredAt;

          try {
            await incidentIoService.current.postThresholdAlert(
              metricName,
              threshold,
              currentValue,
              serviceName,
            );
          } catch (error) {
            console.error(
              `Failed to post threshold alert for ${metricName} ${threshold.priority}:`,
              error,
            );
          }
        } else if (!isCurrentlyTriggered && wasPreviouslyTriggered) {
          // Threshold just uncrossed - start resolve delay if configured
          const resolveDelaySeconds = threshold.resolveDelaySeconds || 0;

          if (resolveDelaySeconds > 0) {
            // Set pending resolve timestamp
            pending[thresholdKey] = new Date();
          } else {
            // No delay - resolve immediately
            delete timestamps[thresholdKey];

            try {
              await incidentIoService.current.resolveThresholdAlert(
                metricName,
                threshold,
                currentValue,
                serviceName,
              );
            } catch (error) {
              console.error(
                `Failed to resolve threshold alert for ${metricName} ${threshold.priority}:`,
                error,
              );
            }
          }
        } else if (isCurrentlyTriggered && hasPendingResolve) {
          // Threshold re-triggered before resolve delay completed - cancel pending resolve
          delete pending[thresholdKey];
        } else if (!isCurrentlyTriggered && hasPendingResolve) {
          // Check if resolve delay has elapsed
          const resolveDelaySeconds = threshold.resolveDelaySeconds || 0;
          const pendingResolveAt = pending[thresholdKey];
          const elapsedSeconds =
            (now.getTime() - pendingResolveAt.getTime()) / 1000;

          if (elapsedSeconds >= resolveDelaySeconds) {
            // Delay elapsed - resolve the alert
            delete pending[thresholdKey];
            delete timestamps[thresholdKey];

            try {
              await incidentIoService.current.resolveThresholdAlert(
                metricName,
                threshold,
                currentValue,
                serviceName,
              );
            } catch (error) {
              console.error(
                `Failed to resolve threshold alert for ${metricName} ${threshold.priority}:`,
                error,
              );
            }
          }
        }
      }

      // Update previous states and timestamps
      previousThresholdStates.current[metricName] = currentStates;
      thresholdTimestamps.current[metricName] = timestamps;
      pendingResolves.current[metricName] = pending;
    },
    [incidentIoConfig],
  );

  const evaluateAlertStateWithTimestamps = useCallback(
    (
      metricName: string,
      value: number,
      thresholds: AlertThreshold[],
    ): AlertState => {
      const activeThresholds: ThresholdAlertState[] = [];
      const timestamps = thresholdTimestamps.current[metricName] || {};
      const pending = pendingResolves.current[metricName] || {};

      // Check each threshold independently
      for (const threshold of thresholds) {
        const thresholdKey = `${threshold.priority}-${threshold.threshold}`;
        const isTriggered =
          threshold.operator === 'greater_than'
            ? value > threshold.threshold
            : value < threshold.threshold;

        const hasPendingResolve = pending[thresholdKey] !== undefined;

        // Alert is active if currently triggered OR has a pending resolve (during delay period)
        if (isTriggered || hasPendingResolve) {
          const triggeredAt = timestamps[thresholdKey] || new Date(); // Fallback to now if not tracked
          const pendingResolveAt = pending[thresholdKey];

          activeThresholds.push({
            threshold,
            isTriggered,
            triggeredAt,
            pendingResolveAt,
          });
        }
      }

      return {
        activeThresholds,
        isAlerting: activeThresholds.length > 0,
      };
    },
    [],
  );

  const updateMetrics = useCallback(() => {
    const now = new Date();

    setMetrics((prevMetrics) => {
      const updatedMetrics = { ...prevMetrics };

      Object.keys(updatedMetrics).forEach((key) => {
        const metricName = key;
        const metric = updatedMetrics[metricName];

        // Generate new value
        const newValue = generateValue(
          metric.baseValue,
          metric.variance,
          metric.adjustment,
        );

        // Add new data point
        const newDataPoint: MetricDataPoint = {
          timestamp: now,
          value: newValue,
        };

        // Clean up old data and add new point
        const cleanedDataPoints = cleanupOldData(
          [...metric.dataPoints, newDataPoint],
          now,
        );

        // Calculate new stats
        const newStats = calculateStats(cleanedDataPoints, now);

        // Evaluate alert state with persistent timestamps
        const thresholds = getMetricAlertThresholds(metricName);
        const alertState = evaluateAlertStateWithTimestamps(
          metricName,
          newValue,
          thresholds,
        );

        updatedMetrics[metricName] = {
          ...metric,
          dataPoints: cleanedDataPoints,
          stats: newStats,
          alertState,
        };

        // Handle alert state changes (async, don't block UI)
        handleThresholdStateChanges(metricName, newValue);
      });

      return updatedMetrics;
    });
  }, [
    cleanupOldData,
    handleThresholdStateChanges,
    evaluateAlertStateWithTimestamps,
  ]);

  const adjustMetric = useCallback((metricName: string, adjustment: number) => {
    setMetrics((prevMetrics) => ({
      ...prevMetrics,
      [metricName]: {
        ...prevMetrics[metricName],
        adjustment,
      },
    }));
  }, []);

  const getMetricHistory = useCallback(
    (metricName: string, minutes: number): MetricDataPoint[] => {
      const cutoff = subMinutes(new Date(), minutes);

      return metrics[metricName].dataPoints.filter((point) =>
        isAfter(point.timestamp, cutoff),
      );
    },
    [metrics],
  );

  // Start simulation
  useEffect(() => {
    const interval = setInterval(updateMetrics, SIMULATION_INTERVAL);
    return () => clearInterval(interval);
  }, [updateMetrics]);

  return {
    metrics,
    adjustMetric,
    getMetricHistory,
  };
};
