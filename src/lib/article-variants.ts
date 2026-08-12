type ArticlePost = {
  id: string
  data: {
    title: string
  }
}

const tanStackSourceSuffix = "-tanstack"

function getCanonicalArticleId(id: string) {
  return id.endsWith(tanStackSourceSuffix)
    ? id.slice(0, -tanStackSourceSuffix.length)
    : undefined
}

export function getPublishedArticles<T extends ArticlePost>(posts: T[]) {
  return posts
}

export function getArticleRouteId(post: ArticlePost) {
  return getCanonicalArticleId(post.id.toLowerCase()) ?? post.id
}

export function getArticleHref(post: ArticlePost) {
  return `/blog/${getArticleRouteId(post)}/`
}

export function getArticleDisplayTitle<T extends ArticlePost>(post: T) {
  return post.data.title
}

export function validateArticleRoutes<T extends ArticlePost>(posts: T[]) {
  const routeIds = new Set<string>()

  for (const post of getPublishedArticles(posts)) {
    const routeId = getArticleRouteId(post).toLowerCase()

    if (routeIds.has(routeId)) {
      throw new Error(`Dos unidades intentan publicar la ruta "${routeId}".`)
    }

    routeIds.add(routeId)
  }
}
