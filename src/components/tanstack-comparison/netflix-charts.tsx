import {
  areaY,
  barX,
  barY,
  cell,
  colorGradientLegend,
  colorLegend,
  defineChart,
  dot,
  group,
  lineY,
  text,
} from "@tanstack/charts"
import { Chart } from "@tanstack/charts/react"
import { pie, polar, radialArc, radialText } from "@tanstack/charts/polar"
import { scaleBand } from "@tanstack/charts/scales/band"
import { scaleLinear } from "@tanstack/charts/scales/linear"
import { scaleOrdinal } from "@tanstack/charts/scales/ordinal"
import { scalePoint } from "@tanstack/charts/scales/point"
import { tooltip } from "@tanstack/charts/tooltip"

import { ChartCarousel } from "@/components/chart-carousel"
import comparisonData from "@/data/tanstack-comparison.json"

const netflix = comparisonData.netflix
const typeOrder = netflix.types.map((row) => row.label)
const typeColors = ["#7bb9d6", "#ef7d80"]

function rankingChart(
  rows: readonly { label: string; value: number }[],
  label: string
) {
  return defineChart({
    marks: [barX(rows, { x: "value", y: "label", key: "label", inset: 2 })],
    x: { scale: scaleLinear, nice: true, grid: true, axis: { label } },
    y: {
      scale: () =>
        scaleBand<string>()
          .domain(rows.map((row) => row.label))
          .padding(0.18),
    },
    tooltip,
  })
}

const missingPercent = netflix.missing.map((row) => ({
  label: row.label,
  value: (row.value / netflix.totalTitles) * 100,
}))
const missingDataDefinition = rankingChart(
  missingPercent,
  "Porcentaje de datos faltantes (%)"
)

const missingMatrixRowOrder = netflix.missingMatrix.bins.map(
  (bin) => `${bin.rowStart}–${bin.rowEnd - 1}`
)

function missingHeatmap(fields: readonly string[]) {
  const rows = netflix.missingMatrix.bins.flatMap((bin) =>
    fields.map((field) => ({
      field,
      row: `${bin.rowStart}–${bin.rowEnd - 1}`,
      rowStart: bin.rowStart,
      rate: bin.rates[netflix.missingMatrix.fields.indexOf(field)] ?? 0,
    }))
  )

  return defineChart({
    marks: [
      cell(rows, {
        x: "field",
        y: "row",
        color: "rate",
        key: (row) => `${row.field}-${row.rowStart}`,
      }),
    ],
    x: {
      scale: () => scaleBand<string>().domain(fields).padding(0),
      axis: { tickLabels: { rotate: -32 } },
    },
    y: {
      scale: () => scaleBand<string>().domain(missingMatrixRowOrder).padding(0),
      reverse: true,
      axis: { ticks: { spacing: 54 }, tickLabels: { fontSize: 10 } },
    },
    color: {
      domain: [0, 1],
      range: ["#440154", "#fde725"],
      legend: colorGradientLegend({
        label: `Proporción faltante por bloque de ${netflix.missingMatrix.binSize} filas`,
        steps: 8,
        format: (value) => `${Math.round(value * 100)}%`,
      }),
    },
    tooltip,
  })
}

const missingOverviewHeatmapDefinition = missingHeatmap(
  netflix.missingMatrix.fields
)
const missingHeatmapDefinition = missingHeatmap(
  netflix.missingMatrix.relevantFields
)

const contentCountDefinition = defineChart({
  marks: [
    barY(netflix.types, {
      x: "label",
      y: "value",
      color: "label",
      key: "label",
      inset: 4,
    }),
  ],
  x: {
    scale: () => scaleBand<string>().domain(typeOrder).padding(0.2),
    axis: { label: "Tipo" },
  },
  y: {
    scale: scaleLinear,
    nice: true,
    grid: true,
    axis: { label: "Cantidad" },
  },
  color: {
    scale: () =>
      scaleOrdinal<string, string>().domain(typeOrder).range(typeColors),
    legend: colorLegend({ label: "Tipo" }),
  },
  tooltip,
})

const contentTypeSlices = pie(netflix.types, { value: "value" })
const contentShareDefinition = defineChart({
  marks: [
    polar({
      inset: 24,
      radiusRatio: 0.78,
      angle: { scale: scaleLinear },
      radius: { scale: scalePoint },
      marks: [
        radialArc(contentTypeSlices, {
          color: "label",
          key: "label",
          stroke: "#ffffff",
          strokeWidth: 1.5,
        }),
        radialText(contentTypeSlices, {
          angle: "angle",
          radius: 1,
          radiusOffset: -62,
          text: (row) => `${row.label}: ${(row.fraction * 100).toFixed(1)}%`,
          fill: "#172033",
          fontWeight: 650,
        }),
      ],
    }),
  ],
  color: {
    scale: () =>
      scaleOrdinal<string, string>().domain(typeOrder).range(typeColors),
  },
  tooltip,
})

const releasesByYearDefinition = defineChart({
  marks: [
    areaY(netflix.releaseYears, {
      x: "year",
      y: "value",
      fill: "#bfdef0",
      fillOpacity: 0.55,
    }),
    lineY(netflix.releaseYears, {
      x: "year",
      y: "value",
      points: true,
      stroke: "#182399",
      strokeWidth: 2.5,
    }),
  ],
  x: {
    scale: () => scaleLinear().domain([2000, 2021]),
    grid: true,
    axis: {
      label: "Año",
      ticks: { values: [2000, 2005, 2010, 2015, 2020, 2021] },
    },
  },
  y: {
    scale: scaleLinear,
    nice: true,
    grid: true,
    axis: { label: "Cantidad de títulos" },
  },
  tooltip,
})

const countriesDefinition = rankingChart(
  netflix.countries,
  "Cantidad de títulos"
)

const ratingOrder = netflix.ratings.map((row) => row.label)
const ratingsDefinition = defineChart({
  marks: [
    barY(netflix.ratings, {
      x: "label",
      y: "value",
      color: "label",
      key: "label",
      inset: 3,
    }),
  ],
  x: {
    scale: () => scaleBand<string>().domain(ratingOrder).padding(0.14),
    axis: { label: "Rating", tickLabels: { rotate: -42 } },
  },
  y: {
    scale: scaleLinear,
    nice: true,
    grid: true,
    axis: { label: "Cantidad" },
  },
  tooltip,
})

const ratingsByTypeDefinition = defineChart({
  marks: [
    barY(netflix.ratingsByType, {
      x: "label",
      y: "value",
      color: "type",
      z: "type",
      key: (row) => `${row.label}-${row.type}`,
      layout: group({ padding: 0.12 }),
      inset: 1,
    }),
  ],
  x: {
    scale: () => scaleBand<string>().domain(ratingOrder).padding(0.12),
    axis: { label: "Rating", tickLabels: { rotate: -42 } },
  },
  y: {
    scale: scaleLinear,
    nice: true,
    grid: true,
    axis: { label: "Cantidad" },
  },
  color: {
    scale: () =>
      scaleOrdinal<string, string>()
        .domain(typeOrder)
        .range(["#de8094", "#b49a47"]),
    legend: colorLegend({ label: "Tipo" }),
  },
  tooltip,
})

const genresDefinition = rankingChart(netflix.genres.slice(0, 10), "Cantidad")

const genreBubbles = netflix.genres.map((row, index) => ({
  ...row,
  rank: index + 1,
}))
const genresBubbleDefinition = defineChart({
  marks: [
    dot(genreBubbles, {
      x: "rank",
      y: "value",
      color: "label",
      r: (row) => 7 + Math.sqrt(row.value) * 0.55,
      key: "label",
      fillOpacity: 0.65,
      stroke: "#4b5563",
      strokeWidth: 1,
    }),
    text(genreBubbles, {
      x: "rank",
      y: "value",
      text: "label",
      fontSize: 10,
      dy: 2,
    }),
  ],
  x: {
    scale: () => scaleLinear().domain([1, genreBubbles.length]),
    axis: { label: "Ranking por frecuencia", ticks: { count: 8 } },
  },
  y: {
    scale: scaleLinear,
    nice: true,
    grid: true,
    axis: { label: "Frecuencia" },
  },
  tooltip,
})

export function NetflixMissingDataChart() {
  return (
    <ChartCarousel label="Porcentajes y patrón general de datos faltantes">
      <Chart
        definition={missingDataDefinition}
        height={390}
        ariaLabel="Porcentaje de datos faltantes por columna en el catálogo Netflix"
      />
      <Chart
        definition={missingOverviewHeatmapDefinition}
        height={390}
        ariaLabel="Patrón de datos faltantes en las doce columnas del catálogo Netflix"
      />
    </ChartCarousel>
  )
}

export function NetflixMissingHeatmapChart() {
  return (
    <Chart
      definition={missingHeatmapDefinition}
      height={720}
      ariaLabel="Heatmap de las cinco columnas con datos faltantes del catálogo Netflix"
    />
  )
}

export function NetflixContentTypesChart() {
  return (
    <ChartCarousel label="Distribución y proporción de películas y series">
      <Chart
        definition={contentCountDefinition}
        height={360}
        ariaLabel="Cantidad de películas y series"
      />
      <Chart
        definition={contentShareDefinition}
        height={360}
        ariaLabel="Proporción de películas y series"
      />
    </ChartCarousel>
  )
}

export function NetflixTemporalTrendChart() {
  return (
    <Chart
      definition={releasesByYearDefinition}
      height={390}
      ariaLabel="Cantidad de títulos de Netflix por año entre 2000 y 2021"
    />
  )
}

export function NetflixCountriesChart() {
  return (
    <Chart
      definition={countriesDefinition}
      height={620}
      ariaLabel="Quince países con más títulos en el catálogo Netflix"
    />
  )
}

export function NetflixRatingsChart() {
  return (
    <ChartCarousel label="Distribución de ratings total y por tipo de contenido">
      <Chart
        definition={ratingsDefinition}
        height={410}
        ariaLabel="Distribución total de ratings"
      />
      <Chart
        definition={ratingsByTypeDefinition}
        height={410}
        ariaLabel="Distribución de ratings para películas y series"
      />
    </ChartCarousel>
  )
}

export function NetflixGenresChart() {
  return (
    <ChartCarousel label="Ranking y diagrama de burbujas de géneros de Netflix">
      <Chart
        definition={genresDefinition}
        height={520}
        ariaLabel="Diez géneros más frecuentes"
      />
      <Chart
        definition={genresBubbleDefinition}
        height={520}
        ariaLabel="Frecuencia de los quince géneros más populares"
      />
    </ChartCarousel>
  )
}
