import React from 'react';
import type { AlertManagerReturn } from '../hooks/useAlertManager';
import type { IncidentIoConfig, Metric } from '../types/metrics';
import { Footer } from './Footer';
import { Header } from './Header';
import { IncidentIoConfigComponent } from './IncidentIoConfig';
import { MetricCard } from './MetricCard';

interface MetricDashboardProps {
  metrics: Record<string, Metric>;
  adjustMetric: (metricName: string, adjustment: number) => void;
  alertManager?: AlertManagerReturn;
  incidentIoConfig: IncidentIoConfig;
  updateIncidentIoConfig: (config: IncidentIoConfig) => void;
}

export const MetricDashboard: React.FC<MetricDashboardProps> = ({
  metrics,
  adjustMetric,
  alertManager,
  incidentIoConfig,
  updateIncidentIoConfig,
}) => {
  const handleAdjustment = (metricName: string, delta: number) => {
    const currentAdjustment = metrics[metricName].adjustment;
    adjustMetric(metricName, currentAdjustment + delta);
  };

  const resetAdjustment = (metricName: string) => {
    adjustMetric(metricName, 0);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto">
        <Header />

        {/* Incident.io Configuration */}
        <div className="mb-6">
          <IncidentIoConfigComponent
            config={incidentIoConfig}
            onConfigChange={updateIncidentIoConfig}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-2 gap-4">
          {Object.entries(metrics).map(([metricName, metric]) => (
            <MetricCard
              key={metricName}
              metricName={metricName}
              metric={metric}
              alertManager={alertManager}
              onAdjustment={handleAdjustment}
              onReset={resetAdjustment}
            />
          ))}
        </div>

        <Footer />
      </div>
    </div>
  );
};
