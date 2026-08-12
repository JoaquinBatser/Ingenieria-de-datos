import { barX, barY, defineChart, dot, lineY } from "@tanstack/charts"
import { Chart } from "@tanstack/charts/react"
import { scaleBand } from "@tanstack/charts/scales/band"
import { scaleLinear } from "@tanstack/charts/scales/linear"
import { tooltip } from "@tanstack/charts/tooltip"

import { ChartCarousel } from "@/components/chart-carousel"
import unit08Data from "@/data/tanstack/unit08.json"

type HistogramRow = { series: string; x: number; count: number }
type ImportanceRow = { feature: string; score: number }
type PredictionRow = { model: string; actual: number; predicted: number }

const derivedRows = unit08Data.derived as HistogramRow[]
const analysisRows = unit08Data.analysis as HistogramRow[]

function histogramChart(rows: HistogramRow[], xLabel: string) {
  return defineChart({
    marks: [barY(rows, { x: "x", y: "count", key: "x", inset: 0.5 })],
    x: { scale: scaleLinear, nice: true, axis: { label: xLabel } },
    y: { scale: scaleLinear, nice: true, grid: true, axis: { label: "Frecuencia" } },
    tooltip,
  })
}

function histogramPanels(source: HistogramRow[]) {
  return [...new Set(source.map((row) => row.series))].map((series) => ({
    series,
    definition: histogramChart(source.filter((row) => row.series === series), series),
  }))
}

const derivedCharts = histogramPanels(derivedRows)
const analysisCharts = histogramPanels(analysisRows)

const syntheticMutualInformation: ImportanceRow[] = [
  { feature: "bedrooms", score: 0.0182 },
  { feature: "sqrt_sqft", score: 0.0092 },
  { feature: "sqft", score: 0.0079 },
  { feature: "sqft_squared", score: 0.0065 },
  { feature: "sqft_per_bedroom", score: 0.006 },
  { feature: "year_built", score: 0.0042 },
  { feature: "bathrooms", score: 0 },
  { feature: "garage_spaces", score: 0 },
  { feature: "lot_size", score: 0 },
  { feature: "distance_to_city", score: 0 },
]

const syntheticRandomForest: ImportanceRow[] = [
  { feature: "crime_rate", score: 0.1519 },
  { feature: "lot_size", score: 0.1371 },
  { feature: "school_rating", score: 0.1292 },
  { feature: "distance_to_city", score: 0.1256 },
  { feature: "sqft_per_bedroom", score: 0.1115 },
  { feature: "property_age", score: 0.0578 },
  { feature: "year_built", score: 0.0531 },
  { feature: "sqrt_sqft", score: 0.053 },
  { feature: "sqft_squared", score: 0.0514 },
  { feature: "sqft", score: 0.0491 },
]

const bostonMutualInformation: ImportanceRow[] = [
  { feature: "price_per_room", score: 1.709654 },
  { feature: "sqrt_lstat", score: 0.671636 },
  { feature: "LSTAT", score: 0.667819 },
  { feature: "RM", score: 0.509024 },
  { feature: "lstat_x_age", score: 0.50018 },
  { feature: "sq_rm", score: 0.496477 },
  { feature: "PTRATIO", score: 0.481389 },
  { feature: "INDUS", score: 0.480823 },
  { feature: "NOX", score: 0.437829 },
  { feature: "nox_per_industry", score: 0.436681 },
]

const bostonRandomForest: ImportanceRow[] = [
  { feature: "price_per_room", score: 0.93295 },
  { feature: "RM", score: 0.02507 },
  { feature: "sq_rm", score: 0.021376 },
  { feature: "sqrt_lstat", score: 0.003624 },
  { feature: "B", score: 0.002964 },
  { feature: "LSTAT", score: 0.002757 },
  { feature: "crime_per_capita", score: 0.001593 },
  { feature: "lstat_x_age", score: 0.001458 },
  { feature: "rm_x_age", score: 0.001282 },
  { feature: "distance_per_age", score: 0.001234 },
]

function importanceChart(rows: ImportanceRow[], axisLabel: string, maximum?: number) {
  return defineChart({
    marks: [barX(rows, { x: "score", y: "feature", key: "feature", inset: 2 })],
    x: {
      scale: maximum ? () => scaleLinear().domain([0, maximum]) : scaleLinear,
      nice: !maximum,
      grid: true,
      axis: { label: axisLabel },
    },
    y: { scale: () => scaleBand<string>().domain(rows.map((row) => row.feature)).padding(0.12) },
    tooltip,
  })
}

const syntheticMutualInformationChart = importanceChart(syntheticMutualInformation, "Mutual Information", 0.02)
const syntheticRandomForestChart = importanceChart(syntheticRandomForest, "Feature Importance", 0.16)
const bostonMutualInformationChart = importanceChart(bostonMutualInformation, "Mutual Information Score")
const bostonRandomForestChart = importanceChart(bostonRandomForest, "Random Forest Importance", 1)

const predictionRows = unit08Data.boston.predictions as PredictionRow[]
const idealLine = [
  { actual: 5, predicted: 5 },
  { actual: 50, predicted: 50 },
]

function predictionChart(model: "Original" | "Features derivadas") {
  const rows = predictionRows.filter((row) => row.model === model)
  return defineChart({
    marks: [
      dot(rows, { x: "actual", y: "predicted", r: 4, fillOpacity: 0.68 }),
      lineY(idealLine, {
        x: "actual",
        y: "predicted",
        stroke: "#dc2626",
        strokeWidth: 2,
        strokeDasharray: "7 5",
      }),
    ],
    x: { scale: () => scaleLinear().domain([5, 50]), grid: true, axis: { label: "Valor Real (MEDV)" } },
    y: { scale: () => scaleLinear().domain([5, 50]), grid: true, axis: { label: "Valor Predicho (MEDV)" } },
    tooltip,
  })
}

const originalPredictionChart = predictionChart("Original")
const derivedPredictionChart = predictionChart("Features derivadas")

export function Unit08DerivedFeatureDistributions() {
  return (
    <ChartCarousel label="Distribuciones de features derivadas">
      {derivedCharts.map(({ series, definition }) => (
        <Chart key={series} definition={definition} height={320} ariaLabel={`Distribución de ${series}`} />
      ))}
    </ChartCarousel>
  )
}

export function Unit08FeatureDistributionAnalysis() {
  return (
    <ChartCarousel label="Análisis de distribuciones">
      {analysisCharts.map(({ series, definition }) => (
        <Chart key={series} definition={definition} height={300} ariaLabel={`Distribución de ${series}`} />
      ))}
    </ChartCarousel>
  )
}

export function Unit08MutualInformation() {
  return (
    <Chart
      definition={syntheticMutualInformationChart}
      height={460}
      ariaLabel="Top 10 features por Mutual Information"
    />
  )
}

export function Unit08RandomForestImportance() {
  return (
    <Chart
      definition={syntheticRandomForestChart}
      height={460}
      ariaLabel="Top 10 features por Random Forest"
    />
  )
}

export function Unit08ModelComparison() {
  return (
    <ChartCarousel label="Valores reales y predichos de ambos modelos">
      <figure>
        <figcaption>Modelo Original · R² = 0.8923, MSE = 7.9015</figcaption>
        <Chart definition={originalPredictionChart} height={420} ariaLabel="Modelo original: valores reales y predichos" />
      </figure>
      <figure>
        <figcaption>Modelo con Features Derivadas · R² = 0.9533, MSE = 3.4264</figcaption>
        <Chart
          definition={derivedPredictionChart}
          height={420}
          ariaLabel="Modelo con features derivadas: valores reales y predichos"
        />
      </figure>
    </ChartCarousel>
  )
}

export function Unit08BostonFeatureImportance() {
  return (
    <ChartCarousel label="Importancia de features en Boston Housing">
      <Chart
        definition={bostonMutualInformationChart}
        height={520}
        ariaLabel="Top 10 features de Boston Housing por Mutual Information"
      />
      <Chart
        definition={bostonRandomForestChart}
        height={520}
        ariaLabel="Top 10 features de Boston Housing por Random Forest"
      />
    </ChartCarousel>
  )
}
