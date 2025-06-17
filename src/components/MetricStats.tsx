import { getAlertColor } from '../config/metrics';
import type { AlertState, MetricStats } from '../types/metrics';

interface MetricStatsProps {
  title: string;
  unit: string;
  stats: MetricStats;
  alertState?: AlertState;
}

export const MetricStatsDisplay: React.FC<MetricStatsProps> = ({
  unit,
  stats,
  alertState,
}) => {
  const formatValue = (value: number): string => {
    return value.toFixed(2);
  };

  const alertColor = alertState ? getAlertColor(alertState) : '#374151'; // Default gray-700

  return (
    <div className="space-y-4">
      {/* Current Value */}
      <div className="text-right">
        <div
          className="text-3xl font-bold transition-colors duration-300"
          style={{ color: alertColor }}
        >
          {formatValue(stats.current)} {unit}
        </div>
      </div>

      {/* Rolling Stats Table */}
      <div className="overflow-hidden">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="text-left text-gray-500 font-medium py-1"></th>
              <th className="text-center text-gray-500 font-medium py-1">1m</th>
              <th className="text-center text-gray-500 font-medium py-1">5m</th>
              <th className="text-center text-gray-500 font-medium py-1">
                15m
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            <tr>
              <td className="py-1 font-medium text-gray-700">Min</td>
              <td className="text-center py-1">
                {formatValue(stats.rolling1Min.min)}
              </td>
              <td className="text-center py-1">
                {formatValue(stats.rolling5Min.min)}
              </td>
              <td className="text-center py-1">
                {formatValue(stats.rolling15Min.min)}
              </td>
            </tr>
            <tr>
              <td className="py-1 font-medium text-gray-700">Avg</td>
              <td className="text-center py-1">
                {formatValue(stats.rolling1Min.avg)}
              </td>
              <td className="text-center py-1">
                {formatValue(stats.rolling5Min.avg)}
              </td>
              <td className="text-center py-1">
                {formatValue(stats.rolling15Min.avg)}
              </td>
            </tr>
            <tr>
              <td className="py-1 font-medium text-gray-700">Max</td>
              <td className="text-center py-1">
                {formatValue(stats.rolling1Min.max)}
              </td>
              <td className="text-center py-1">
                {formatValue(stats.rolling5Min.max)}
              </td>
              <td className="text-center py-1">
                {formatValue(stats.rolling15Min.max)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};
