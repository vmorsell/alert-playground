import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  TimeScale,
} from 'chart.js';
import 'chartjs-adapter-date-fns';
import type { MetricDataPoint } from '../types/metrics';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  TimeScale
);

interface MetricChartProps {
  title: string;
  unit: string;
  dataPoints: MetricDataPoint[];
  color?: string;
}

export const MetricChart: React.FC<MetricChartProps> = ({ 
  title, 
  unit, 
  dataPoints, 
  color = '#3b82f6' 
}) => {
  const now = new Date();
  const twoMinutesAgo = new Date(now.getTime() - 120 * 1000); // 120 seconds ago

  const chartData = {
    datasets: [
      {
        label: title || 'Value',
        data: dataPoints.map(point => ({
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
          label: (context: any) => {
            return `${context.parsed.y.toFixed(2)} ${unit}`;
          },
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
          callback: function(value: any) {
            return `${value.toFixed(1)} ${unit}`;
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