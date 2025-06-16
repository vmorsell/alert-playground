import { useState } from 'react';
import { MetricDashboard } from './components/MetricDashboard';
import { useMetricSimulator } from './hooks/useMetricSimulator';
import type { IncidentIoConfig } from './types/metrics';

function App() {
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

  const { metrics, adjustMetric } = useMetricSimulator(incidentIoConfig);

  const updateIncidentIoConfig = (config: IncidentIoConfig) => {
    setIncidentIoConfig(config);
    
    // Persist to localStorage
    try {
      localStorage.setItem('alert-playground-incident-io-config', JSON.stringify(config));
    } catch (error) {
      console.warn('Failed to save Incident.io config to localStorage:', error);
    }
  };

  return (
    <MetricDashboard 
      metrics={metrics}
      adjustMetric={adjustMetric}
      incidentIoConfig={incidentIoConfig}
      updateIncidentIoConfig={updateIncidentIoConfig}
    />
  );
}

export default App;
