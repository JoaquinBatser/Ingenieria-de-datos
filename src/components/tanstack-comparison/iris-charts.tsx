import {
  areaY,
  boxY,
  cell,
  colorGradientLegend,
  defineChart,
  dot,
  facetChart,
  lineY,
  text,
} from "@tanstack/charts"
import { Chart } from "@tanstack/charts/react"
import { scaleBand } from "@tanstack/charts/scales/band"
import { scaleLinear } from "@tanstack/charts/scales/linear"
import { scaleOrdinal } from "@tanstack/charts/scales/ordinal"
import { tooltip } from "@tanstack/charts/tooltip"

import comparisonData from "@/data/tanstack-comparison.json"

const irisRows = comparisonData.iris.rows
const species = ["setosa", "versicolor", "virginica"]
const speciesColors = ["#f87171", "#c99a20", "#38a729"]

const metrics = [
  { key: "sepalLength", label: "Largo del sépalo (cm)", short: "SL" },
  { key: "sepalWidth", label: "Ancho del sépalo (cm)", short: "SW" },
  { key: "petalLength", label: "Largo del pétalo (cm)", short: "PL" },
  { key: "petalWidth", label: "Ancho del pétalo (cm)", short: "PW" },
] as const

type IrisRow = (typeof irisRows)[number]
type MetricKey = (typeof metrics)[number]["key"]

interface PairplotRow extends IrisRow {
  panel: string
  kind: "scatter" | "density"
  xValue: number
  yValue: number
}

function densityRows(
  metric: (typeof metrics)[number],
  panel: string,
  metricIndex: number
): PairplotRow[] {
  return species.flatMap((speciesName, speciesIndex) => {
    const values = irisRows
      .filter((row) => row.species === speciesName)
      .map((row) => row[metric.key])
    const minimum = Math.min(...values)
    const maximum = Math.max(...values)
    const mean = values.reduce((sum, value) => sum + value, 0) / values.length
    const deviation = Math.sqrt(
      values.reduce((sum, value) => sum + (value - mean) ** 2, 0) /
        (values.length - 1)
    )
    const bandwidth = Math.max(
      1.06 * deviation * values.length ** -0.2,
      (maximum - minimum) / 20
    )
    const padding = Math.max((maximum - minimum) * 0.12, bandwidth)

    return Array.from({ length: 36 }, (_, index) => {
      const xValue =
        minimum + ((maximum - minimum + padding * 2) * index) / 35 - padding

      return {
        ...irisRows[0],
        id: -(metricIndex * 1000 + speciesIndex * 100 + index + 1),
        species: speciesName,
        panel,
        kind: "density" as const,
        xValue,
        yValue:
          values.reduce(
            (sum, value) =>
              sum + Math.exp(-0.5 * ((xValue - value) / bandwidth) ** 2),
            0
          ) /
          (values.length * bandwidth * Math.sqrt(2 * Math.PI)),
      }
    })
  })
}

const pairplotRows: PairplotRow[] = metrics.flatMap((yMetric, yIndex) =>
  metrics.flatMap((xMetric) => {
    const panel = `${xMetric.short} × ${yMetric.short}`

    if (xMetric.key === yMetric.key) {
      return densityRows(xMetric, panel, yIndex)
    }

    return irisRows.map((row) => ({
      ...row,
      panel,
      kind: "scatter" as const,
      xValue: row[xMetric.key],
      yValue: row[yMetric.key],
    }))
  })
)

const pairplotDefinition = facetChart(pairplotRows, {
  by: "panel",
  columns: 4,
  minWidth: 135,
  gap: 12,
  axes: "cell",
  label: (panel) => String(panel),
  chart(data) {
    const densityData = data.filter((row) => row.kind === "density")
    const scatterData = data.filter((row) => row.kind === "scatter")

    return {
      marks: [
        areaY(densityData, {
          x: "xValue",
          y: "yValue",
          z: "species",
          color: "species",
          fillOpacity: 0.18,
        }),
        lineY(densityData, {
          x: "xValue",
          y: "yValue",
          z: "species",
          color: "species",
          strokeWidth: 1.5,
        }),
        dot(scatterData, {
          x: "xValue",
          y: "yValue",
          color: "species",
          key: "id",
          r: 3.25,
          fillOpacity: 0.78,
        }),
      ],
      x: { scale: scaleLinear, nice: true, grid: true },
      y: { scale: scaleLinear, nice: true, grid: true },
      color: {
        scale: () =>
          scaleOrdinal<string, string>().domain(species).range(speciesColors),
      },
    }
  },
})

const fieldLabels: Record<MetricKey, string> = {
  sepalLength: "sepal_length",
  sepalWidth: "sepal_width",
  petalLength: "petal_length",
  petalWidth: "petal_width",
}

const correlationLookup = new Map(
  comparisonData.iris.correlations.map((row) => [row.pair, row.correlation])
)
const correlations = metrics.flatMap((yMetric) =>
  metrics.map((xMetric) => {
    const direct = correlationLookup.get(`${xMetric.key} / ${yMetric.key}`)
    const inverse = correlationLookup.get(`${yMetric.key} / ${xMetric.key}`)

    return {
      x: fieldLabels[xMetric.key],
      y: fieldLabels[yMetric.key],
      value: xMetric.key === yMetric.key ? 1 : (direct ?? inverse ?? 0),
    }
  })
)

const correlationDefinition = defineChart({
  marks: [
    cell(correlations, {
      x: "x",
      y: "y",
      color: "value",
      key: (row) => `${row.x}-${row.y}`,
      inset: 1,
    }),
    text(correlations, {
      x: "x",
      y: "y",
      text: (row) => row.value.toFixed(2),
      fill: (row) => (Math.abs(row.value) >= 0.65 ? "#ffffff" : "#172033"),
      fontWeight: 650,
    }),
  ],
  x: {
    scale: () =>
      scaleBand<string>()
        .domain(metrics.map((metric) => fieldLabels[metric.key]))
        .padding(0.02),
    axis: { tickLabels: { rotate: -28 } },
  },
  y: {
    scale: () =>
      scaleBand<string>()
        .domain(metrics.map((metric) => fieldLabels[metric.key]))
        .padding(0.02),
  },
  color: {
    domain: [-1, 1],
    range: ["#4169d8", "#c9002b"],
    legend: colorGradientLegend({
      label: "Correlación de Pearson",
      steps: 9,
      format: (value) => value.toFixed(2),
    }),
  },
  tooltip,
})

function boxplotDefinition(
  metric: "petalLength" | "sepalWidth",
  label: string
) {
  return defineChart({
    marks: [
      boxY(irisRows, {
        x: "species",
        y: metric,
        key: "id",
        inset: 18,
        fillOpacity: 0.68,
        fill: "#91a4c7",
        stroke: "#4b5563",
      }),
    ],
    x: {
      scale: () => scaleBand<string>().domain(species).padding(0.18),
      axis: { label: "Especie" },
    },
    y: {
      scale: scaleLinear,
      nice: true,
      grid: true,
      axis: { label },
    },
    tooltip,
  })
}

const petalLengthBoxplot = boxplotDefinition(
  "petalLength",
  "Largo del pétalo (cm)"
)
const sepalWidthBoxplot = boxplotDefinition(
  "sepalWidth",
  "Ancho del sépalo (cm)"
)

export function IrisPairplotChart() {
  return (
    <Chart
      definition={pairplotDefinition}
      height={1080}
      ariaLabel="Pairplot de las cuatro medidas del dataset Iris por especie"
    />
  )
}

export function IrisCorrelationHeatmapChart() {
  return (
    <Chart
      definition={correlationDefinition}
      height={520}
      ariaLabel="Matriz de correlación de las cuatro medidas del dataset Iris"
    />
  )
}

export function IrisBoxplotsChart() {
  return (
    <section aria-label="Boxplots de medidas de Iris por especie">
      <div className="grid gap-8 lg:grid-cols-2">
        <Chart
          definition={petalLengthBoxplot}
          height={390}
          ariaLabel="Distribución del largo del pétalo por especie"
        />
        <Chart
          definition={sepalWidthBoxplot}
          height={390}
          ariaLabel="Distribución del ancho del sépalo por especie"
        />
      </div>
    </section>
  )
}
