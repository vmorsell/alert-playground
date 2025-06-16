import { useMetricSimulator } from '../hooks/useMetricSimulator';
import { MetricChart } from './MetricChart';
import { MetricStatsDisplay } from './MetricStats';
import type { MetricType } from '../types/metrics';

const NORMAL_COLOR = '#10b981'; // Green for normal/non-alarming state

export const MetricDashboard: React.FC = () => {
  const { metrics, adjustMetric, getMetricHistory } = useMetricSimulator();

  const handleAdjustment = (metricType: MetricType, event: React.ChangeEvent<HTMLInputElement>) => {
    const adjustment = parseFloat(event.target.value) || 0;
    adjustMetric(metricType, adjustment);
  };

  return (
    <div className="metric-dashboard">
      <h1>Metric Simulator Dashboard</h1>
      
      <div className="metrics-grid">
        {Object.entries(metrics).map(([key, metric]) => {
          const metricType = key as MetricType;
          const last2MinData = getMetricHistory(metricType, 2);
          
          return (
            <div key={metricType} className="metric-panel">
              <div className="metric-controls">
                <label htmlFor={`adjustment-${metricType}`}>
                  Adjustment ({metric.unit}):
                </label>
                <input
                  id={`adjustment-${metricType}`}
                  type="number"
                  value={metric.adjustment}
                  onChange={(e) => handleAdjustment(metricType, e)}
                  step="0.1"
                  className="adjustment-input"
                />
              </div>
              
              <div className="metric-content">
                <div className="chart-section">
                  <MetricChart
                    title={metric.name}
                    unit={metric.unit}
                    dataPoints={last2MinData}
                    color={NORMAL_COLOR}
                  />
                </div>
                
                <div className="stats-section">
                  <MetricStatsDisplay
                    title={metric.name}
                    unit={metric.unit}
                    stats={metric.stats}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}; 