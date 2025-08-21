import React from 'react';
import { ALERT_COLORS } from '../config/metrics';
import type { AlertManagerReturn } from '../hooks/useAlertManager';
import { formatDuration, formatResolveDelay } from '../utils/formatters';

interface AlertDisplayProps {
  metricName: string;
  alertManager?: AlertManagerReturn;
}

export const AlertDisplay: React.FC<AlertDisplayProps> = ({
  metricName,
  alertManager,
}) => {
  const isAlerting = alertManager?.isMetricAlerting(metricName) || false;
  const activeThresholds =
    alertManager
      ?.getThresholdsForMetric(metricName)
      .filter((t) => !t.isHealthy) || [];

  if (!isAlerting || activeThresholds.length === 0) {
    return null;
  }

  const activeThreshold = activeThresholds[0];
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
            {isPendingResolve ? '🟡' : '🚨'} {alert.priority}: Alert Active
            {isPendingResolve && activeThreshold.pendingResolveAt && (
              <span className="text-xs font-normal ml-2 opacity-75">
                (pending resolve in{' '}
                {formatResolveDelay(
                  activeThreshold.pendingResolveAt,
                  activeThreshold.resolveDelaySeconds,
                  new Date(),
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
            {formatDuration(alert.triggeredAt, new Date())}
          </div>
        </div>
      </div>
    </div>
  );
};
