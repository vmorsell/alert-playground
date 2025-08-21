import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { getAllMetricConfigs } from '../config/metrics';
import { Alert } from '../lib/Alert';
import { AlertManager } from '../lib/AlertManager';
import { Threshold } from '../lib/Threshold';
import { FireHydrantProvider } from '../providers/FireHydrantProvider';
import { IncidentIoProvider } from '../providers/IncidentIoProvider';
import { MultiProviderManager } from '../providers/MultiProviderManager';
import type { IncidentManagementConfigs } from '../types/metrics';

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
  configs: IncidentManagementConfigs,
): AlertManagerReturn => {
  const multiProvider = useMemo(() => {
    const manager = new MultiProviderManager();

    // Add Incident.io provider if enabled
    if (configs.incidentIo.enabled) {
      const incidentIoProvider = new IncidentIoProvider(configs.incidentIo);
      manager.addProvider(incidentIoProvider);
    }

    // Add FireHydrant provider if enabled
    if (configs.fireHydrant.enabled) {
      const fireHydrantProvider = new FireHydrantProvider(configs.fireHydrant);
      manager.addProvider(fireHydrantProvider);
    }

    return manager;
  }, [configs]);

  const alertManager = useRef<AlertManager | null>(null);
  if (!alertManager.current) {
    alertManager.current = new AlertManager(multiProvider);
  }

  useEffect(() => {
    // Update providers when configs change
    alertManager.current = new AlertManager(multiProvider);

    // Add thresholds to the new AlertManager instance
    const manager = alertManager.current;
    const metricConfigs = getAllMetricConfigs();
    console.log(
      'Setting up thresholds for new AlertManager:',
      metricConfigs.map((c) => c.name),
    );

    metricConfigs.forEach((config) => {
      console.log(
        `Adding ${config.alertThresholds.length} thresholds for ${config.name}:`,
        config.alertThresholds,
      );
      manager.addThresholds(config.name, config.alertThresholds);
    });

    console.log(
      'Total thresholds after setup:',
      manager.getAllThresholds().length,
    );
  }, [multiProvider]);

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
