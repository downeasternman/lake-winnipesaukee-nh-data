import "./styles.css";
import { decimate, renderMetricChart } from "./charts";
import { fetchLake, type IvRequest, type PresetPeriod } from "./usgs";
import type { Chart } from "chart.js";

const app = document.querySelector<HTMLDivElement>("#app");
if (!app) throw new Error("#app missing");

app.innerHTML = `
  <header class="app-header">
    <h1>Lake Winnipesaukee, NH</h1>
    <p class="tagline">USGS lake level, in/out flow & water temperature</p>
  </header>
  <section class="controls" aria-label="Time range">
    <div class="presets">
      <span class="label">Range</span>
      <button type="button" class="chip" data-period="P1D">1 day</button>
      <button type="button" class="chip chip-active" data-period="P7D">7 days</button>
      <button type="button" class="chip" data-period="P30D">30 days</button>
    </div>
    <div class="custom-range">
      <span class="label">Custom</span>
      <input type="date" id="startDate" aria-label="Start date" />
      <span class="dash">–</span>
      <input type="date" id="endDate" aria-label="End date" />
      <button type="button" class="btn-apply" id="applyCustom">Apply</button>
    </div>
    <div class="refresh-row"><button type="button" class="btn-refresh" id="refreshBtn">Refresh now</button><span class="refresh-info" id="refreshInfo"></span></div>
    <p class="range-summary" id="rangeSummary"></p>
    <p class="form-error" id="formError" role="alert" hidden></p>
  </section>
  <main class="cards">
    <article class="card"><header><h2>Water temperature</h2><p class="meta" id="metaT"></p></header><div class="chart-wrap"><div class="loading" id="loadT">Loading…</div><canvas id="chartT" height="220"></canvas></div><p class="footnote" id="footT"></p></article>
    <article class="card"><header><h2>Lake level</h2><p class="meta" id="metaL"></p></header><div class="chart-wrap"><div class="loading" id="loadL">Loading…</div><canvas id="chartL" height="220"></canvas></div><p class="footnote" id="footL"></p></article>
    <article class="card"><header><h2>Inflow</h2><p class="meta" id="metaI"></p></header><div class="chart-wrap"><div class="loading" id="loadI">Loading…</div><canvas id="chartI" height="220"></canvas></div><p class="footnote" id="footI"></p></article>
    <article class="card"><header><h2>Outflow</h2><p class="meta" id="metaO"></p></header><div class="chart-wrap"><div class="loading" id="loadO">Loading…</div><canvas id="chartO" height="220"></canvas></div><p class="footnote" id="footO"></p></article>
  </main>
  <footer class="app-footer"><p>Data: U.S. Geological Survey near real-time feeds. Temperature chart is always shown first.</p></footer>
`;

let req: IvRequest = { kind: "preset", period: "P7D" };
let charts: Array<Chart<"line"> | null> = [null, null, null, null];
const el = {
  rangeSummary: document.getElementById("rangeSummary")!,
  formError: document.getElementById("formError")!,
  loadT: document.getElementById("loadT")!, loadL: document.getElementById("loadL")!, loadI: document.getElementById("loadI")!, loadO: document.getElementById("loadO")!,
  chartT: document.getElementById("chartT") as HTMLCanvasElement, chartL: document.getElementById("chartL") as HTMLCanvasElement, chartI: document.getElementById("chartI") as HTMLCanvasElement, chartO: document.getElementById("chartO") as HTMLCanvasElement,
  metaT: document.getElementById("metaT")!, metaL: document.getElementById("metaL")!, metaI: document.getElementById("metaI")!, metaO: document.getElementById("metaO")!,
  footT: document.getElementById("footT")!, footL: document.getElementById("footL")!, footI: document.getElementById("footI")!, footO: document.getElementById("footO")!,
  startDate: document.getElementById("startDate") as HTMLInputElement, endDate: document.getElementById("endDate") as HTMLInputElement
};
const setBusy = (busy: boolean) => [el.loadT, el.loadL, el.loadI, el.loadO].forEach((node) => (node.hidden = !busy));
function summarizeRange(): string {
  if (req.kind === "preset") {
    const labels: Record<PresetPeriod, string> = { P1D: "Last 24 hours", P7D: "Last 7 days", P30D: "Last 30 days" };
    el.rangeSummary.textContent = labels[req.period];
  } else el.rangeSummary.textContent = `${req.start.toLocaleDateString()} — ${req.end.toLocaleDateString()}`;
  return el.rangeSummary.textContent || "";
}
async function load(): Promise<void> {
  el.formError.hidden = true;
  charts.forEach((c) => c?.destroy());
  setBusy(true);
  const summary = summarizeRange();
  el.metaT.textContent = `USGS temperature · ${summary}`; el.metaL.textContent = `USGS lake level · ${summary}`; el.metaI.textContent = `USGS inflow · ${summary}`; el.metaO.textContent = `USGS outflow · ${summary}`;
  try {
    const data = await fetchLake(req);
    const t = decimate(data.temperature), l = decimate(data.lakeLevel), i = decimate(data.inflow), o = decimate(data.outflow);
    charts[0] = renderMetricChart(el.chartT, t, "Water temperature", "rgb(14, 116, 144)", "°F");
    charts[1] = renderMetricChart(el.chartL, l, "Lake level", "rgb(30, 64, 175)", "ft");
    charts[2] = renderMetricChart(el.chartI, i, "Inflow", "rgb(37, 99, 235)", "ft³/s");
    charts[3] = renderMetricChart(el.chartO, o, "Outflow", "rgb(59, 130, 246)", "ft³/s");
    el.footT.textContent = t.length ? `Points: ${t.length}` : "No temperature data returned.";
    el.footL.textContent = l.length ? `Points: ${l.length}` : "No lake level data returned.";
    el.footI.textContent = i.length ? `Points: ${i.length}` : "No inflow data returned.";
    el.footO.textContent = o.length ? `Points: ${o.length}` : "No outflow data returned.";
  } catch (e) {
    el.formError.textContent = e instanceof Error ? e.message : "Request failed";
    el.formError.hidden = false;
  } finally { setBusy(false); }
}
document.querySelectorAll(".chip").forEach((btn) => btn.addEventListener("click", () => {
  req = { kind: "preset", period: btn.getAttribute("data-period") as PresetPeriod };
  document.querySelectorAll(".chip").forEach((b) => b.classList.toggle("chip-active", b === btn));
  void load();
}));
document.getElementById("applyCustom")?.addEventListener("click", () => {
  req = { kind: "range", start: new Date(el.startDate.value + "T00:00:00"), end: new Date(el.endDate.value + "T23:59:59") };
  document.querySelectorAll(".chip").forEach((b) => b.classList.remove("chip-active"));
  void load();
});
document.getElementById("refreshBtn")?.addEventListener("click", () => void load());
const today = new Date(); const weekAgo = new Date(today); weekAgo.setDate(weekAgo.getDate() - 7);
const pad = (n: number) => String(n).padStart(2, "0");
el.endDate.value = `${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}`;
el.startDate.value = `${weekAgo.getFullYear()}-${pad(weekAgo.getMonth() + 1)}-${pad(weekAgo.getDate())}`;
document.getElementById("refreshInfo")!.textContent = "USGS live data.";
void load();
