import React from 'react';
import {
  ALERT_COLORS,
  getMetricConfig,
  getMetricStepSizes,
} from '../config/metrics';
import type { AlertManagerReturn } from '../hooks/useAlertManager';
import type { IncidentIoConfig, Metric } from '../types/metrics';
import { IncidentIoConfigComponent } from './IncidentIoConfig';
import { MetricChart } from './MetricChart';
import { MetricStatsDisplay } from './MetricStats';

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

const formatResolveDelay = (
  pendingResolveAt: Date,
  resolveDelaySeconds: number,
): string => {
  const now = new Date();
  const elapsedMs = now.getTime() - pendingResolveAt.getTime();
  const elapsedSeconds = Math.floor(elapsedMs / 1000);
  const remainingSeconds = Math.max(0, resolveDelaySeconds - elapsedSeconds);

  const minutes = Math.floor(remainingSeconds / 60);
  const seconds = remainingSeconds % 60;

  if (minutes > 0) {
    return `${minutes}m ${seconds}s`;
  } else {
    return `${seconds}s`;
  }
};

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
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Alert Playground
          </h1>
          <p className="text-sm text-gray-600 mb-3">
            Real-time metrics monitoring and alerting simulation platform
          </p>
        </div>

        {/* Incident.io Configuration */}
        <div className="mb-6">
          <IncidentIoConfigComponent
            config={incidentIoConfig}
            onConfigChange={updateIncidentIoConfig}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-2 gap-4">
          {Object.entries(metrics).map(([key, metric]) => {
            const metricName = key;
            const config = getMetricConfig(metricName);
            const steps = getMetricStepSizes(metricName);
            const currentAdjustment = metric.adjustment;

            const isAlerting =
              alertManager?.isMetricAlerting(metricName) || false;
            const highestPriorityAlert =
              alertManager?.getHighestPriorityAlertForMetric(metricName);
            const activeThresholds =
              alertManager
                ?.getThresholdsForMetric(metricName)
                .filter((t) => !t.isHealthy) || [];
            const alertColor = highestPriorityAlert
              ? ALERT_COLORS[highestPriorityAlert.priority]
              : '#10b981';

            return (
              <div
                key={metricName}
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
                        <p className="text-xs text-gray-500 mt-1">
                          {config.description}
                        </p>
                      )}
                    </div>

                    {/* Alert Priority Badge - Show only highest priority */}
                    {isAlerting && highestPriorityAlert && (
                      <div className="flex gap-1">
                        <div
                          className="px-2 py-1 rounded-full text-xs font-bold text-white shadow-sm"
                          style={{
                            backgroundColor:
                              ALERT_COLORS[highestPriorityAlert.priority],
                          }}
                        >
                          {highestPriorityAlert.priority}
                        </div>
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
                        onClick={() =>
                          handleAdjustment(metricName, -steps.large)
                        }
                        className="px-2 py-1 text-xs font-medium text-red-700 bg-red-50 border border-red-200 rounded hover:bg-red-100 transition-colors"
                        title={`Decrease by ${steps.large} ${config.unit}`}
                      >
                        --
                      </button>

                      {/* Small decrease */}
                      <button
                        onClick={() =>
                          handleAdjustment(metricName, -steps.small)
                        }
                        className="px-2 py-1 text-xs font-medium text-red-600 bg-red-50 border border-red-200 rounded hover:bg-red-100 transition-colors"
                        title={`Decrease by ${steps.small} ${config.unit}`}
                      >
                        -
                      </button>

                      {/* Reset */}
                      <button
                        onClick={() => resetAdjustment(metricName)}
                        className="px-2 py-1 text-xs font-medium text-gray-600 bg-gray-50 border border-gray-200 rounded hover:bg-gray-100 transition-colors"
                        title="Reset to baseline"
                      >
                        0
                      </button>

                      {/* Small increase */}
                      <button
                        onClick={() =>
                          handleAdjustment(metricName, steps.small)
                        }
                        className="px-2 py-1 text-xs font-medium text-green-600 bg-green-50 border border-green-200 rounded hover:bg-green-100 transition-colors"
                        title={`Increase by ${steps.small} ${config.unit}`}
                      >
                        +
                      </button>

                      {/* Large increase */}
                      <button
                        onClick={() =>
                          handleAdjustment(metricName, steps.large)
                        }
                        className="px-2 py-1 text-xs font-medium text-green-700 bg-green-50 border border-green-200 rounded hover:bg-green-100 transition-colors"
                        title={`Increase by ${steps.large} ${config.unit}`}
                      >
                        ++
                      </button>
                    </div>
                  </div>
                </div>

                {/* Alert Description - Show only highest priority */}
                {isAlerting &&
                  activeThresholds.length > 0 &&
                  (() => {
                    const activeThreshold = activeThresholds[0]; // Get the first active threshold
                    const alert = activeThreshold.activeAlert;

                    if (!alert) return null;

                    const isPendingResolve = activeThreshold.isPendingResolve;

                    return (
                      <div
                        className="mb-4 p-2 rounded-md text-sm font-medium"
                        style={{
                          backgroundColor: `${ALERT_COLORS[alert.priority]}15`,
                          color: ALERT_COLORS[alert.priority],
                          border: `1px solid ${ALERT_COLORS[alert.priority]}30`,
                        }}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="font-semibold">
                              {isPendingResolve ? '🟡' : '🚨'} {alert.priority}:
                              Alert Active
                              {isPendingResolve &&
                                activeThreshold.pendingResolveAt && (
                                  <span className="text-xs font-normal ml-2 opacity-75">
                                    (pending resolve in{' '}
                                    {formatResolveDelay(
                                      activeThreshold.pendingResolveAt,
                                      activeThreshold.resolveDelaySeconds,
                                    )}
                                    )
                                  </span>
                                )}
                            </div>
                          </div>
                          <div className="flex flex-row items-end gap-1">
                            <div
                              className="px-2 py-1 rounded-full text-xs font-medium text-white min-w-[80px] text-center"
                              style={{
                                backgroundColor: ALERT_COLORS[alert.priority],
                              }}
                            >
                              {formatDuration(alert.triggeredAt)}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })()}

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
                                    ({threshold.resolveDelaySeconds}s resolve
                                    delay)
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
          })}
        </div>

        {/* Footer */}
        <footer className="mt-8 pt-6 border-t border-gray-200">
          <div className="text-center">
            <a
              href="https://github.com/vmorsell/alert-playground"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-3 py-1 text-blue-600 bg-blue-50 border border-blue-200 rounded-md hover:bg-blue-100 transition-colors text-sm"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
              </svg>
              View on GitHub
            </a>
          </div>
        </footer>
      </div>
    </div>
  );
};
