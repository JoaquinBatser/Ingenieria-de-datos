const categoryLabels: Record<string, string> = {
  "eda-y-fuentes": "EDA & Fuentes",
  "calidad-y-etica": "Calidad & Ética",
  "feature-engineering": "Feature Engineering",
  "datos-especiales": "Datos Especiales",
  "pipelines-etl": "Pipelines ETL",
  general: "General",
}

export function getArticleCategory(id: string) {
  const firstSegment = id.split("/")[0].toLowerCase()
  const slug =
    id.includes("/") || firstSegment in categoryLabels
      ? firstSegment
      : "general"

  return {
    slug,
    label: categoryLabels[slug] ?? slug.replaceAll("-", " "),
    href: `/#${slug}`,
  }
}
