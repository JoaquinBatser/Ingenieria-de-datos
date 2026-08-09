# Bloques de código para el blog

Investigado el 9 de agosto de 2026, usando únicamente documentación y repositorios de los proyectos involucrados.

## Recomendación

Adoptar **`astro-expressive-code`** (actualmente `0.44.1`), conservando el contenido en fences Markdown/MDX. Es la opción más completa y de menor mantenimiento para este blog: resuelve el marco, título de archivo, botón de copiar, resaltado, temas y marcadores en el mismo renderizador. Su `peerDependency` acepta `astro: ^7.0.0`, por lo que es compatible con la versión del proyecto; además, su paquete Astro declara que procesa bloques de cualquier contenido Markdown/MDX. [Paquete oficial](https://www.npmjs.com/package/astro-expressive-code) · [README del paquete](https://github.com/expressive-code/expressive-code/tree/main/packages/astro-expressive-code)

No construir un wrapper propio sobre Shiki: reproducir accesibilidad, copy, estados, títulos, marcadores y estilos responsivos costaría más que la integración y convertiría cada mejora visual en código mantenido localmente. Astro, de hecho, remite a Expressive Code como integración comunitaria para más opciones de marcas y anotaciones. [Astro: Syntax Highlighting](https://docs.astro.build/en/guides/syntax-highlighting/)

## Comparación

| Opción | Astro 7 + MDX | Copy / marco / título | Líneas y resaltado | Temas | Coste y `.typeset` |
| --- | --- | --- | --- | --- | --- |
| **Astro Expressive Code** | Sí: integración Astro para Markdown y MDX; `astro-expressive-code@0.44.1` acepta Astro 7. | Incluidos: frame editor/terminal, `title="archivo.ts"`, detección de comentario de nombre de archivo y botón Copy activo por defecto. | Marcadores y rangos (`{1,4-6}`), foco, diff e inserciones incluidos. Números mediante el plugin oficial opcional. | Temas VS Code/Shiki; por defecto `github-dark` y `github-light`; elimina temas Shiki no usados en Astro. | Una dependencia e integración; sus estilos deben ser dueños de su `pre`, aislado de las reglas genéricas actuales de `.typeset`. |
| **Shiki nativo de Astro + transformers** | Sí: Astro aplica Shiki a fences Markdown y MDX; `markdown.shikiConfig` acepta transformers. | No incluye UI de copy, frame ni título: hay que crearlos con HTML/JS/CSS propios. | `transformerMetaHighlight()` genera clases para `{1,3-4}`; los transformers no incluyen CSS. Números también son implementación propia. | Tema simple o claro/oscuro, temas locales y CSS variables. | Menor cambio inicial, pero alto coste para llegar al resultado deseado; el wrapper y estilos serían responsabilidad del proyecto. |
| **Shiki directo / `@shikijs/rehype`** | Posible, pero para `rehype` requiere pasar el Markdown al procesador Unified; Astro 7 usa Sätteri por defecto y ofrece Unified como alternativa separada. | No aporta copy, frame o título. | Transformers y HTML totalmente controlables, pero sus clases requieren CSS propio. | Temas duales y control fino del highlighter. | Más dependencias y cambio de pipeline, sin ventaja para un blog de fences estáticos. No recomendado. |
| **Prism oficial de Astro** | Compatible mediante `@astrojs/prism` o `markdown.syntaxHighlight: 'prism'`. | No aporta estas funciones. | Sólo tokens/clases; líneas y UI propios. | Requiere aportar stylesheet. | No soluciona el problema visual ni funcional. |

### Capacidades que justifican Expressive Code

- Los frames son automáticos según el lenguaje; un fence con `title="my-test-file.js"` muestra una pestaña de editor. Si no hay `title`, puede extraer un comentario de nombre de archivo de las primeras cuatro líneas y retirarlo del código mostrado. El botón Copy está activo por defecto. [Frames](https://expressive-code.com/key-features/frames/)
- Los marcadores de línea funcionan directamente en Markdown/MDX: `{4}`, `{4-8}` o `{1,4,7-8}`. El contraste se ajusta para mantener legibilidad. [Text & Line Markers](https://expressive-code.com/key-features/text-markers/)
- Los números son una decisión editorial, no una obligación: `@expressive-code/plugin-line-numbers` los habilita por defecto tras instalarlo, pero permite `showLineNumbers=false` y `startLineNumber=5` por bloque. Para este blog conviene instalarlos sólo si se quieren usar, y mantenerlos desactivados por defecto para no añadir ruido a cada ejemplo. [Line Numbers](https://expressive-code.com/plugins/line-numbers/)
- Puede usar pares de temas y temas VS Code compatibles; la integración de Astro elimina temas Shiki no usados del bundle SSR (más de 1 MB según su documentación). [Themes](https://expressive-code.com/guides/themes/)

## Integración propuesta

1. Añadir `astro-expressive-code` como integración de Astro y dejar que procese todos los fences de `.md` y `.mdx`. Desactivar el resaltado Markdown nativo (`markdown.syntaxHighlight: false`) para que no haya dos procesadores sobre el mismo bloque. La configuración de Astro admite explícitamente `false` para no aplicar syntax highlighting. [Referencia Astro](https://docs.astro.build/en/reference/configuration-reference/#markdownsyntaxhighlight)
2. Empezar con los temas por defecto `github-dark` / `github-light`, el botón Copy visible y frames automáticos. Esto reemplaza el bloque oscuro plano actual por una pieza de documentación consistente sin inventar un componente local.
3. Añadir el plugin de números sólo si los artículos lo necesitan. En tal caso, configurarlo en `ec.config.mjs`, que es la ubicación recomendada por Expressive Code para Astro cuando se usa también su componente `<Code>`. [Line Numbers](https://expressive-code.com/plugins/line-numbers/)

Ejemplos de autoría que quedarían disponibles:

````md
```ts title="src/lib/normalizar.ts" {2-3}
export function normalizar(valor: string) {
  return valor.trim()
}
```

```bash title="Terminal"
pnpm build
```
````

## Convivencia con `.typeset`

No existe una API de Astro, Shiki ni Expressive Code llamada `not-typeset`: es una decisión de CSS del sitio. La integración renderiza los bloques **dentro** del contenedor donde se monta `<Content />`; por lo tanto, el actual selector genérico `.typeset :where(pre)` seguirá alcanzando los `<pre>` internos del frame.

La solución no es añadir otro wrapper por cada MDX. Es acotar una sola vez los estilos tipográficos genéricos para que apliquen únicamente a los bloques de código nativos y no a los que ya pertenecen a Expressive Code. En práctica: conservar `.typeset` para prosa/inline code y excluir los `pre` descendientes del contenedor de Expressive Code, o aplicar un reset muy acotado en ese contenedor. No duplicar padding, fondo, radio ni `overflow` del actual `.typeset pre`: Expressive Code ya gestiona esos elementos, incluido su frame y scroll. Esto evita la causa visual actual sin una capa artesanal ni cambios a los MDX.

La observación de conflicto procede del código actual del proyecto: [`src/styles/typeset.css`](../../src/styles/typeset.css) aplica fondo, tipografía, tamaño, radio, padding y `overflow-x` a todo `pre` bajo `.typeset`; [`src/pages/blog/[...id].astro`](../../src/pages/blog/%5B...id%5D.astro) monta el contenido dentro de `.typeset.typeset-docs`.

## Fuentes primarias

- [Astro — Syntax Highlighting](https://docs.astro.build/en/guides/syntax-highlighting/)
- [Astro — configuración de Markdown y Shiki](https://docs.astro.build/en/reference/configuration-reference/#markdownshikiconfig)
- [Astro — procesadores Markdown/MDX](https://docs.astro.build/en/guides/markdown-content/#choosing-a-markdown-processor)
- [Expressive Code — integración Astro](https://github.com/expressive-code/expressive-code/tree/main/packages/astro-expressive-code)
- [Expressive Code — frames](https://expressive-code.com/key-features/frames/), [marcadores](https://expressive-code.com/key-features/text-markers/), [números](https://expressive-code.com/plugins/line-numbers/) y [temas](https://expressive-code.com/guides/themes/)
- [Shiki — transformers](https://shiki.style/guide/transformers), [`@shikijs/transformers`](https://shiki.style/packages/transformers) y [`@shikijs/rehype`](https://shiki.style/packages/rehype)
