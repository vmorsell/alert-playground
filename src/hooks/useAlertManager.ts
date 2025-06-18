import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert } from '../lib/Alert';
import { AlertManager } from '../lib/AlertManager';
import { Threshold } from '../lib/Threshold';
import { IncidentIoProvider } from '../providers/IncidentIoProvider';
import type { IncidentIoConfig } from '../types/metrics';

export interface AlertManagerReturn {
  alertManager: AlertManager;
  thresholds: Threshold[];
  activeAlerts: Alert[];
  evaluateMetric: (metricName: string, currentValue: number) => void;
  getThresholdsForMetric: (metricName: string) => Threshold[];
  getActiveAlertsForMetric: (metricName: string) => Alert[];
  isMetricAlerting: (metricName: string) => boolean;
  getHighestPriorityAlertForMetric: (metricName: string) => Alert | undefined;
  getStats: () => ReturnType<AlertManager['getStats']>;
}

export const useAlertManager = (
  incidentIoConfig: IncidentIoConfig,
): AlertManagerReturn => {
  const incidentProvider = useMemo(
    () => new IncidentIoProvider(incidentIoConfig),
    [incidentIoConfig],
  );

  const alertManager = useRef<AlertManager | null>(null);
  if (!alertManager.current) {
    alertManager.current = new AlertManager(incidentProvider);
  }

  useEffect(() => {
    incidentProvider.updateConfig(incidentIoConfig);
  }, [incidentProvider, incidentIoConfig]);

  const [renderTrigger, setRenderTrigger] = useState<number>(0);

  const forceUpdate = useCallback(() => {
    setRenderTrigger((prev) => prev + 1);
  }, []);

  useEffect(() => {
    const manager = alertManager.current;
    if (!manager) return;

    manager.on('onThresholdStateChange', forceUpdate);
    manager.on('onAlertCreated', forceUpdate);
    manager.on('onAlertResolved', forceUpdate);
  }, [forceUpdate]);

  const thresholds = useMemo(() => {
    return alertManager.current?.getAllThresholds() || [];
  }, [renderTrigger]);

  const activeAlerts = useMemo(() => {
    return alertManager.current?.getAllActiveAlerts() || [];
  }, [renderTrigger]);

  const evaluateMetric = useCallback(
    async (metricName: string, currentValue: number) => {
      if (alertManager.current) {
        await alertManager.current.evaluateMetric(metricName, currentValue);
      }
    },
    [],
  );

  const getThresholdsForMetric = useCallback(
    (metricName: string) => {
      return alertManager.current?.getThresholdsForMetric(metricName) || [];
    },
    [renderTrigger],
  );

  const getActiveAlertsForMetric = useCallback(
    (metricName: string) => {
      return alertManager.current?.getActiveAlertsForMetric(metricName) || [];
    },
    [renderTrigger],
  );

  const isMetricAlerting = useCallback(
    (metricName: string) => {
      return alertManager.current?.isMetricAlerting(metricName) || false;
    },
    [renderTrigger],
  );

  const getHighestPriorityAlertForMetric = useCallback(
    (metricName: string) => {
      return alertManager.current?.getHighestPriorityAlertForMetric(metricName);
    },
    [renderTrigger],
  );

  const getStats = useCallback(() => {
    return (
      alertManager.current?.getStats() || {
        totalThresholds: 0,
        activeAlerts: 0,
        thresholdsByState: {
          healthy: 0,
          firing: 0,
          pending_resolve: 0,
          resolving: 0,
        },
      }
    );
  }, [renderTrigger]);

  return {
    alertManager: alertManager.current!,
    thresholds,
    activeAlerts,
    evaluateMetric,
    getThresholdsForMetric,
    getActiveAlertsForMetric,
    isMetricAlerting,
    getHighestPriorityAlertForMetric,
    getStats,
  };
};
