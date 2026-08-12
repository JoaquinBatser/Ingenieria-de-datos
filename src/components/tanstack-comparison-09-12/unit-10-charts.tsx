import { colorGradientLegend, defineChart, dot, ruleX, ruleY, text } from "@tanstack/charts"
import { Chart } from "@tanstack/charts/react"
import { Chart as CanvasChart } from "@tanstack/charts/react/canvas"
import { scaleLinear } from "@tanstack/charts/scales/linear"
import { tooltip } from "@tanstack/charts/tooltip"
import unit10Data from "@/data/tanstack/unit10.json"

const pcaRows = unit10Data.pcaEmbedding.map((row, index) => ({
  ...row,
  id: `pca-${index}`,
}))

const tsneRows = unit10Data.tsneEmbedding.map((row, index) => ({
  ...row,
  id: `tsne-${index}`,
}))

const targetDomain = [
  Math.min(...pcaRows.map((row) => row.target)),
  Math.max(...pcaRows.map((row) => row.target)),
]

const loadingsChart = defineChart({
  marks: [
    ruleX([0]),
    ruleY([0]),
    dot(unit10Data.loadings, { x: "pc1", y: "pc2", r: 5 }),
    text(unit10Data.loadings, {
      x: "pc1",
      y: "pc2",
      text: "feature",
      dx: 6,
      dy: -5,
      anchor: "start",
      fontSize: 11,
    }),
  ],
  x: {
    scale: () => scaleLinear().domain([-0.78, 0.9]),
    grid: true,
    axis: { label: `PC1 Loadings (${(unit10Data.pc1Variance * 100).toFixed(1)}% varianza explicada)` },
  },
  y: {
    scale: () => scaleLinear().domain([-0.6, 0.8]),
    grid: true,
    axis: { label: `PC2 Loadings (${(unit10Data.pc2Variance * 100).toFixed(1)}% varianza explicada)` },
  },
  tooltip,
})

function embeddingChart(rows: typeof pcaRows, xLabel: string, yLabel: string) {
  return defineChart({
    marks: [
      dot(rows, {
        x: "x",
        y: "y",
        color: "target",
        key: "id",
        r: 2.2,
        fillOpacity: 0.58,
      }),
    ],
    x: { scale: scaleLinear, grid: true, axis: { label: xLabel } },
    y: { scale: scaleLinear, grid: true, axis: { label: yLabel } },
    color: {
      domain: targetDomain,
      range: ["#440154", "#3b528b", "#21918c", "#5ec962", "#fde725"],
      legend: colorGradientLegend({
        label: "Precio objetivo",
        steps: 8,
        format: (value) => `$${Math.round(value / 1_000)}k`,
      }),
    },
    tooltip,
  })
}

const pcaEmbeddingChart = embeddingChart(pcaRows, "Componente 1", "Componente 2")
const tsneEmbeddingChart = embeddingChart(tsneRows, "Dimensión 1", "Dimensión 2")

export function PcaLoadingsChart() {
  return (
    <figure>
      <figcaption>
        Loadings Plot - Top Features en PC1 y PC2 (Features más influyentes en componentes principales)
      </figcaption>
      <Chart
        ariaLabel="Loadings de las features más influyentes en los dos primeros componentes principales"
        definition={loadingsChart}
        height={680}
      />
    </figure>
  )
}

export function PcaEmbeddingsChart() {
  return (
    <section aria-label="Comparación visual de PCA y t-SNE" className="grid gap-8 xl:grid-cols-2">
      <figure>
        <figcaption>
          PCA (Var: {(unit10Data.pcaEmbeddingVariance * 100).toFixed(2)}%; muestra reproducible de {pcaRows.length.toLocaleString("es-UY")} de {unit10Data.pcaEmbeddingPopulation.toLocaleString("es-UY")})
        </figcaption>
        <CanvasChart
          ariaLabel="Embedding PCA de California Housing coloreado por precio objetivo"
          definition={pcaEmbeddingChart}
          height={520}
        />
      </figure>
      <figure>
        <figcaption>t-SNE (Visualización)</figcaption>
        <CanvasChart
          ariaLabel="Embedding t-SNE de una muestra de quinientas viviendas coloreado por precio objetivo"
          definition={tsneEmbeddingChart}
          height={520}
        />
      </figure>
    </section>
  )
}
