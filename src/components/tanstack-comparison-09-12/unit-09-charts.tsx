import {
  barX,
  barY,
  defineChart,
  dot,
  rect,
  ruleX,
  ruleY,
} from "@tanstack/charts"
import { Chart } from "@tanstack/charts/react"
import { scaleBand } from "@tanstack/charts/scales/band"
import { scaleLinear } from "@tanstack/charts/scales/linear"
import { tooltip } from "@tanstack/charts/tooltip"

import { ChartCarousel } from "@/components/chart-carousel"

const cardinalityRows = [
  { feature: "workclass", categories: 9, tier: "Baja (≤10)" },
  { feature: "education", categories: 16, tier: "Media (≤50)" },
  { feature: "marital-status", categories: 7, tier: "Baja (≤10)" },
  { feature: "occupation", categories: 15, tier: "Media (≤50)" },
  { feature: "relationship", categories: 6, tier: "Baja (≤10)" },
  { feature: "race", categories: 5, tier: "Baja (≤10)" },
  { feature: "sex", categories: 2, tier: "Baja (≤10)" },
  { feature: "native-country", categories: 42, tier: "Media (≤50)" },
]

const encodingRows = [
  {
    method: "Label Encoding",
    accuracy: 0.861,
    auc: 0.9101,
    f1: 0.6883,
    seconds: 0.18,
    features: 14,
  },
  {
    method: "One-Hot (low card only)",
    accuracy: 0.8471,
    auc: 0.8998,
    f1: 0.6615,
    seconds: 0.17,
    features: 30,
  },
  {
    method: "Target Encoding (high card)",
    accuracy: 0.8029,
    auc: 0.8274,
    f1: 0.5551,
    seconds: 0.2,
    features: 6,
  },
  {
    method: "Branched Pipeline (mixed)",
    accuracy: 0.8472,
    auc: 0.8998,
    f1: 0.6624,
    seconds: 0.19,
    features: 30,
  },
]

const extraComparisonRows = [
  { method: "RF + Target Encoding", accuracy: 0.843527, auc: 0.892811 },
  { method: "RF + CatBoost Encoding", accuracy: 0.845516, auc: 0.892605 },
  { method: "GB + Target Encoding", accuracy: 0.856456, auc: 0.912877 },
  { method: "GB + CatBoost Encoding", accuracy: 0.856456, auc: 0.912877 },
]

const featureImportanceRows = [
  { feature: "num__fnlwgt", importance: 0.223636616 },
  { feature: "num__age", importance: 0.165165458 },
  { feature: "num__education-num", importance: 0.132766013 },
  { feature: "num__capital-gain", importance: 0.114548531 },
  { feature: "num__hours-per-week", importance: 0.092531453 },
  { feature: "low_card__marital-status_Married-civ-spouse", importance: 0.08641286 },
  { feature: "num__capital-loss", importance: 0.037486583 },
  { feature: "low_card__marital-status_Never-married", importance: 0.030535432 },
  { feature: "low_card__sex_Male", importance: 0.01739038 },
  { feature: "low_card__relationship_Not-in-family", importance: 0.015792052 },
  { feature: "low_card__relationship_Own-child", importance: 0.010042309 },
  { feature: "low_card__relationship_Wife", importance: 0.009072022 },
  { feature: "low_card__workclass_Private", importance: 0.008233684 },
  { feature: "low_card__workclass_Self-emp-not-inc", importance: 0.007048456 },
  { feature: "low_card__relationship_Unmarried", importance: 0.006803798 },
  { feature: "low_card__workclass_Self-emp-inc", importance: 0.006380211 },
  { feature: "low_card__race_White", importance: 0.005884432 },
  { feature: "low_card__workclass_Federal-gov", importance: 0.005084701 },
  { feature: "low_card__workclass_Local-gov", importance: 0.00501629 },
  { feature: "low_card__workclass_State-gov", importance: 0.003927938 },
  { feature: "low_card__race_Black", importance: 0.003838262 },
  { feature: "low_card__race_Asian-Pac-Islander", importance: 0.003055849 },
  { feature: "low_card__relationship_Other-relative", importance: 0.002438657 },
  { feature: "low_card__marital-status_Separated", importance: 0.002217809 },
  { feature: "low_card__marital-status_Widowed", importance: 0.001807811 },
  { feature: "low_card__marital-status_Married-spouse-absent", importance: 0.001215959 },
  { feature: "low_card__race_Other", importance: 0.001209416 },
  { feature: "low_card__marital-status_Married-AF-spouse", importance: 0.000327571 },
  { feature: "low_card__workclass_Without-pay", importance: 0.000121518 },
  { feature: "low_card__workclass_Never-worked", importance: 0.000007929 },
]

const importanceByTypeRows = [
  { type: "Numérica", total: 0.766134654, average: 0.127689109 },
  { type: "One-Hot Encoded", total: 0.233865346, average: 0.009744389 },
]

const importanceBinCount = 15
const maximumImportance = Math.max(...featureImportanceRows.map((row) => row.importance))
const importanceBinWidth = maximumImportance / importanceBinCount
const importanceHistogramRows = Array.from({ length: importanceBinCount }, (_, index) => ({
  x1: index * importanceBinWidth,
  x2: (index + 1) * importanceBinWidth,
  count: 0,
}))
for (const row of featureImportanceRows) {
  const index = Math.min(Math.floor(row.importance / importanceBinWidth), importanceBinCount - 1)
  importanceHistogramRows[index].count += 1
}

const categoryAxis = {
  scale: () => scaleBand<string>().padding(0.18),
  axis: { tickLabels: { rotate: -38 } },
}

function metricChart(metric: "accuracy" | "auc" | "f1" | "seconds" | "features", label: string) {
  return defineChart({
    marks: [barY(encodingRows, { x: "method", y: metric, key: "method" })],
    x: categoryAxis,
    y: { scale: scaleLinear, nice: true, grid: true, axis: { label } },
    tooltip,
  })
}

const cardinalityChart = defineChart({
  marks: [
    barY(cardinalityRows, { x: "feature", y: "categories", color: "tier", key: "feature" }),
    ruleY([10], { strokeDasharray: "6 4" }),
    ruleY([50], { strokeDasharray: "6 4" }),
  ],
  x: categoryAxis,
  y: { scale: () => scaleLinear().domain([0, 52]), grid: true, axis: { label: "Número de categorías únicas" } },
  tooltip,
})

const accuracyChart = metricChart("accuracy", "Accuracy")
const aucChart = metricChart("auc", "AUC-ROC")
const f1Chart = metricChart("f1", "F1-Score")
const timeChart = metricChart("seconds", "Tiempo (segundos)")
const featureCountChart = metricChart("features", "Número de features")

const tradeoffChart = defineChart({
  marks: [dot(encodingRows, { x: "features", y: "accuracy", color: "method", r: 6 })],
  x: { scale: scaleLinear, grid: true, axis: { label: "Número de features" } },
  y: { scale: () => scaleLinear().domain([0.8, 0.865]), grid: true, axis: { label: "Accuracy" } },
  tooltip,
})

const totalImportanceChart = defineChart({
  marks: [barY(importanceByTypeRows, { x: "type", y: "total", key: "type" })],
  x: categoryAxis,
  y: { scale: () => scaleLinear().domain([0, 0.8]), grid: true, axis: { label: "Importancia total" } },
  tooltip,
})

const averageImportanceChart = defineChart({
  marks: [barY(importanceByTypeRows, { x: "type", y: "average", key: "type" })],
  x: categoryAxis,
  y: { scale: scaleLinear, nice: true, grid: true, axis: { label: "Importancia promedio" } },
  tooltip,
})

const rankedImportanceChart = defineChart({
  marks: [barX(featureImportanceRows, { x: "importance", y: "feature", key: "feature" })],
  x: { scale: scaleLinear, grid: true, axis: { label: "Importancia" } },
  y: { scale: () => scaleBand<string>().padding(0.12) },
  tooltip,
})

const importanceDistributionChart = defineChart({
  marks: [
    rect(importanceHistogramRows, { x1: "x1", x2: "x2", y1: () => 0, y2: "count", inset: 1 }),
    ruleX([1 / featureImportanceRows.length], { strokeDasharray: "6 4" }),
  ],
  x: { scale: scaleLinear, grid: true, axis: { label: "Valor de importancia" } },
  y: { scale: scaleLinear, nice: true, grid: true, axis: { label: "Frecuencia" } },
  tooltip,
})

function extraMetricChart(metric: "accuracy" | "auc", label: string) {
  return defineChart({
    marks: [barY(extraComparisonRows, { x: "method", y: metric, key: "method" })],
    x: categoryAxis,
    y: { scale: () => scaleLinear().domain([0, 0.95]), grid: true, axis: { label } },
    tooltip,
  })
}

export function EncodingCardinalityChart() {
  return (
    <figure>
      <figcaption>Cardinalidad de Variables Categóricas</figcaption>
      <Chart definition={cardinalityChart} height={420} ariaLabel="Cardinalidad de las ocho variables categóricas" />
    </figure>
  )
}

export function EncodingResultsChart() {
  return (
    <ChartCarousel label="Comparación de cuatro estrategias de encoding">
      <figure><figcaption>Accuracy Comparison</figcaption><Chart definition={accuracyChart} height={320} ariaLabel="Accuracy por estrategia de encoding" /></figure>
      <figure><figcaption>AUC-ROC Comparison</figcaption><Chart definition={aucChart} height={320} ariaLabel="AUC ROC por estrategia de encoding" /></figure>
      <figure><figcaption>F1-Score Comparison</figcaption><Chart definition={f1Chart} height={320} ariaLabel="F1 por estrategia de encoding" /></figure>
      <figure><figcaption>Training Time Comparison</figcaption><Chart definition={timeChart} height={320} ariaLabel="Tiempo de entrenamiento por estrategia de encoding" /></figure>
      <figure><figcaption>Number of Features Comparison</figcaption><Chart definition={featureCountChart} height={320} ariaLabel="Cantidad de features por estrategia de encoding" /></figure>
      <figure><figcaption>Trade-off: Accuracy vs Dimensionality</figcaption><Chart definition={tradeoffChart} height={320} ariaLabel="Accuracy frente a cantidad de features" /></figure>
    </ChartCarousel>
  )
}

export function EncodingFeatureImportanceChart() {
  return (
    <ChartCarousel label="Importancia por tipo de feature">
      <figure><figcaption>Importancia Total por Tipo de Feature</figcaption><Chart definition={totalImportanceChart} height={320} ariaLabel="Importancia total numérica y one hot" /></figure>
      <figure><figcaption>Importancia Promedio por Tipo de Feature</figcaption><Chart definition={averageImportanceChart} height={320} ariaLabel="Importancia promedio numérica y one hot" /></figure>
    </ChartCarousel>
  )
}

export function EncodingFeatureDistributionChart() {
  return (
    <ChartCarousel label="Ranking y distribución de importancias">
      <figure><figcaption>Top Features - Random Forest</figcaption><Chart definition={rankedImportanceChart} height={720} ariaLabel="Ranking de las treinta importancias del Random Forest" /></figure>
      <figure><figcaption>Distribución de Feature Importances</figcaption><Chart definition={importanceDistributionChart} height={420} ariaLabel="Histograma de importancias con promedio" /></figure>
    </ChartCarousel>
  )
}

export function EncodingExtraResultsChart() {
  return (
    <ChartCarousel label="Comparación adicional de encodings y modelos">
      <figure><figcaption>Comparación de Accuracy por Encoding y Modelo</figcaption><Chart definition={extraMetricChart("accuracy", "Accuracy")} height={360} ariaLabel="Accuracy de Target y CatBoost Encoding con Random Forest y Gradient Boosting" /></figure>
      <figure><figcaption>Comparación de ROC AUC por Encoding y Modelo</figcaption><Chart definition={extraMetricChart("auc", "ROC AUC")} height={360} ariaLabel="AUC de Target y CatBoost Encoding con Random Forest y Gradient Boosting" /></figure>
    </ChartCarousel>
  )
}
