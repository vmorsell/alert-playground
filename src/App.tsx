import { useState } from 'react';
import { MetricDashboard } from './components/MetricDashboard';
import { useAlertManager } from './hooks/useAlertManager';
import { useMetricSimulator } from './hooks/useMetricSimulator';
import type { IncidentManagementConfigs } from './types/metrics';

function App() {
  const [configs, setConfigs] = useState<IncidentManagementConfigs>(() => {
    // Load from localStorage if available
    try {
      const saved = localStorage.getItem(
        'alert-playground-incident-management-configs',
      );
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (error) {
      console.warn(
        'Failed to load incident management configs from localStorage:',
        error,
      );
    }

    // Default configs
    return {
      incidentIo: {
        enabled: false,
        token: '',
        alertSourceConfigId: '',
        metadata: {
          team: '',
          service: '',
        },
      },
      fireHydrant: {
        enabled: false,
        webhookUrl: '',
        metadata: {
          team: '',
          service: '',
          environment: '',
        },
      },
    };
  });

  const alertManager = useAlertManager(configs);
  const { metrics, adjustMetric } = useMetricSimulator(alertManager);

  const updateConfigs = (newConfigs: IncidentManagementConfigs) => {
    setConfigs(newConfigs);

    // Persist to localStorage
    try {
      localStorage.setItem(
        'alert-playground-incident-management-configs',
        JSON.stringify(newConfigs),
      );
    } catch (error) {
      console.warn(
        'Failed to save incident management configs to localStorage:',
        error,
      );
    }
  };

  return (
    <MetricDashboard
      metrics={metrics}
      adjustMetric={adjustMetric}
      alertManager={alertManager}
      configs={configs}
      updateConfigs={updateConfigs}
    />
  );
}

export default App;
