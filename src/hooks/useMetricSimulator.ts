import { useState, useEffect, useCallback, useRef } from 'react';
import { subMinutes, isAfter } from 'date-fns';
import type { Metric, MetricDataPoint, MetricStats, MetricType, IncidentIoConfig, AlertThreshold, AlertState, ThresholdAlertState } from '../types/metrics';
import { METRIC_CONFIGS, getAllMetricConfigs, getMetricAlertThresholds, evaluateAlertState } from '../config/metrics';
import { IncidentIoService } from '../services/incidentIo';

const SIMULATION_INTERVAL = 1000; // 1 second
const DATA_RETENTION_MINUTES = 15; // Keep 15 minutes of data

const createInitialMetric = (metricType: MetricType): Metric => {
  const config = METRIC_CONFIGS[metricType];
  return {
    id: config.id,
    name: config.name,
    unit: config.unit,
    dataPoints: [],
    stats: {
      current: 0,
      rolling1Min: { avg: 0, min: 0, max: 0 },
      rolling5Min: { avg: 0, min: 0, max: 0 },
      rolling15Min: { avg: 0, min: 0, max: 0 },
    },
    baseValue: config.baseValue,
    variance: config.variance,
    adjustment: 0,
    alertState: {
      activeThresholds: [],
      isAlerting: false,
    },
  };
};

const calculateStats = (dataPoints: MetricDataPoint[], now: Date): MetricStats => {
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
    const relevantPoints = dataPoints.filter(point => isAfter(point.timestamp, cutoff));
    
    if (relevantPoints.length === 0) {
      return { avg: 0, min: 0, max: 0 };
    }
    
    const values = relevantPoints.map(point => point.value);
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

const generateValue = (baseValue: number, variance: number, adjustment: number): number => {
  const randomVariation = (Math.random() - 0.5) * variance * 2;
  const value = baseValue + randomVariation + adjustment;
  return Math.max(0, value); // Ensure non-negative values
};

export const useMetricSimulator = () => {
  const [metrics, setMetrics] = useState<Record<MetricType, Metric>>(() => {
    const initialMetrics = {} as Record<MetricType, Metric>;
    getAllMetricConfigs().forEach(config => {
      initialMetrics[config.id] = createInitialMetric(config.id);
    });
    return initialMetrics;
  });

  const [incidentIoConfig, setIncidentIoConfig] = useState<IncidentIoConfig>(() => {
    // Load from localStorage if available
    try {
      const saved = localStorage.getItem('alert-playground-incident-io-config');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (error) {
      console.warn('Failed to load Incident.io config from localStorage:', error);
    }
    
    // Default config
    return {
      enabled: false,
      token: '',
      alertSourceConfigId: '',
      metadata: {
        team: '',
        service: '',
      },
    };
  });

  const incidentIoService = useRef<IncidentIoService>(new IncidentIoService(incidentIoConfig));
  const previousThresholdStates = useRef<Record<MetricType, Record<string, boolean>>>({} as any);
  const thresholdTimestamps = useRef<Record<MetricType, Record<string, Date>>>({} as any);

  // Update service when config changes
  useEffect(() => {
    incidentIoService.current.updateConfig(incidentIoConfig);
  }, [incidentIoConfig]);

  const cleanupOldData = useCallback((dataPoints: MetricDataPoint[], now: Date): MetricDataPoint[] => {
    const cutoff = subMinutes(now, DATA_RETENTION_MINUTES);
    return dataPoints.filter(point => isAfter(point.timestamp, cutoff));
  }, []);

  const handleThresholdStateChanges = useCallback(async (
    metricType: MetricType,
    metric: Metric,
    currentValue: number
  ) => {
    const thresholds = getMetricAlertThresholds(metricType);
    const previousStates = previousThresholdStates.current[metricType] || {};
    const currentStates: Record<string, boolean> = {};
    const timestamps = thresholdTimestamps.current[metricType] || {};

    // Check each threshold independently
    for (const threshold of thresholds) {
      const thresholdKey = `${threshold.priority}-${threshold.threshold}`;
      const isCurrentlyTriggered = threshold.operator === 'greater_than' 
        ? currentValue > threshold.threshold 
        : currentValue < threshold.threshold;
      
      const wasPreviouslyTriggered = previousStates[thresholdKey] || false;
      currentStates[thresholdKey] = isCurrentlyTriggered;

      // Handle state changes for this specific threshold
      if (isCurrentlyTriggered && !wasPreviouslyTriggered) {
        // Threshold just crossed - record timestamp and post alert
        const triggeredAt = new Date();
        timestamps[thresholdKey] = triggeredAt;
        
        try {
          const thresholdAlert = {
            threshold,
            isTriggered: true,
            triggeredAt,
          };
          await incidentIoService.current.postThresholdAlert(
            metricType,
            metric.name,
            thresholdAlert,
            currentValue,
            metric.unit
          );
        } catch (error) {
          console.error(`Failed to post threshold alert for ${metricType} ${threshold.priority}:`, error);
        }
      } else if (!isCurrentlyTriggered && wasPreviouslyTriggered) {
        // Threshold just uncrossed - remove timestamp and resolve alert
        delete timestamps[thresholdKey];
        
        try {
          await incidentIoService.current.resolveThresholdAlert(
            metricType,
            metric.name,
            threshold
          );
        } catch (error) {
          console.error(`Failed to resolve threshold alert for ${metricType} ${threshold.priority}:`, error);
        }
      }
    }

    // Update previous states and timestamps
    previousThresholdStates.current[metricType] = currentStates;
    thresholdTimestamps.current[metricType] = timestamps;
  }, []);

  const evaluateAlertStateWithTimestamps = useCallback((
    metricType: MetricType,
    value: number,
    thresholds: AlertThreshold[]
  ): AlertState => {
    const activeThresholds: ThresholdAlertState[] = [];
    const timestamps = thresholdTimestamps.current[metricType] || {};

    // Check each threshold independently
    for (const threshold of thresholds) {
      const isTriggered = threshold.operator === 'greater_than' 
        ? value > threshold.threshold 
        : value < threshold.threshold;
      
      if (isTriggered) {
        const thresholdKey = `${threshold.priority}-${threshold.threshold}`;
        const triggeredAt = timestamps[thresholdKey] || new Date(); // Fallback to now if not tracked
        
        activeThresholds.push({
          threshold,
          isTriggered: true,
          triggeredAt,
        });
      }
    }

    return {
      activeThresholds,
      isAlerting: activeThresholds.length > 0,
    };
  }, []);

  const updateMetrics = useCallback(() => {
    const now = new Date();
    
    setMetrics(prevMetrics => {
      const updatedMetrics = { ...prevMetrics };
      
      Object.keys(updatedMetrics).forEach(key => {
        const metricType = key as MetricType;
        const metric = updatedMetrics[metricType];
        
        // Generate new value
        const newValue = generateValue(metric.baseValue, metric.variance, metric.adjustment);
        
        // Add new data point
        const newDataPoint: MetricDataPoint = {
          timestamp: now,
          value: newValue,
        };
        
        // Clean up old data and add new point
        const cleanedDataPoints = cleanupOldData([...metric.dataPoints, newDataPoint], now);
        
        // Calculate new stats
        const newStats = calculateStats(cleanedDataPoints, now);
        
        // Evaluate alert state with persistent timestamps
        const thresholds = getMetricAlertThresholds(metricType);
        const alertState = evaluateAlertStateWithTimestamps(metricType, newValue, thresholds);
        
        updatedMetrics[metricType] = {
          ...metric,
          dataPoints: cleanedDataPoints,
          stats: newStats,
          alertState,
        };

        // Handle alert state changes (async, don't block UI)
        handleThresholdStateChanges(metricType, metric, newValue);
      });
      
      return updatedMetrics;
    });
  }, [cleanupOldData, handleThresholdStateChanges, evaluateAlertStateWithTimestamps]);

  const adjustMetric = useCallback((metricType: MetricType, adjustment: number) => {
    setMetrics(prevMetrics => ({
      ...prevMetrics,
      [metricType]: {
        ...prevMetrics[metricType],
        adjustment,
      },
    }));
  }, []);

  const getMetricHistory = useCallback((metricType: MetricType, minutes: number): MetricDataPoint[] => {
    const now = new Date();
    const cutoff = subMinutes(now, minutes);
    return metrics[metricType].dataPoints.filter(point => isAfter(point.timestamp, cutoff));
  }, [metrics]);

  const updateIncidentIoConfig = useCallback((config: IncidentIoConfig) => {
    setIncidentIoConfig(config);
    
    // Persist to localStorage
    try {
      localStorage.setItem('alert-playground-incident-io-config', JSON.stringify(config));
    } catch (error) {
      console.warn('Failed to save Incident.io config to localStorage:', error);
    }
  }, []);

  // Start simulation
  useEffect(() => {
    const interval = setInterval(updateMetrics, SIMULATION_INTERVAL);
    return () => clearInterval(interval);
  }, [updateMetrics]);

  return {
    metrics,
    adjustMetric,
    getMetricHistory,
    incidentIoConfig,
    updateIncidentIoConfig,
  };
}; 