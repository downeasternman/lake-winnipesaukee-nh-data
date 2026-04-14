export type Mode = "lake" | "ocean";

export type MetricKey = "temperature" | "lakeLevel" | "inflow" | "outflow" | "waveHeight";

export interface LocationConfig {
  slug: string;
  displayName: string;
  mode: Mode;
  chartOrder: MetricKey[];
  finalSources: Record<string, Record<string, string>>;
}

export interface ChartSeries {
  metric: MetricKey;
  label: string;
  unit: string;
  points: Array<{ ts: number; value: number }>;
}
