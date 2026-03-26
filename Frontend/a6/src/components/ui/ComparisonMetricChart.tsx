import {
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LineElement,
  LinearScale,
  PointElement,
  Tooltip,
  type ChartData,
  type ChartOptions,
  type TooltipItem
} from 'chart.js'
import { Bar, Line } from 'react-chartjs-2'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Tooltip, Legend)

export type ComparisonChartType = 'line' | 'bar' | 'horizontalBar'

export interface ComparisonMetricDataset {
  label: string
  values: Array<number | null>
  color?: string
}

interface ComparisonMetricChartProps {
  title: string
  labels: string[]
  datasets: ComparisonMetricDataset[]
  chartType: ComparisonChartType
  unit?: string
}

const DEFAULT_COLORS = ['#2563eb', '#0f766e', '#7c3aed', '#dc2626', '#0891b2', '#ea580c']

function getParsedTooltipValue(
  context: TooltipItem<'bar'> | TooltipItem<'line'>,
  chartType: ComparisonChartType
): number {
  const parsed = context.parsed as { x?: number; y?: number }

  // Horizontal bar charts encode the quantitative value on the x-axis.
  if (chartType === 'horizontalBar' && typeof parsed.x === 'number') {
    return parsed.x
  }

  if (typeof parsed.y === 'number') {
    return parsed.y
  }

  if (typeof parsed.x === 'number') {
    return parsed.x
  }

  return 0
}

export function ComparisonMetricChart({ title, labels, datasets, chartType, unit }: ComparisonMetricChartProps) {
  const normalizedDatasets = datasets.map((dataset, index) => {
    const color = dataset.color ?? DEFAULT_COLORS[index % DEFAULT_COLORS.length]
    return {
      label: dataset.label,
      data: dataset.values,
      borderColor: color,
      backgroundColor: `${color}66`,
      pointBackgroundColor: color,
      borderWidth: 2,
      pointRadius: chartType === 'line' ? 3 : 0,
      pointHoverRadius: chartType === 'line' ? 5 : 0,
      tension: 0.3,
      maxBarThickness: 56,
      borderRadius: chartType === 'line' ? 0 : 8
    }
  })

  if (chartType === 'line') {
    const lineData: ChartData<'line'> = {
      labels,
      datasets: normalizedDatasets
    }

    const lineOptions: ChartOptions<'line'> = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: true,
          position: 'top'
        },
        tooltip: {
          callbacks: {
            label: (context) => {
              const value = getParsedTooltipValue(context, chartType)
              return unit
                ? `${context.dataset.label}: ${value.toFixed(2)} ${unit}`
                : `${context.dataset.label}: ${value.toFixed(2)}`
            }
          }
        }
      },
      scales: {
        x: {
          grid: {
            color: '#edf3fb'
          }
        },
        y: {
          beginAtZero: true,
          grid: {
            color: '#edf3fb'
          }
        }
      }
    }

    return (
      <div className="timeseries-chart comparison-chart-tile">
        <p className="chart-title">{title}</p>
        <Line data={lineData} options={lineOptions} />
      </div>
    )
  }

  const barData: ChartData<'bar'> = {
    labels,
    datasets: normalizedDatasets
  }

  const barOptions: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    indexAxis: chartType === 'horizontalBar' ? 'y' : 'x',
    plugins: {
      legend: {
        display: true,
        position: 'top'
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            const value = getParsedTooltipValue(context, chartType)
            return unit
              ? `${context.dataset.label}: ${value.toFixed(2)} ${unit}`
              : `${context.dataset.label}: ${value.toFixed(2)}`
          }
        }
      }
    },
    scales: {
      x: {
        grid: {
          color: '#edf3fb'
        }
      },
      y: {
        beginAtZero: true,
        grid: {
          color: '#edf3fb'
        }
      }
    }
  }

  return (
    <div className="timeseries-chart comparison-chart-tile">
      <p className="chart-title">{title}</p>
      <Bar data={barData} options={barOptions} />
    </div>
  )
}
