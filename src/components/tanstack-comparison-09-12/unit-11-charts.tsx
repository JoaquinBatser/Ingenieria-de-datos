import {
  areaY,
  barY,
  defineChart,
  dot,
  lineY,
  link,
  rect,
  ruleX,
  text,
} from "@tanstack/charts"
import { Chart } from "@tanstack/charts/react"
import { Chart as CanvasChart } from "@tanstack/charts/react/canvas"
import { scaleBand } from "@tanstack/charts/scales/band"
import { scaleLinear } from "@tanstack/charts/scales/linear"
import { scaleOrdinal } from "@tanstack/charts/scales/ordinal"
import { tooltip } from "@tanstack/charts/tooltip"

import { ChartCarousel } from "@/components/chart-carousel"
import unit11Data from "@/data/tanstack/unit11.json"

const windowScatterRows = unit11Data.windowScatter.map((row, index) => ({
  ...row,
  id: `window-${index}`,
}))

const windowChart = defineChart({
  marks: [barY(unit11Data.windows, { x: "window", y: "orders", key: "window" })],
  x: { scale: () => scaleBand<string>().padding(0.24) },
  y: { scale: scaleLinear, nice: true, grid: true, axis: { label: "Promedio de órdenes" } },
  tooltip,
})

const activityChart = defineChart({
  marks: [dot(windowScatterRows, { x: "historical", y: "recent", key: "id", r: 2.5, fillOpacity: 0.56 })],
  x: { scale: scaleLinear, nice: true, grid: true, axis: { label: "Órdenes en últimos 90 días" } },
  y: { scale: scaleLinear, nice: true, grid: true, axis: { label: "Órdenes en últimos 7 días" } },
  tooltip,
})

const rollingLineRows = unit11Data.rolling.flatMap((row) => [
  { order: row.order_number, series: "Cart Size Actual", value: row.cart_size },
  { order: row.order_number, series: "Rolling Mean (3 órdenes previas)", value: row.rolling_cart_mean_3 },
])

const rollingChart = defineChart({
  marks: [
    areaY(unit11Data.rolling, {
      x: "order_number",
      y1: "lower",
      y2: "upper",
      fillOpacity: 0.16,
    }),
    lineY(rollingLineRows, { x: "order", y: "value", z: "series", color: "series", points: true }),
  ],
  x: { scale: scaleLinear, grid: true, axis: { label: "Order Number" } },
  y: { scale: scaleLinear, nice: true, grid: true, axis: { label: "Cart Size" } },
  color: {
    scale: scaleOrdinal<string, string>()
      .domain(["Cart Size Actual", "Rolling Mean (3 órdenes previas)"])
      .range(["#4c9ad1", "#ff7548"]),
  },
  tooltip,
})

function histogramChart(
  rows: (typeof unit11Data.rfm.recency),
  xLabel: string,
) {
  return defineChart({
    marks: [rect(rows, { x1: "x1", x2: "x2", y1: () => 0, y2: "count", inset: 1 })],
    x: { scale: scaleLinear, grid: true, axis: { label: xLabel } },
    y: { scale: scaleLinear, nice: true, grid: true, axis: { label: "Frequency" } },
    tooltip,
  })
}

const recencyChart = histogramChart(unit11Data.rfm.recency, "Days Since Last Order")
const frequencyChart = histogramChart(unit11Data.rfm.frequency, "Total Historical Orders")
const monetaryChart = histogramChart(unit11Data.rfm.monetary, "Avg Order Value")

const hourCyclicChart = defineChart({
  marks: [dot(unit11Data.cyclicHours, { x: "sin", y: "cos", color: "period", r: 4 })],
  x: { scale: () => scaleLinear().domain([-1.08, 1.08]), grid: true, axis: { label: "Hour Sin" } },
  y: { scale: () => scaleLinear().domain([-1.08, 1.08]), grid: true, axis: { label: "Hour Cos" } },
  tooltip,
})

const dayCyclicChart = defineChart({
  marks: [dot(unit11Data.cyclicDays, { x: "sin", y: "cos", color: "period", r: 4 })],
  x: { scale: () => scaleLinear().domain([-1.08, 1.08]), grid: true, axis: { label: "DOW Sin" } },
  y: { scale: () => scaleLinear().domain([-1.08, 1.08]), grid: true, axis: { label: "DOW Cos" } },
  tooltip,
})

const weekendChart = defineChart({
  marks: [barY(unit11Data.weekend, { x: "period", y: "average", key: "period" })],
  x: { scale: () => scaleBand<string>().padding(0.22) },
  y: { scale: () => scaleLinear().domain([0, 30]), grid: true, axis: { label: "Avg Cart Size" } },
  tooltip,
})

function formatDateFromDay(day: number) {
  const date = new Date(Date.UTC(2020, 0, 1 + Math.round(day)))
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`
}

const temporalSeriesChart = defineChart({
  marks: [lineY(unit11Data.fourier.series, { x: "day", y: "value" })],
  x: {
    scale: scaleLinear,
    grid: true,
    axis: { ticks: { format: formatDateFromDay }, label: "Fecha" },
  },
  y: { scale: () => scaleLinear().domain([0, 1]), grid: true, axis: { label: "Probabilidad" } },
  tooltip,
})

const spectrumChart = defineChart({
  marks: [
    lineY(unit11Data.fourier.spectrum, { x: "frequency", y: "power" }),
    ruleX([1 / 7], { strokeDasharray: "6 4" }),
    ruleX([1 / 30], { strokeDasharray: "6 4" }),
  ],
  x: { scale: () => scaleLinear().domain([0, 0.5]), grid: true, axis: { label: "Frecuencia" } },
  y: { scale: scaleLinear, nice: true, grid: true, axis: { label: "Power" } },
  tooltip,
})

const decompositionColors = scaleOrdinal<string, string>()
  .domain(["Original", "Tendencia", "Tendencia + Estacional"])
  .range(["#f58aa0", "#b08c18", "#42ad32"])

const decompositionChart = defineChart({
  marks: [
    lineY(unit11Data.fourier.decomposition, {
      x: "day",
      y: "value",
      z: "series",
      color: "series",
    }),
  ],
  x: {
    scale: scaleLinear,
    grid: true,
    axis: { ticks: { format: formatDateFromDay }, label: "Fecha" },
  },
  y: { scale: scaleLinear, nice: true, grid: true, axis: { label: "Valor" } },
  color: { scale: decompositionColors },
  tooltip,
})

const modelRows = unit11Data.models.map((row) => ({
  ...row,
  low: row.auc - row.std,
  high: row.auc + row.std,
  labelY: row.auc + row.std + 0.013,
  label: row.auc.toFixed(4),
}))

const modelComparisonChart = defineChart({
  marks: [
    barY(modelRows, { x: "method", y: "auc", key: "method" }),
    link(modelRows, { x1: "method", x2: "method", y1: "low", y2: "high", strokeWidth: 2.5 }),
    text(modelRows, { x: "method", y: "labelY", text: "label", fontSize: 12 }),
  ],
  x: {
    scale: () => scaleBand<string>().padding(0.2),
    axis: { tickLabels: { rotate: -42 } },
  },
  y: { scale: () => scaleLinear().domain([0, 0.72]), grid: true, axis: { label: "ROC AUC" } },
  tooltip,
})

export function TemporalWindowActivityChart() {
  return (
    <ChartCarousel label="Distribución temporal de ventas">
      <figure><figcaption>Promedio de Órdenes por Ventana Temporal</figcaption><Chart definition={windowChart} height={380} ariaLabel="Promedio de órdenes en ventanas de siete, treinta y noventa días" /></figure>
      <figure><figcaption>Actividad Reciente vs Histórica (muestra reproducible de {windowScatterRows.length.toLocaleString("es-UY")} de {unit11Data.windowScatterPopulation.toLocaleString("es-UY")} observaciones)</figcaption><CanvasChart definition={activityChart} height={380} ariaLabel="Órdenes recientes frente a órdenes históricas para cada observación" /></figure>
    </ChartCarousel>
  )
}

export function TemporalRollingCartChart() {
  return (
    <figure>
      <figcaption>Rolling Mean vs Actual Cart Size (User 12748)</figcaption>
      <Chart definition={rollingChart} height={440} ariaLabel="Cart size, rolling mean y desviación estándar para veinte órdenes del usuario 12748" />
    </figure>
  )
}

export function TemporalRfmDistributionsChart() {
  return (
    <ChartCarousel label="Distribuciones RFM">
      <figure><figcaption>Recency Distribution</figcaption><Chart definition={recencyChart} height={340} ariaLabel="Distribución de recency" /></figure>
      <figure><figcaption>Frequency Distribution</figcaption><Chart definition={frequencyChart} height={340} ariaLabel="Distribución de frequency" /></figure>
      <figure><figcaption>Monetary Distribution</figcaption><Chart definition={monetaryChart} height={340} ariaLabel="Distribución de monetary" /></figure>
    </ChartCarousel>
  )
}

export function TemporalCyclicEncodingChart() {
  return (
    <ChartCarousel label="Encoding cíclico y efecto de fin de semana">
      <figure><figcaption>Encoding Cíclico de Hora del Día</figcaption><Chart definition={hourCyclicChart} height={340} ariaLabel="Encoding seno coseno de las horas observadas" /></figure>
      <figure><figcaption>Encoding Cíclico de Día de Semana</figcaption><Chart definition={dayCyclicChart} height={340} ariaLabel="Encoding seno coseno de los días observados" /></figure>
      <figure><figcaption>Efecto Weekend en Cart Size</figcaption><Chart definition={weekendChart} height={340} ariaLabel="Cart size promedio durante semana y fin de semana" /></figure>
    </ChartCarousel>
  )
}

export function TemporalFourierAnalysisChart() {
  return (
    <ChartCarousel label="Análisis temporal con Fourier y descomposición">
      <figure><figcaption>Serie Temporal Original</figcaption><Chart definition={temporalSeriesChart} height={300} ariaLabel="Serie temporal de probabilidad objetivo" /></figure>
      <figure><figcaption>Power Spectrum (Fourier Transform)</figcaption><Chart definition={spectrumChart} height={300} ariaLabel="Espectro de potencia con referencias semanal y mensual" /></figure>
      <figure><figcaption>Seasonal Decomposition (Primeros 200 días)</figcaption><Chart definition={decompositionChart} height={360} ariaLabel="Serie original, tendencia y tendencia más estacionalidad" /></figure>
    </ChartCarousel>
  )
}

export function TemporalModelComparisonChart() {
  return (
    <figure>
      <figcaption>Comparación de Features Temporales (Time Series CV)</figcaption>
      <Chart definition={modelComparisonChart} height={440} ariaLabel="AUC medio y desviación estándar de tres conjuntos de features temporales" />
    </figure>
  )
}
