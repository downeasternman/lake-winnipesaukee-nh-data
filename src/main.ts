import "./styles.css";
import locationConfig from "./locationConfig";
import type { ChartSeries, MetricKey } from "./types";

const metricLabels: Record<MetricKey, { label: string; unit: string }> = {
  temperature: { label: "Water Temperature", unit: "F" },
  lakeLevel: { label: "Lake Level", unit: "ft" },
  inflow: { label: "Inflow", unit: "cfs" },
  outflow: { label: "Outflow", unit: "cfs" },
  waveHeight: { label: "Wave Height", unit: "ft" }
};

function makeDemoSeries(metric: MetricKey): ChartSeries {
  const now = Date.now();
  const points = Array.from({ length: 24 }).map((_, idx) => {
    const ts = now - (23 - idx) * 60 * 60 * 1000;
    const base = metric === "temperature" ? 58 : metric === "waveHeight" ? 2.5 : 1200;
    const wave = Math.sin(idx / 3) * (metric === "temperature" ? 4 : 0.8);
    return { ts, value: Number((base + wave).toFixed(2)) };
  });

  return {
    metric,
    label: metricLabels[metric].label,
    unit: metricLabels[metric].unit,
    points
  };
}

function drawSparkline(points: Array<{ value: number }>): string {
  const values = points.map((p) => p.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = Math.max(max - min, 0.01);
  const width = 100;
  const height = 36;
  const coords = points.map((p, i) => {
    const x = (i / (points.length - 1)) * width;
    const y = height - ((p.value - min) / range) * height;
    return `${x},${y}`;
  });
  return `<svg viewBox="0 0 ${width} ${height}" preserveAspectRatio="none"><polyline points="${coords.join(
    " "
  )}" /></svg>`;
}

function renderApp(): void {
  const root = document.querySelector<HTMLDivElement>("#app");
  if (!root) return;

  const chartOrder = locationConfig.chartOrder;
  const first = chartOrder[0];
  if (first !== "temperature") {
    throw new Error("Temperature must be first chart.");
  }

  const cards = chartOrder
    .map((metric) => {
      const series = makeDemoSeries(metric);
      const latest = series.points[series.points.length - 1].value;
      return `<article class="card">
        <h2>${series.label}</h2>
        <p class="value">${latest} ${series.unit}</p>
        <div class="chart">${drawSparkline(series.points)}</div>
      </article>`;
    })
    .join("");

  root.innerHTML = `<main>
    <header>
      <h1>${locationConfig.displayName}</h1>
      <p>Live-ready layout. Wire final NOAA/USGS IDs in location config.</p>
    </header>
    <section class="grid">${cards}</section>
  </main>`;
}

renderApp();
