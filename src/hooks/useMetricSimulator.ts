import { useState, useEffect, useCallback } from 'react';
import { subMinutes, isAfter } from 'date-fns';
import type { Metric, MetricDataPoint, MetricStats, MetricType } from '../types/metrics';
import { METRIC_CONFIGS, getAllMetricConfigs } from '../config/metrics';

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

  const cleanupOldData = useCallback((dataPoints: MetricDataPoint[], now: Date): MetricDataPoint[] => {
    const cutoff = subMinutes(now, DATA_RETENTION_MINUTES);
    return dataPoints.filter(point => isAfter(point.timestamp, cutoff));
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
        
        updatedMetrics[metricType] = {
          ...metric,
          dataPoints: cleanedDataPoints,
          stats: newStats,
        };
      });
      
      return updatedMetrics;
    });
  }, [cleanupOldData]);

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