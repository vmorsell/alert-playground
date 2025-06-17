import { Line } from 'react-chartjs-2';
import {
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  TimeScale,
  Title,
  Tooltip,
} from 'chart.js';
import 'chartjs-adapter-date-fns';
import { ALERT_COLORS } from '../config/metrics';
import type { AlertThreshold, MetricDataPoint } from '../types/metrics';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  TimeScale,
);

interface MetricChartProps {
  title: string;
  unit: string;
  dataPoints: MetricDataPoint[];
  color?: string;
  alertThresholds?: AlertThreshold[];
}

export const MetricChart: React.FC<MetricChartProps> = ({
  title,
  unit,
  dataPoints,
  color = '#3b82f6',
  alertThresholds = [],
}) => {
  const now = new Date();
  const twoMinutesAgo = new Date(now.getTime() - 120 * 1000); // 120 seconds ago

  // Create threshold datasets
  const thresholdDatasets = alertThresholds.map((threshold) => ({
    label: `${threshold.priority} Threshold`,
    data: [
      { x: twoMinutesAgo.getTime(), y: threshold.threshold },
      { x: now.getTime(), y: threshold.threshold },
    ],
    borderColor: ALERT_COLORS[threshold.priority],
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderDash: [5, 5],
    pointRadius: 0,
    pointHoverRadius: 0,
    fill: false,
    tension: 0,
  }));

  const chartData = {
    datasets: [
      {
        label: title || 'Value',
        data: dataPoints.map((point) => ({
          x: point.timestamp.getTime(),
          y: point.value,
        })),
        borderColor: color,
        backgroundColor: color + '20',
        borderWidth: 2,
        pointRadius: 0,
        pointHoverRadius: 3,
        fill: true,
        tension: 0.3,
      },
      ...thresholdDatasets,
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      title: {
        display: !!title,
        text: title,
        font: {
          size: 14,
          weight: 'bold' as const,
        },
      },
      tooltip: {
        callbacks: {
          label: (context: {
            dataset: { label?: string };
            parsed: { y: number };
          }) => {
            const datasetLabel = context.dataset.label;
            if (datasetLabel && datasetLabel.includes('Threshold')) {
              return `${datasetLabel}: ${context.parsed.y.toFixed(2)} ${unit}`;
            }
            return `${context.parsed.y.toFixed(2)} ${unit}`;
          },
        },
        filter: (tooltipItem: {
          dataset: { label?: string };
          datasetIndex: number;
        }) => {
          // Only show tooltip for the main data line when hovering over threshold lines
          return (
            !tooltipItem.dataset.label?.includes('Threshold') ||
            tooltipItem.datasetIndex === 0
          );
        },
      },
    },
    scales: {
      x: {
        type: 'time' as const,
        min: twoMinutesAgo.getTime(),
        max: now.getTime(),
        time: {
          unit: 'second' as const,
          displayFormats: {
            second: 'HH:mm:ss',
          },
        },
        grid: {
          display: true,
          color: 'rgba(0, 0, 0, 0.05)',
        },
        ticks: {
          maxTicksLimit: 6,
          font: {
            size: 10,
          },
        },
      },
      y: {
        beginAtZero: false,
        grid: {
          display: true,
          color: 'rgba(0, 0, 0, 0.05)',
        },
        ticks: {
          font: {
            size: 10,
          },
          callback: function (value: string | number) {
            return `${Number(value).toFixed(1)} ${unit}`;
          },
        },
      },
    },
    animation: {
      duration: 0, // Disable animations for real-time updates
    },
    interaction: {
      intersect: false,
      mode: 'index' as const,
    },
  };

  return (
    <div className="chart-container" style={{ height: '160px', width: '100%' }}>
      <Line data={chartData} options={options} />
    </div>
  );
};
