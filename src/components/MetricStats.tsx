import type { MetricStats } from '../types/metrics';

interface MetricStatsProps {
  title: string;
  unit: string;
  stats: MetricStats;
}

export const MetricStatsDisplay: React.FC<MetricStatsProps> = ({ title, unit, stats }) => {
  const formatValue = (value: number): string => {
    return value.toFixed(2);
  };

  return (
    <div className="metric-stats">
      <h4>{title}</h4>
      
      <div className="current-value">
        <span className="label">Current:</span>
        <span className="value">{formatValue(stats.current)} {unit}</span>
      </div>
      
      <div className="rolling-stats">
        <div className="time-period">
          <h5>1 Minute</h5>
          <div className="stats-row">
            <span>Avg: {formatValue(stats.rolling1Min.avg)} {unit}</span>
            <span>Min: {formatValue(stats.rolling1Min.min)} {unit}</span>
            <span>Max: {formatValue(stats.rolling1Min.max)} {unit}</span>
          </div>
        </div>
        
        <div className="time-period">
          <h5>5 Minutes</h5>
          <div className="stats-row">
            <span>Avg: {formatValue(stats.rolling5Min.avg)} {unit}</span>
            <span>Min: {formatValue(stats.rolling5Min.min)} {unit}</span>
            <span>Max: {formatValue(stats.rolling5Min.max)} {unit}</span>
          </div>
        </div>
        
        <div className="time-period">
          <h5>15 Minutes</h5>
          <div className="stats-row">
            <span>Avg: {formatValue(stats.rolling15Min.avg)} {unit}</span>
            <span>Min: {formatValue(stats.rolling15Min.min)} {unit}</span>
            <span>Max: {formatValue(stats.rolling15Min.max)} {unit}</span>
          </div>
        </div>
      </div>
    </div>
  );
}; 