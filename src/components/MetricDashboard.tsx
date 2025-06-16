import { useMetricSimulator } from '../hooks/useMetricSimulator';
import { MetricChart } from './MetricChart';
import { MetricStatsDisplay } from './MetricStats';
import { IncidentIoConfigComponent } from './IncidentIoConfig';
import type { MetricType } from '../types/metrics';
import { getMetricConfig, getMetricStepSizes, getAlertColor, ALERT_COLORS } from '../config/metrics';

const formatDuration = (startTime: Date): string => {
  const now = new Date();
  const diffMs = now.getTime() - startTime.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);

  if (diffHours > 0) {
    const remainingMinutes = diffMinutes % 60;
    return `${diffHours}h ${remainingMinutes}m`;
  } else if (diffMinutes > 0) {
    const remainingSeconds = diffSeconds % 60;
    return `${diffMinutes}m ${remainingSeconds}s`;
  } else {
    return `${diffSeconds}s`;
  }
};

export const MetricDashboard: React.FC = () => {
  const { metrics, adjustMetric, incidentIoConfig, updateIncidentIoConfig } = useMetricSimulator();

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
        
        {/* Incident.io Configuration */}
        <div className="mb-6">
          <IncidentIoConfigComponent
            config={incidentIoConfig}
            onConfigChange={updateIncidentIoConfig}
          />
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-2 gap-4">
          {Object.entries(metrics).map(([key, metric]) => {
            const metricType = key as MetricType;
            const config = getMetricConfig(metricType);
            const steps = getMetricStepSizes(metricType);
            const currentAdjustment = metric.adjustment;
            const alertColor = getAlertColor(metric.alertState);
            const isAlerting = metric.alertState.isAlerting;
            
            return (
              <div 
                key={metricType} 
                className={`bg-white rounded-lg shadow-sm border-2 p-4 transition-all duration-300 ${
                  isAlerting 
                    ? 'border-current shadow-lg' 
                    : 'border-gray-200'
                }`}
                style={{ borderColor: isAlerting ? alertColor : undefined }}
              >
                {/* Header with title, alert badge, and adjustment controls */}
                <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-100">
                  <div className="flex items-center gap-3">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{config.name}</h3>
                      {config.description && (
                        <p className="text-xs text-gray-500 mt-1">{config.description}</p>
                      )}
                    </div>
                    
                    {/* Alert Priority Badge - Show only highest priority */}
                    {isAlerting && metric.alertState.activeThresholds.length > 0 && (
                      <div className="flex gap-1">
                        {(() => {
                          // Get the highest priority threshold (lowest number = highest priority)
                          const priorities = { P0: 0, P1: 1, P2: 2, P3: 3, P4: 4 };
                          const highestPriorityThreshold = metric.alertState.activeThresholds
                            .sort((a, b) => priorities[a.threshold.priority] - priorities[b.threshold.priority])[0];
                          
                          return (
                            <div 
                              className="px-2 py-1 rounded-full text-xs font-bold text-white shadow-sm"
                              style={{ backgroundColor: ALERT_COLORS[highestPriorityThreshold.threshold.priority] }}
                            >
                              {highestPriorityThreshold.threshold.priority}
                            </div>
                          );
                        })()}
                      </div>
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
                
                {/* Alert Description - Show only highest priority */}
                {isAlerting && metric.alertState.activeThresholds.length > 0 && (
                  (() => {
                    // Get the highest priority threshold (lowest number = highest priority)
                    const priorities = { P0: 0, P1: 1, P2: 2, P3: 3, P4: 4 };
                    const highestPriorityThreshold = metric.alertState.activeThresholds
                      .sort((a, b) => priorities[a.threshold.priority] - priorities[b.threshold.priority])[0];
                    
                    return (
                      <div 
                        className="mb-4 p-2 rounded-md text-sm font-medium"
                        style={{ 
                          backgroundColor: `${ALERT_COLORS[highestPriorityThreshold.threshold.priority]}15`,
                          color: ALERT_COLORS[highestPriorityThreshold.threshold.priority],
                          border: `1px solid ${ALERT_COLORS[highestPriorityThreshold.threshold.priority]}30`
                        }}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="font-semibold">
                              🚨 {highestPriorityThreshold.threshold.priority}: {highestPriorityThreshold.threshold.description}
                            </div>
                          </div>
                          <div className="flex flex-row items-end gap-1">
                            <div 
                              className="px-2 py-1 rounded-full text-xs font-medium text-white min-w-[80px] text-center"
                              style={{
                                backgroundColor: ALERT_COLORS[highestPriorityThreshold.threshold.priority]
                              }}
                            >
                              {formatDuration(highestPriorityThreshold.triggeredAt!)}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })()
                )}
                
                {/* Main content area */}
                <div className="grid grid-cols-3 gap-4">
                  {/* Chart takes up 2/3 of the space */}
                  <div className="col-span-2">
                    <div className="bg-gray-50 rounded-md p-3">
                      <MetricChart
                        title=""
                        unit={config.unit}
                        dataPoints={metric.dataPoints.slice(-120)} // Last 2 minutes
                        color={alertColor}
                        alertThresholds={config.alertThresholds}
                      />
                      
                      {/* Threshold Legend */}
                      {config.alertThresholds.length > 0 && (
                        <div className="flex gap-3 mt-2 text-xs">
                          {config.alertThresholds.map(threshold => (
                            <div key={threshold.priority} className="flex items-center gap-1">
                              <div 
                                className="w-3 h-0.5 border-dashed border-t-2"
                                style={{ borderColor: ALERT_COLORS[threshold.priority] }}
                              />
                              <span className="text-gray-600">
                                {threshold.priority}: {threshold.threshold}{config.unit}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Stats take up 1/3 of the space */}
                  <div className="col-span-1">
                    <MetricStatsDisplay
                      title=""
                      unit={config.unit}
                      stats={metric.stats}
                      alertState={metric.alertState}
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