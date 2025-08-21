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
  evaluateMetric: (metricName: string, currentValue: number) => Promise<void>;
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

  const [thresholds, setThresholds] = useState<Threshold[]>([]);
  const [activeAlerts, setActiveAlerts] = useState<Alert[]>([]);

  const updateState = useCallback(() => {
    if (alertManager.current) {
      setThresholds(alertManager.current.getAllThresholds());
      setActiveAlerts(alertManager.current.getAllActiveAlerts());
    }
  }, []);

  useEffect(() => {
    const manager = alertManager.current;
    if (!manager) return;

    updateState();

    manager.on('onThresholdStateChange', updateState);
    manager.on('onAlertCreated', updateState);
    manager.on('onAlertResolved', updateState);

    return () => {
      manager.off('onThresholdStateChange');
      manager.off('onAlertCreated');
      manager.off('onAlertResolved');
    };
  }, [updateState]);

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
      return thresholds.filter((t) => t.metricName === metricName);
    },
    [thresholds],
  );

  const getActiveAlertsForMetric = useCallback(
    (metricName: string) => {
      return activeAlerts.filter(
        (a) => a.metricName === metricName && !a.isResolved,
      );
    },
    [activeAlerts],
  );

  const isMetricAlerting = useCallback(
    (metricName: string) => {
      return activeAlerts.some(
        (a) => a.metricName === metricName && !a.isResolved,
      );
    },
    [activeAlerts],
  );

  const getHighestPriorityAlertForMetric = useCallback(
    (metricName: string) => {
      const alerts = activeAlerts.filter(
        (a) => a.metricName === metricName && !a.isResolved,
      );
      if (alerts.length === 0) return undefined;

      const priorities = { P1: 1, P2: 2, P3: 3, P4: 4 };
      return alerts.sort(
        (a, b) => priorities[a.priority] - priorities[b.priority],
      )[0];
    },
    [activeAlerts],
  );

  const getStats = useCallback(() => {
    const thresholdsByState = {
      healthy: 0,
      firing: 0,
      pending_resolve: 0,
      resolving: 0,
    };

    thresholds.forEach((t) => {
      thresholdsByState[t.state]++;
    });

    return {
      totalThresholds: thresholds.length,
      activeAlerts: activeAlerts.length,
      thresholdsByState,
    };
  }, [thresholds, activeAlerts]);

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
