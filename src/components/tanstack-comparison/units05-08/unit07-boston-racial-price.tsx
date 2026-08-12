import { barY, boxY, defineChart } from "@tanstack/charts"
import { Chart } from "@tanstack/charts/react"
import { scaleBand } from "@tanstack/charts/scales/band"
import { scaleLinear } from "@tanstack/charts/scales/linear"
import { tooltip } from "@tanstack/charts/tooltip"

import { ChartCarousel } from "@/components/chart-carousel"
import fairlearnData from "@/data/tanstack/fairlearn.json"

type BostonRow = { racial: number; price: number }
type PriceRow = BostonRow & { group: "Alta_prop_afroam" | "Baja_prop_afroam"; id: number }

const bostonRows = fairlearnData.boston.scatter as BostonRow[]
const sortedRacialValues = bostonRows.map((row) => row.racial).sort((left, right) => left - right)
const racialMedian = sortedRacialValues[Math.floor(sortedRacialValues.length / 2)]
const priceRows: PriceRow[] = bostonRows.map((row, id) => ({
  ...row,
  group: row.racial >= racialMedian ? "Alta_prop_afroam" : "Baja_prop_afroam",
  id,
}))

function histogram(rows: PriceRow[], bins: number) {
  const minimum = 5
  const maximum = 50
  const width = (maximum - minimum) / bins
  const groups = ["Alta_prop_afroam", "Baja_prop_afroam"] as const

  return groups.flatMap((group) => {
    const counts = Array.from({ length: bins }, () => 0)
    for (const row of rows) {
      if (row.group !== group) continue
      const index = Math.min(bins - 1, Math.max(0, Math.floor((row.price - minimum) / width)))
      counts[index] += 1
    }
    return counts.map((count, index) => ({
      group,
      price: minimum + (index + 0.5) * width,
      count,
    }))
  })
}

const priceHistogram = defineChart({
  marks: [
    barY(histogram(priceRows, 15), {
      x: "price",
      y1: 0,
      y2: "count",
      color: "group",
      key: (row) => `${row.group}-${row.price}`,
      fillOpacity: 0.62,
      inset: 0.5,
    }),
  ],
  x: { scale: () => scaleLinear().domain([5, 50]), axis: { label: "Precio (miles $)" } },
  y: { scale: scaleLinear, nice: true, grid: true, axis: { label: "Frecuencia" } },
  tooltip,
})

const priceBoxplot = defineChart({
  marks: [boxY(priceRows, { x: "group", y: "price", key: "id", inset: 24 })],
  x: { scale: () => scaleBand<string>().domain(["Alta_prop_afroam", "Baja_prop_afroam"]).padding(0.22) },
  y: {
    scale: () => scaleLinear().domain([2, 52]),
    grid: true,
    axis: { label: "Precio (miles $)" },
  },
  tooltip,
})

export function Unit07BiasAnalysis() {
  return (
    <ChartCarousel label="Distribución y boxplot de precios por grupo racial">
      <Chart definition={priceHistogram} height={380} ariaLabel="Distribución de precios por grupo racial" />
      <Chart definition={priceBoxplot} height={380} ariaLabel="Boxplot de precios por grupo racial" />
    </ChartCarousel>
  )
}
