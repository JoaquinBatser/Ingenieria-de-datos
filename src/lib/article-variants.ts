type VariantPost = {
  id: string
  data: {
    title: string
  }
}

const sourceVariantSuffix = "-tanstack"
const publicVariantSuffix = "-alternativa"

function getOriginalArticleIdFromSuffix(id: string) {
  return id.endsWith(sourceVariantSuffix)
    ? id.slice(0, -sourceVariantSuffix.length)
    : undefined
}

export function getOriginalArticleId(post: VariantPost) {
  return getOriginalArticleIdFromSuffix(post.id.toLowerCase())
}

export function isAlternativeArticle(post: VariantPost) {
  return post.id.toLowerCase().endsWith(sourceVariantSuffix)
}

export function getArticleVariant<T extends VariantPost>(post: T, posts: T[]) {
  const originalArticleId = getOriginalArticleId(post)
  const postId = post.id.toLowerCase()

  if (originalArticleId) {
    return posts.find(
      (candidate) => candidate.id.toLowerCase() === originalArticleId
    )
  }

  return posts.find(
    (candidate) =>
      isAlternativeArticle(candidate) &&
      getOriginalArticleId(candidate) === postId
  )
}

export function getPublishedArticles<T extends VariantPost>(posts: T[]) {
  return posts
}

export function getArticleRouteId(post: VariantPost) {
  if (!isAlternativeArticle(post)) return post.id

  const originalArticleId = getOriginalArticleId(post)

  return `${originalArticleId}${publicVariantSuffix}`
}

export function getArticleHref(post: VariantPost) {
  return `/blog/${getArticleRouteId(post)}/`
}

export function getArticleVersionLabel<T extends VariantPost>(
  post: T,
  posts: T[]
) {
  if (!getArticleVariant(post, posts)) return undefined

  return isAlternativeArticle(post) ? "Alternativa" : "Original"
}

export function getArticleDisplayTitle<T extends VariantPost>(
  post: T,
  posts: T[]
) {
  const versionLabel = getArticleVersionLabel(post, posts)

  return versionLabel ? `${post.data.title} — ${versionLabel}` : post.data.title
}

export function validateArticleVariants<T extends VariantPost>(posts: T[]) {
  for (const post of posts) {
    if (!isAlternativeArticle(post)) continue

    const originalArticleId = getOriginalArticleId(post)

    if (
      !originalArticleId ||
      !posts.some(({ id }) => id.toLowerCase() === originalArticleId)
    ) {
      throw new Error(
        `La alternativa "${post.id}" no apunta a una unidad original existente.`
      )
    }
  }

  const routeIds = new Set<string>()

  for (const post of getPublishedArticles(posts)) {
    const routeId = getArticleRouteId(post).toLowerCase()

    if (routeIds.has(routeId)) {
      throw new Error(`Dos unidades intentan publicar la ruta "${routeId}".`)
    }

    routeIds.add(routeId)
  }
}
