import type { MetricStats } from '../types/metrics';

interface MetricStatsProps {
  title: string;
  unit: string;
  stats: MetricStats;
}

export const MetricStatsDisplay: React.FC<MetricStatsProps> = ({ unit, stats }) => {
  const formatValue = (value: number): string => {
    return value.toFixed(2);
  };

  return (
    <div className="space-y-3">
      {/* Current Value */}
      <div className="bg-white border border-gray-200 rounded-md p-3">
        <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
          Current
        </div>
        <div className="text-lg font-bold text-gray-900">
          {formatValue(stats.current)} {unit}
        </div>
      </div>
      
      {/* Rolling Stats */}
      <div className="space-y-2">
        {[
          { label: '1m', data: stats.rolling1Min },
          { label: '5m', data: stats.rolling5Min },
          { label: '15m', data: stats.rolling15Min },
        ].map(({ label, data }) => (
          <div key={label} className="bg-white border border-gray-200 rounded-md p-2">
            <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
              {label}
            </div>
            <div className="grid grid-cols-3 gap-1 text-xs">
              <div className="text-center">
                <div className="text-gray-500">Avg</div>
                <div className="font-medium">{formatValue(data.avg)}</div>
              </div>
              <div className="text-center">
                <div className="text-gray-500">Min</div>
                <div className="font-medium">{formatValue(data.min)}</div>
              </div>
              <div className="text-center">
                <div className="text-gray-500">Max</div>
                <div className="font-medium">{formatValue(data.max)}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}; 