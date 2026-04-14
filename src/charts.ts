import {
  Chart,
  LineController,
  LineElement,
  PointElement,
  LinearScale,
  TimeScale,
  Tooltip,
  Legend,
  Filler
} from "chart.js";
import type { ChartDataset, ChartOptions } from "chart.js";
import "chartjs-adapter-date-fns";

Chart.register(LineController, LineElement, PointElement, LinearScale, TimeScale, Tooltip, Legend, Filler);

export interface Point {
  t: Date;
  value: number;
}

const MAX_POINTS = 3500;

export function decimate(points: Point[]): Point[] {
  if (points.length <= MAX_POINTS) return points;
  const step = Math.ceil(points.length / MAX_POINTS);
  const out: Point[] = [];
  for (let i = 0; i < points.length; i += step) out.push(points[i]);
  const last = points[points.length - 1];
  if (last && out[out.length - 1]?.t.getTime() !== last.t.getTime()) out.push(last);
  return out;
}

function timeScaleBase(): ChartOptions<"line">["scales"] {
  return {
    x: {
      type: "time",
      time: { tooltipFormat: "MMM d, h:mm a" },
      grid: { color: "rgba(15, 23, 42, 0.06)" },
      ticks: { maxRotation: 0, autoSkip: true, maxTicksLimit: 8 }
    }
  };
}

export function renderMetricChart(
  canvas: HTMLCanvasElement,
  points: Point[],
  label: string,
  color: string,
  yTitle: string
): Chart<"line"> {
  const main = points.map((p) => ({ x: p.t.getTime(), y: p.value }));
  const datasets: ChartDataset<"line">[] = [
    {
      type: "line",
      label,
      data: main,
      borderColor: color,
      backgroundColor: "transparent",
      fill: false,
      tension: 0.15,
      pointRadius: 0,
      borderWidth: 2.5
    }
  ];

  return new Chart<"line">(canvas, {
    type: "line",
    data: { datasets },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: "index", intersect: false },
      plugins: {
        legend: {
          display: true,
          position: "bottom",
          labels: { boxWidth: 12, usePointStyle: true }
        }
      },
      scales: {
        ...timeScaleBase(),
        y: {
          grid: { color: "rgba(15, 23, 42, 0.06)" },
          title: {
            display: true,
            text: yTitle,
            color: "rgb(71, 85, 105)"
          }
        }
      }
    }
  });
}
