import { mkdir, writeFile } from "node:fs/promises"
import { createHash } from "node:crypto"
import { parse } from "csv-parse/sync"

const sources = {
  iris: {
    url: "https://raw.githubusercontent.com/mwaskom/seaborn-data/71e2436a092d714350de0fc409ca8a8714e7e78f/iris.csv",
    sha256: "9cc1c345c71bcc9b486b74cbf6063fa66f4bb5e0f603a4b3c3471ec2e5e8e355",
  },
  netflix: {
    url: "https://raw.githubusercontent.com/swapnilg4u/Netflix-Data-Analysis/ed43f20aade686a7231369edbe571683588867a0/netflix_titles.csv",
    sha256: "7df8166ec178f05b79ad9fbe2be95816bccf14c88dfe30423f60001894b377e5",
  },
}

async function fetchVerifiedCsv(name, source) {
  const response = await fetch(source.url)

  if (!response.ok) {
    throw new Error(`No se pudo descargar ${name}: HTTP ${response.status}`)
  }

  const bytes = Buffer.from(await response.arrayBuffer())
  const sha256 = createHash("sha256").update(bytes).digest("hex")

  if (sha256 !== source.sha256) {
    throw new Error(
      `La fuente ${name} cambió: se esperaba ${source.sha256} y se obtuvo ${sha256}`
    )
  }

  return parse(bytes.toString("utf8"), {
    bom: true,
    columns: true,
    skip_empty_lines: true,
  })
}

function countBy(rows, field) {
  const counts = new Map()

  for (const row of rows) {
    const value = row[field]
    if (value) counts.set(value, (counts.get(value) ?? 0) + 1)
  }

  return [...counts]
    .map(([label, value]) => ({ label, value }))
    .sort(
      (left, right) =>
        right.value - left.value || left.label.localeCompare(right.label)
    )
}

function pearson(rows, leftField, rightField) {
  const leftMean =
    rows.reduce((sum, row) => sum + row[leftField], 0) / rows.length
  const rightMean =
    rows.reduce((sum, row) => sum + row[rightField], 0) / rows.length
  let numerator = 0
  let leftDenominator = 0
  let rightDenominator = 0

  for (const row of rows) {
    const left = row[leftField] - leftMean
    const right = row[rightField] - rightMean
    numerator += left * right
    leftDenominator += left * left
    rightDenominator += right * right
  }

  return numerator / Math.sqrt(leftDenominator * rightDenominator)
}

const [irisRecords, netflix] = await Promise.all([
  fetchVerifiedCsv("Iris", sources.iris),
  fetchVerifiedCsv("Netflix", sources.netflix),
])

const iris = irisRecords.map((row, index) => ({
  id: index + 1,
  species: row.species,
  sepalLength: Number(row.sepal_length),
  sepalWidth: Number(row.sepal_width),
  petalLength: Number(row.petal_length),
  petalWidth: Number(row.petal_width),
}))
const irisFields = ["sepalLength", "sepalWidth", "petalLength", "petalWidth"]
const irisCorrelations = irisFields.flatMap((field, leftIndex) =>
  irisFields.slice(leftIndex + 1).map((otherField) => ({
    pair: `${field} / ${otherField}`,
    correlation: Number(pearson(iris, field, otherField).toFixed(6)),
  }))
)

const netflixFields = Object.keys(netflix[0])
const missing = Object.keys(netflix[0])
  .map((field) => ({
    label: field,
    value: netflix.filter((row) => !row[field]).length,
  }))
  .filter((row) => row.value > 0)
  .sort((left, right) => right.value - left.value)
const missingBinSize = 24
const missingBins = []
for (let start = 0; start < netflix.length; start += missingBinSize) {
  const rows = netflix.slice(start, start + missingBinSize)
  missingBins.push({
    rowStart: start,
    rowEnd: start + rows.length,
    rates: netflixFields.map(
      (field) => rows.filter((row) => !row[field]).length / rows.length
    ),
  })
}
const releaseYears = countBy(netflix, "release_year")
  .map((row) => ({ year: Number(row.label), value: row.value }))
  .filter((row) => row.year >= 2000)
  .sort((left, right) => left.year - right.year)
const countries = new Map()
const genres = new Map()
for (const row of netflix) {
  for (const country of row.country.split(", ").filter(Boolean)) {
    countries.set(country, (countries.get(country) ?? 0) + 1)
  }
  for (const genre of row.listed_in.split(", ").filter(Boolean)) {
    genres.set(genre, (genres.get(genre) ?? 0) + 1)
  }
}
const ranked = (counts, limit) =>
  [...counts]
    .map(([label, value]) => ({ label, value }))
    .sort(
      (left, right) =>
        right.value - left.value || left.label.localeCompare(right.label)
    )
    .slice(0, limit)
const ratings = countBy(netflix, "rating").slice(0, 10)
const ratingsByType = ratings.flatMap(({ label }) =>
  ["Movie", "TV Show"].map((type) => ({
    label,
    type,
    value: netflix.filter((row) => row.rating === label && row.type === type)
      .length,
  }))
)

const output = {
  source: {
    iris: sources.iris,
    netflix: sources.netflix,
    generatedBy: "scripts/generate-tanstack-comparison-data.mjs",
  },
  iris: { rows: iris, correlations: irisCorrelations },
  netflix: {
    totalTitles: netflix.length,
    missing,
    missingMatrix: {
      fields: netflixFields,
      relevantFields: missing.map((row) => row.label),
      binSize: missingBinSize,
      bins: missingBins,
    },
    types: countBy(netflix, "type"),
    releaseYears,
    countries: ranked(countries, 15),
    ratings,
    ratingsByType,
    genres: ranked(genres, 15),
  },
}

await mkdir("src/data", { recursive: true })
await writeFile(
  "src/data/tanstack-comparison.json",
  `${JSON.stringify(output, null, 2)}\n`
)
