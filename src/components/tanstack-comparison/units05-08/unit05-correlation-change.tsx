import { barY, cell, colorGradientLegend, defineChart, dot, link, rect, ruleY, text } from "@tanstack/charts"
import { Chart } from "@tanstack/charts/react"
import { scaleBand } from "@tanstack/charts/scales/band"
import { scaleLinear } from "@tanstack/charts/scales/linear"
import { scaleOrdinal } from "@tanstack/charts/scales/ordinal"
import { tooltip } from "@tanstack/charts/tooltip"

import amesData from "@/data/tanstack/ames.json"

type HistogramRow = { series: string; x: number; count: number }
type CategoryRow = { feature: string; state: string; category: string; count: number }
type CorrelationRow = { state: string; x: string; y: string; value: number }
type OutlierSummary = {
  feature: string
  q1: number
  median: number
  q3: number
  lowerBound: number
  upperBound: number
  whiskerLow: number
  whiskerHigh: number
  outliers: number[]
}

const missingPerRowChart = defineChart({
  marks: [barY(amesData.unit05.missingPerRow, { x: "missing", y: "count", key: "missing", inset: 1 })],
  x: {
    scale: () => scaleBand<number>().padding(0.08),
    axis: { label: "Número de valores faltantes por fila" },
  },
  y: { scale: scaleLinear, nice: true, grid: true, axis: { label: "Frecuencia" } },
  tooltip,
})

const outlierSummaries = amesData.unit05.outlierSummaries as OutlierSummary[]
const outlierFeatures = ["SalePrice", "Lot Area", "Year Built", "Garage Area"] as const

const outlierCharts = outlierFeatures.map((feature) => {
  const logarithmic = feature === "SalePrice" || feature === "Lot Area"
  const rawSummary = outlierSummaries.find((row) => row.feature === feature)
  if (!rawSummary) throw new Error(`Falta el resumen de outliers para ${feature}`)
  const display = (value: number) =>
    logarithmic ? Math.log10(Math.max(value, Number.MIN_VALUE)) : value
  const points = rawSummary.outliers
    .map((value, index) => ({
      id: index,
      x: 0.5 + ((index * 37) % 19 - 9) * 0.008,
      value: display(value),
      rawValue: value,
    }))
  const summary = {
    center: 0.5,
    boxStart: 0.25,
    boxEnd: 0.75,
    capStart: 0.38,
    capEnd: 0.62,
    q1: display(rawSummary.q1),
    median: display(rawSummary.median),
    q3: display(rawSummary.q3),
    lowerBound: display(Math.max(rawSummary.lowerBound, Number.MIN_VALUE)),
    upperBound: display(rawSummary.upperBound),
    whiskerLow: display(rawSummary.whiskerLow),
    whiskerHigh: display(rawSummary.whiskerHigh),
  }

  return {
    feature,
    logarithmic,
    outlierCount: points.length,
    definition: defineChart({
      marks: [
        ruleY([summary.lowerBound, summary.upperBound], {
          strokeDasharray: "6 4",
        }),
        link([summary], {
          x1: "center",
          x2: "center",
          y1: "whiskerLow",
          y2: "whiskerHigh",
        }),
        link([summary], {
          x1: "capStart",
          x2: "capEnd",
          y1: "whiskerLow",
          y2: "whiskerLow",
        }),
        link([summary], {
          x1: "capStart",
          x2: "capEnd",
          y1: "whiskerHigh",
          y2: "whiskerHigh",
        }),
        rect([summary], {
          x1: "boxStart",
          x2: "boxEnd",
          y1: "q1",
          y2: "q3",
          fillOpacity: 0.64,
        }),
        link([summary], {
          x1: "boxStart",
          x2: "boxEnd",
          y1: "median",
          y2: "median",
          strokeWidth: 2,
        }),
        dot(points, {
          x: "x",
          y: "value",
          key: "id",
          r: 3.5,
          fill: "#dc2626",
          fillOpacity: 0.72,
        }),
      ],
      x: {
        scale: () => scaleLinear().domain([0, 1]),
        axis: { label: feature, ticks: { values: [0.5], format: () => "" } },
      },
      y: {
        scale: scaleLinear,
        nice: true,
        grid: true,
        axis: {
          label: logarithmic ? `${feature} (escala log)` : feature,
          ticks: logarithmic
            ? {
                format: (value) =>
                  Math.round(10 ** value).toLocaleString("es-UY"),
              }
            : undefined,
        },
      },
      tooltip,
    }),
  }
})

const distributionRows = amesData.unit05.distributions as HistogramRow[]
const categoryRows = amesData.unit05.categoryDistributions as CategoryRow[]
const numericDistributionFeatures = ["SalePrice", "Lot Area", "Year Built", "Garage Area"] as const
const categoryDistributionFeatures = ["Neighborhood", "House Style"] as const

const numericDistributionCharts = numericDistributionFeatures.map((feature) => {
  const numericRows = distributionRows
    .filter((row) => row.series.startsWith(`${feature} ·`))
    .map((row) => ({ ...row, state: row.series.endsWith("Original") ? "Original" : "Imputado" }))
  return {
    feature,
    definition: defineChart({
      marks: [
        barY(numericRows, {
          x: "x",
          y1: 0,
          y2: "count",
          color: "state",
          key: (row) => `${row.state}-${row.x}`,
          fillOpacity: 0.58,
        }),
      ],
      x: { scale: scaleLinear, nice: true, axis: { label: feature } },
      y: { scale: scaleLinear, nice: true, grid: true, axis: { label: "Frecuencia" } },
      tooltip,
    }),
  }
})

const categoryDistributionCharts = categoryDistributionFeatures.map((feature) => {
  const rows = categoryRows.filter((row) => row.feature === feature)
  return {
    feature,
    definition: defineChart({
      marks: [
        barY(rows, {
          x: "category",
          y1: 0,
          y2: "count",
          color: "state",
          key: (row) => `${row.state}-${row.category}`,
          fillOpacity: 0.58,
          inset: 1,
        }),
      ],
      x: { scale: () => scaleBand<string>().padding(0.05), axis: { label: feature } },
      y: { scale: scaleLinear, nice: true, grid: true, axis: { label: "Frecuencia" } },
      tooltip,
    }),
  }
})

const correlationFields = [
  "SalePrice",
  "Lot Area",
  "Year Built",
  "Garage Area",
  "Overall Qual",
  "Gr Liv Area",
  "Total Bsmt SF",
] as const

const correlationRows = amesData.unit05.correlations as CorrelationRow[]
const correlationColors = [
  "#2563eb",
  "#5b7fd5",
  "#91a6dc",
  "#c5cce1",
  "#f8fafc",
  "#efc3c3",
  "#e88989",
  "#e05252",
  "#dc2626",
] as const

function correlationBucket(value: number) {
  return Math.max(0, Math.min(correlationColors.length - 1, Math.round(((value + 1) / 2) * (correlationColors.length - 1))))
}

const correlationCharts = ["Original", "Imputado"].map((state) => {
  const rows = correlationRows
    .filter((row) => row.state === state)
    .map((row) => ({ ...row, bucket: correlationBucket(row.value) }))
  return {
    state,
    definition: defineChart({
      marks: [
        cell(rows, { x: "x", y: "y", color: "bucket", key: (row) => `${state}-${row.x}-${row.y}`, inset: 1 }),
        text(rows, {
          x: "x",
          y: "y",
          text: (row) => row.value.toFixed(2),
          fill: (row) => (Math.abs(row.value) >= 0.58 ? "#ffffff" : "#111827"),
          fontSize: 11,
        }),
      ],
      x: { scale: () => scaleBand<string>().domain(correlationFields).padding(0.02) },
      y: { scale: () => scaleBand<string>().domain(correlationFields).padding(0.02) },
      color: {
        scale: () =>
          scaleOrdinal<number, string>()
            .domain(correlationColors.map((_, index) => index))
            .range(correlationColors),
        legend: colorGradientLegend({ label: "Correlación" }),
      },
      tooltip,
    }),
  }
})

export function Unit05MissingPatterns() {
  return <Chart definition={missingPerRowChart} height={420} ariaLabel="Distribución de valores faltantes por fila" />
}

export function Unit05OutliersAnalysis() {
  return (
    <section aria-label="Outliers por variable" className="grid gap-6 md:grid-cols-2">
      {outlierCharts.map(({ feature, logarithmic, outlierCount, definition }) => (
        <Chart
          key={feature}
          definition={definition}
          height={340}
          ariaLabel={`Boxplot de ${feature}${logarithmic ? " en escala logarítmica" : ""}; ${outlierCount} outliers según IQR de los valores originales`}
        />
      ))}
    </section>
  )
}

export function Unit05DistributionComparison() {
  return (
    <section aria-label="Distribuciones antes y después de imputar" className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
      {numericDistributionCharts.map(({ feature, definition }) => (
        <Chart key={feature} definition={definition} height={320} ariaLabel={`Distribución de ${feature}: original e imputado`} />
      ))}
      {categoryDistributionCharts.map(({ feature, definition }) => (
        <Chart key={feature} definition={definition} height={320} ariaLabel={`Distribución de ${feature}: original e imputado`} />
      ))}
    </section>
  )
}

export function Unit05CorrelationComparison() {
  return (
    <section aria-label="Matrices de correlación antes y después de imputar" className="grid gap-6 xl:grid-cols-2">
      {correlationCharts.map(({ state, definition }) => (
        <Chart key={state} definition={definition} height={560} ariaLabel={`Correlaciones - ${state}`} />
      ))}
    </section>
  )
}
