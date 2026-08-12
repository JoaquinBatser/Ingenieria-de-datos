import { barY, defineChart, lineY } from "@tanstack/charts"
import { Chart } from "@tanstack/charts/react"
import { scaleLinear } from "@tanstack/charts/scales/linear"
import { tooltip } from "@tanstack/charts/tooltip"

import amesData from "@/data/tanstack/ames.json"

type HistogramRow = { series: string; x: number; count: number }
type SmoothedHistogramRow = HistogramRow & { smoothCount: number }

const rawRows = amesData.unit06.raw as HistogramRow[]
const transformedRows = amesData.unit06.transformed as HistogramRow[]
const standardizedRows = amesData.unit06.standardized as HistogramRow[]
const selectedFeatures = ["SalePrice", "Lot Area", "Overall Qual", "Year Built", "1st Flr SF", "Gr Liv Area"] as const

function rowsFor(source: HistogramRow[], series: string): HistogramRow[] {
  return source.filter((row) => row.series === series)
}

function smoothed(rows: HistogramRow[]): SmoothedHistogramRow[] {
  return rows.map((row, index) => {
    const neighborhood = [
      { offset: -2, weight: 1 },
      { offset: -1, weight: 2 },
      { offset: 0, weight: 3 },
      { offset: 1, weight: 2 },
      { offset: 2, weight: 1 },
    ]
    const total = neighborhood.reduce(
      (sum, { offset, weight }) => sum + (rows[index + offset]?.count ?? 0) * weight,
      0
    )
    return { ...row, smoothCount: total / 9 }
  })
}

function histogramDefinition(rows: HistogramRow[], xLabel: string, showDensity = false) {
  const plotRows = smoothed(rows)
  return defineChart({
    marks: [
      barY(plotRows, { x: "x", y: "count", key: "x", inset: 0.5 }),
      ...(showDensity ? [lineY(plotRows, { x: "x", y: "smoothCount" })] : []),
    ],
    x: { scale: scaleLinear, nice: true, axis: { label: xLabel } },
    y: { scale: scaleLinear, nice: true, grid: true, axis: { label: "Frecuencia" } },
    tooltip,
  })
}

const rawCharts = selectedFeatures.map((feature) => ({
  feature,
  definition: histogramDefinition(rowsFor(rawRows, feature), feature, true),
}))

type TransformerKey =
  | "Yeo-Johnson"
  | "QuantileTransformer"
  | "MaxAbsScaler"
  | "Normalizer L2"
  | "FunctionTransformer (log1p)"

function transformerCharts(transformer: TransformerKey) {
  const column = "SalePrice"
  return [
    {
      label: `${transformer} · Original`,
      definition: histogramDefinition(rowsFor(rawRows, column), column),
    },
    {
      label: `${transformer} · Transformado`,
      definition: histogramDefinition(
        rowsFor(transformedRows, `${transformer} · ${column}`),
        `${transformer}(${column})`
      ),
    },
    {
      label: `${transformer} · Transformado + StandardScaler`,
      definition: histogramDefinition(
        rowsFor(standardizedRows, `${transformer} + StandardScaler · ${column}`),
        `Std(${transformer}(${column}))`
      ),
    },
  ]
}

function TransformerComparison({ transformer }: { transformer: TransformerKey }) {
  return (
    <section aria-label={`Comparación de ${transformer}`} className="grid gap-6 md:grid-cols-3">
      {transformerCharts(transformer).map(({ label, definition }) => (
        <Chart key={label} definition={definition} height={320} ariaLabel={label} />
      ))}
    </section>
  )
}

const logLotAreaCharts = [
  {
    label: "Original: Lot Area",
    definition: histogramDefinition(rowsFor(rawRows, "Lot Area"), "Lot Area"),
  },
  {
    label: "Log Transform: Lot Area",
    definition: histogramDefinition(
      rowsFor(transformedRows, "FunctionTransformer (log1p) · Lot Area"),
      "log1p(Lot Area)"
    ),
  },
  {
    label: "Log + Scaled",
    definition: histogramDefinition(
      rowsFor(standardizedRows, "FunctionTransformer (log1p) + StandardScaler · Lot Area"),
      "StandardScaler(log1p(Lot Area))"
    ),
  },
]

export function Unit06Histograms() {
  return (
    <section aria-label="Histogramas de las variables seleccionadas" className="grid gap-6 md:grid-cols-2">
      {rawCharts.map(({ feature, definition }) => (
        <Chart key={feature} definition={definition} height={320} ariaLabel={`Distribución de ${feature}`} />
      ))}
    </section>
  )
}

export function Unit06YeoJohnson() {
  return <TransformerComparison transformer="Yeo-Johnson" />
}

export function Unit06QuantileTransformer() {
  return <TransformerComparison transformer="QuantileTransformer" />
}

export function Unit06MaxAbsScaler() {
  return <TransformerComparison transformer="MaxAbsScaler" />
}

export function Unit06NormalizerL2() {
  return <TransformerComparison transformer="Normalizer L2" />
}

export function Unit06FunctionTransformer() {
  return <TransformerComparison transformer="FunctionTransformer (log1p)" />
}

export function Unit06LogComparison() {
  return (
    <section aria-label="Comparación de la transformación logarítmica" className="grid gap-6 md:grid-cols-3">
      {logLotAreaCharts.map(({ label, definition }) => (
        <Chart key={label} definition={definition} height={320} ariaLabel={label} />
      ))}
    </section>
  )
}
