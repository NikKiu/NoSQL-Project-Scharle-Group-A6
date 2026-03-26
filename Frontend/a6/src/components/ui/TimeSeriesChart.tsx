import {
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  Tooltip
} from 'chart.js'
import { Line } from 'react-chartjs-2'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend)

export interface TimeSeriesPoint {
  label: string
  value: number
}

interface TimeSeriesChartProps {
  title: string
  points: TimeSeriesPoint[]
  color?: string
  unit?: string
}

export function TimeSeriesChart({ title, points, color = '#2563eb', unit }: TimeSeriesChartProps) {
  const labels = points.map((point) => point.label)
  const values = points.map((point) => point.value)

  const data = {
    labels,
    datasets: [
      {
        label: unit ? `${title} (${unit})` : title,
        data: values,
        borderColor: color,
        backgroundColor: `${color}33`,
        borderWidth: 2,
        tension: 0.35,
        fill: true,
        pointRadius: 2.5,
        pointHoverRadius: 4
      }
    ]
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'top' as const
      },
      tooltip: {
        callbacks: {
          label: (context: any) => {
            const value = Number(context?.parsed?.y ?? 0)
            return unit ? `${value.toFixed(2)} ${unit}` : value.toFixed(2)
          }
        }
      }
    },
    scales: {
      x: {
        grid: {
          color: '#edf3fb'
        },
        ticks: {
          maxRotation: 0,
          autoSkip: true,
          maxTicksLimit: 8
        }
      },
      y: {
        beginAtZero: false,
        grid: {
          color: '#edf3fb'
        }
      }
    }
  }

  return (
    <div className="timeseries-chart">
      <Line data={data} options={options} />
    </div>
  )
}

