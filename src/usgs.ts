import type { Point } from "./charts";

const SITE_LEVEL = "01078000";
const SITE_INFLOW = "01074520";
const SITE_OUTFLOW = "01078000";
const SITE_TEMP = "01078000";
const PARAM_FLOW = "00060";
const PARAM_TEMP_C = "00010";
const PARAM_LEVEL = "00065";

export type PresetPeriod = "P1D" | "P7D" | "P30D";
export type IvRequest =
  | { kind: "preset"; period: PresetPeriod }
  | { kind: "range"; start: Date; end: Date };

function nwisPath(path: string): string {
  if (import.meta.env.DEV) return `/usgs-nwis${path}`;
  return `https://waterservices.usgs.gov/nwis${path}`;
}

function formatDt(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function ivUrl(site: string, parameterCd: string, req: IvRequest): string {
  const params = new URLSearchParams({ format: "json", sites: site, parameterCd });
  if (req.kind === "preset") params.set("period", req.period);
  else {
    params.set("startDT", formatDt(req.start));
    params.set("endDT", formatDt(req.end));
  }
  return `${nwisPath(`/iv/?${params.toString()}`)}`;
}

async function fetchSeries(url: string, transform: (n: number) => number = (n) => n): Promise<Point[]> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`USGS request failed (${res.status})`);
  const json = await res.json();
  const rows = json?.value?.timeSeries?.[0]?.values?.[0]?.value ?? [];
  const points: Point[] = [];
  for (const row of rows) {
    const raw = Number(row?.value);
    const t = row?.dateTime ? new Date(row.dateTime) : null;
    if (!Number.isFinite(raw) || !t || Number.isNaN(t.getTime())) continue;
    if (raw < -999000) continue;
    points.push({ t, value: transform(raw) });
  }
  points.sort((a, b) => a.t.getTime() - b.t.getTime());
  return points;
}

export async function fetchLake(req: IvRequest): Promise<{
  temperature: Point[];
  lakeLevel: Point[];
  inflow: Point[];
  outflow: Point[];
}> {
  const [temperature, lakeLevel, inflow, outflow] = await Promise.all([
    fetchSeries(ivUrl(SITE_TEMP, PARAM_TEMP_C, req), (c) => (c * 9) / 5 + 32),
    fetchSeries(ivUrl(SITE_LEVEL, PARAM_LEVEL, req)),
    fetchSeries(ivUrl(SITE_INFLOW, PARAM_FLOW, req)),
    fetchSeries(ivUrl(SITE_OUTFLOW, PARAM_FLOW, req))
  ]);
  return { temperature, lakeLevel, inflow, outflow };
}
