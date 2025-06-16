import { useMetricSimulator } from '../hooks/useMetricSimulator';
import { MetricChart } from './MetricChart';
import { MetricStatsDisplay } from './MetricStats';
import type { MetricType } from '../types/metrics';
import { getMetricConfig, getMetricStepSizes } from '../config/metrics';

const NORMAL_COLOR = '#10b981'; // Green for normal/non-alarming state

export const MetricDashboard: React.FC = () => {
  const { metrics, adjustMetric } = useMetricSimulator();

  const handleAdjustment = (metricType: MetricType, delta: number) => {
    const currentAdjustment = metrics[metricType].adjustment;
    adjustMetric(metricType, currentAdjustment + delta);
  };

  const resetAdjustment = (metricType: MetricType) => {
    adjustMetric(metricType, 0);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-6 text-center">
          Alert Playground
        </h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-2 gap-4">
          {Object.entries(metrics).map(([key, metric]) => {
            const metricType = key as MetricType;
            const config = getMetricConfig(metricType);
            const steps = getMetricStepSizes(metricType);
            const currentAdjustment = metric.adjustment;
            
            return (
              <div key={metricType} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                {/* Header with title and adjustment controls */}
                <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-100">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{config.name}</h3>
                    {config.description && (
                      <p className="text-xs text-gray-500 mt-1">{config.description}</p>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {/* Current adjustment display */}
                    <div className="text-sm text-gray-600 min-w-[80px] text-center">
                      {currentAdjustment > 0 && '+'}
                      {currentAdjustment.toFixed(1)} {config.unit}
                    </div>
                    
                    {/* Adjustment buttons */}
                    <div className="flex items-center gap-1">
                      {/* Large decrease */}
                      <button
                        onClick={() => handleAdjustment(metricType, -steps.large)}
                        className="px-2 py-1 text-xs font-medium text-red-700 bg-red-50 border border-red-200 rounded hover:bg-red-100 transition-colors"
                        title={`Decrease by ${steps.large} ${config.unit}`}
                      >
                        --
                      </button>
                      
                      {/* Small decrease */}
                      <button
                        onClick={() => handleAdjustment(metricType, -steps.small)}
                        className="px-2 py-1 text-xs font-medium text-red-600 bg-red-50 border border-red-200 rounded hover:bg-red-100 transition-colors"
                        title={`Decrease by ${steps.small} ${config.unit}`}
                      >
                        -
                      </button>
                      
                      {/* Reset */}
                      <button
                        onClick={() => resetAdjustment(metricType)}
                        className="px-2 py-1 text-xs font-medium text-gray-600 bg-gray-50 border border-gray-200 rounded hover:bg-gray-100 transition-colors"
                        title="Reset to baseline"
                      >
                        0
                      </button>
                      
                      {/* Small increase */}
                      <button
                        onClick={() => handleAdjustment(metricType, steps.small)}
                        className="px-2 py-1 text-xs font-medium text-green-600 bg-green-50 border border-green-200 rounded hover:bg-green-100 transition-colors"
                        title={`Increase by ${steps.small} ${config.unit}`}
                      >
                        +
                      </button>
                      
                      {/* Large increase */}
                      <button
                        onClick={() => handleAdjustment(metricType, steps.large)}
                        className="px-2 py-1 text-xs font-medium text-green-700 bg-green-50 border border-green-200 rounded hover:bg-green-100 transition-colors"
                        title={`Increase by ${steps.large} ${config.unit}`}
                      >
                        ++
                      </button>
                    </div>
                  </div>
                </div>
                
                {/* Main content area */}
                <div className="grid grid-cols-3 gap-4">
                  {/* Chart takes up 2/3 of the space */}
                  <div className="col-span-2">
                    <div className="bg-gray-50 rounded-md p-3">
                      <MetricChart
                        title=""
                        unit={config.unit}
                        dataPoints={metric.dataPoints.slice(-120)} // Last 2 minutes
                        color={NORMAL_COLOR}
                      />
                    </div>
                  </div>
                  
                  {/* Stats take up 1/3 of the space */}
                  <div className="col-span-1">
                    <MetricStatsDisplay
                      title=""
                      unit={config.unit}
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