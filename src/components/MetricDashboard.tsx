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
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-6 text-center">
          Metric Simulator Dashboard
        </h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-2 gap-4">
          {Object.entries(metrics).map(([key, metric]) => {
            const metricType = key as MetricType;
            const last2MinData = getMetricHistory(metricType, 2);
            
            return (
              <div key={metricType} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                {/* Header with title and adjustment */}
                <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-100">
                  <h3 className="text-lg font-semibold text-gray-900">{metric.name}</h3>
                  <div className="flex items-center gap-2">
                    <label htmlFor={`adjustment-${metricType}`} className="text-sm text-gray-600">
                      Adjust:
                    </label>
                    <input
                      id={`adjustment-${metricType}`}
                      type="number"
                      value={metric.adjustment}
                      onChange={(e) => handleAdjustment(metricType, e)}
                      step="0.1"
                      className="w-20 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    <span className="text-xs text-gray-500">{metric.unit}</span>
                  </div>
                </div>
                
                {/* Main content area */}
                <div className="grid grid-cols-3 gap-4">
                  {/* Chart takes up 2/3 of the space */}
                  <div className="col-span-2">
                    <div className="bg-gray-50 rounded-md p-3">
                      <MetricChart
                        title=""
                        unit={metric.unit}
                        dataPoints={last2MinData}
                        color={NORMAL_COLOR}
                      />
                    </div>
                  </div>
                  
                  {/* Stats take up 1/3 of the space */}
                  <div className="col-span-1">
                    <MetricStatsDisplay
                      title=""
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
    </div>
  );
}; 