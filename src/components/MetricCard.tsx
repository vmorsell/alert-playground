import React from 'react';
import { ALERT_COLORS, getMetricConfig } from '../config/metrics';
import type { AlertManagerReturn } from '../hooks/useAlertManager';
import type { Metric } from '../types/metrics';
import { AlertDisplay } from './AlertDisplay';
import { MetricChart } from './MetricChart';
import { MetricControls } from './MetricControls';
import { MetricStatsDisplay } from './MetricStats';

interface MetricCardProps {
  metricName: string;
  metric: Metric;
  alertManager?: AlertManagerReturn;
  onAdjustment: (metricName: string, adjustment: number) => void;
  onReset: (metricName: string) => void;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  metricName,
  metric,
  alertManager,
  onAdjustment,
  onReset,
}) => {
  const config = getMetricConfig(metricName);

  const isAlerting = alertManager?.isMetricAlerting(metricName) || false;
  const highestPriorityAlert =
    alertManager?.getHighestPriorityAlertForMetric(metricName);
  const alertColor = highestPriorityAlert
    ? ALERT_COLORS[highestPriorityAlert.priority]
    : '#10b981';

  return (
    <div
      className={`bg-white rounded-lg shadow-sm border-2 p-4 transition-all duration-300 ${
        isAlerting ? 'border-current shadow-lg' : 'border-gray-200'
      }`}
      style={{ borderColor: isAlerting ? alertColor : undefined }}
    >
      {/* Header with title, alert badge, and adjustment controls */}
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              {config.name}
            </h3>
            {config.description && (
              <p className="text-xs text-gray-500 mt-1">{config.description}</p>
            )}
          </div>

          {/* Alert Priority Badge - Show only highest priority */}
          {isAlerting && highestPriorityAlert && (
            <div className="flex gap-1">
              <div
                className="px-2 py-1 rounded-full text-xs font-bold text-white shadow-sm"
                style={{
                  backgroundColor: ALERT_COLORS[highestPriorityAlert.priority],
                }}
              >
                {highestPriorityAlert.priority}
              </div>
            </div>
          )}
        </div>

        <MetricControls
          metricName={metricName}
          metric={metric}
          onAdjustment={onAdjustment}
          onReset={onReset}
        />
      </div>

      {/* Alert Description */}
      <AlertDisplay metricName={metricName} alertManager={alertManager} />

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
                {config.alertThresholds.map((threshold) => (
                  <div
                    key={threshold.priority}
                    className="flex items-center gap-1"
                  >
                    <div
                      className="w-3 h-0.5 border-dashed border-t-2"
                      style={{
                        borderColor: ALERT_COLORS[threshold.priority],
                      }}
                    />
                    <span className="text-gray-600">
                      {threshold.priority}: {threshold.threshold}
                      {config.unit}
                      {threshold.resolveDelaySeconds && (
                        <span className="text-gray-400 ml-1">
                          ({threshold.resolveDelaySeconds}s resolve delay)
                        </span>
                      )}
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
            color={alertColor}
          />
        </div>
      </div>
    </div>
  );
};
