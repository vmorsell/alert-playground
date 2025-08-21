import React from 'react';
import { getMetricStepSizes } from '../config/metrics';
import type { Metric } from '../types/metrics';

interface MetricControlsProps {
  metricName: string;
  metric: Metric;
  onAdjustment: (metricName: string, adjustment: number) => void;
  onReset: (metricName: string) => void;
}

export const MetricControls: React.FC<MetricControlsProps> = ({
  metricName,
  metric,
  onAdjustment,
  onReset,
}) => {
  const steps = getMetricStepSizes(metricName);
  const currentAdjustment = metric.adjustment;

  const handleAdjustment = (delta: number) => {
    onAdjustment(metricName, currentAdjustment + delta);
  };

  const handleReset = () => {
    onReset(metricName);
  };

  return (
    <div className="flex items-center gap-2">
      {/* Current adjustment display */}
      <div className="text-sm text-gray-600 min-w-[80px] text-center">
        {currentAdjustment > 0 && '+'}
        {currentAdjustment.toFixed(1)} {metric.unit}
      </div>

      {/* Adjustment buttons */}
      <div className="flex items-center gap-1">
        {/* Large decrease */}
        <button
          onClick={() => handleAdjustment(-steps.large)}
          className="px-2 py-1 text-xs font-medium text-red-700 bg-red-50 border border-red-200 rounded hover:bg-red-100 transition-colors"
          title={`Decrease by ${steps.large} ${metric.unit}`}
        >
          --
        </button>

        {/* Small decrease */}
        <button
          onClick={() => handleAdjustment(-steps.small)}
          className="px-2 py-1 text-xs font-medium text-red-600 bg-red-50 border border-red-200 rounded hover:bg-red-100 transition-colors"
          title={`Decrease by ${steps.small} ${metric.unit}`}
        >
          -
        </button>

        {/* Reset */}
        <button
          onClick={handleReset}
          className="px-2 py-1 text-xs font-medium text-gray-600 bg-gray-50 border border-gray-200 rounded hover:bg-gray-100 transition-colors"
          title="Reset to baseline"
        >
          0
        </button>

        {/* Small increase */}
        <button
          onClick={() => handleAdjustment(steps.small)}
          className="px-2 py-1 text-xs font-medium text-green-600 bg-green-50 border border-green-200 rounded hover:bg-green-100 transition-colors"
          title={`Increase by ${steps.small} ${metric.unit}`}
        >
          +
        </button>

        {/* Large increase */}
        <button
          onClick={() => handleAdjustment(steps.large)}
          className="px-2 py-1 text-xs font-medium text-green-700 bg-green-50 border border-green-200 rounded hover:bg-green-100 transition-colors"
          title={`Increase by ${steps.large} ${metric.unit}`}
        >
          ++
        </button>
      </div>
    </div>
  );
};
