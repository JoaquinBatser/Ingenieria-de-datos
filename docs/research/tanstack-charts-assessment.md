# Evaluación de TanStack Charts para los gráficos de Python

Investigado el 11 de agosto de 2026. Las afirmaciones sobre TanStack Charts se apoyan únicamente en su documentación y registro oficiales; el inventario de unidades proviene de los MDX versionados en este repositorio.

## Conclusión

**No conviene sustituir todas las imágenes de Python por TanStack Charts.** Sí puede reconstruir en forma interactiva la mayoría de los gráficos estadísticos y temporales del portfolio (líneas, barras, histogramas, dispersión, boxplots, heatmaps, pie/donut y facetas). No es un conversor de PNG ni una librería de procesamiento de imágenes: las figuras que muestran fotografías, filtros de OpenCV, keypoints, o un mapa de teselas deben continuar como imágenes, o requerir otra tecnología especializada.

La recomendación es hacer primero un piloto con una unidad de gráficos convencionales (03 o 06), con datos serializados y una captura de paridad. **No adoptar todavía la biblioteca como reemplazo global:** npm ofrece `@tanstack/charts@0.11.0` y TanStack lo declara *pre-alpha*, con API que puede cambiar entre releases. Además, la documentación `latest` sigue el `main` no publicado. La página oficial de comparación confirma que sus resultados miden el workspace no publicado, no el paquete de npm; la diferencia es de superficie/fuente evaluada, no de número de versión. [Overview](https://tanstack.com/charts/latest/docs/overview) · [Installation](https://tanstack.com/charts/latest/docs/installation) · [Compare Libraries](https://tanstack.com/charts/latest/docs/comparison) · [npm registry](https://registry.npmjs.org/@tanstack/charts/latest)

## Qué aporta y qué exige

- Es una gramática de gráficos TypeScript/JavaScript independiente de framework; compila escenas responsivas y produce SVG accesible por defecto, con Canvas como opción. No elige automáticamente un gráfico ni hace análisis/limpieza de datos. [Overview](https://tanstack.com/charts/latest/docs/overview) · [Choosing a Chart](https://tanstack.com/charts/latest/docs/guides/choosing-a-chart)
- Sus marcas cubren líneas, áreas, barras, rect/cell (heatmaps), puntos, reglas, texto, facetas, polar/radial (pie, donut, radar), `geoShape`, y composiciones para boxplots, histogramas, violines y gráficos de red. La mayoría de los “tipos” se arma componiendo marcas y datos preparados, no con un componente de alto nivel. [Marks and Layering](https://tanstack.com/charts/latest/docs/concepts/marks-and-layering) · [Catalog](https://tanstack.com/charts/catalog)
- Este proyecto ya tiene React 19 y `@astrojs/react`; por pares de dependencia es compatible con el adaptador React, que pide `react` y `react-dom` `^19`. Para montarlo en el blog deberá ser una isla React hidratada en el cliente; las definiciones, escenas y SVG de texto sí pueden generarse sin navegador. Un host DOM responsivo necesita DOM y `ResizeObserver`. [package.json](../../package.json) · [Installation: React and server requirements](https://tanstack.com/charts/latest/docs/installation#framework-compatibility)
- Las escalas lineal, band, point y ordinal vienen en el paquete; temporal, logarítmica, cuantiles y otras escalas requieren importar `d3-scale` directamente. Los datos y transformaciones analíticas siguen siendo responsabilidad de la aplicación. [Installation: scales](https://tanstack.com/charts/latest/docs/installation#choose-scale-capabilities) · [Overview: ownership](https://tanstack.com/charts/latest/docs/overview)

## Imagen, SSR y exportación

TanStack Charts no convierte una imagen existente en datos ni reproduce automáticamente una salida de Matplotlib/Seaborn. Hay que conservar o generar los datos preparados, los bins, escalas, colores, agrupaciones y anotaciones. La guía de migración advierte que una captura no registra esas decisiones y propone contrastar datos, escalas, geometría, ejes e interacción antes de quitar el renderer anterior. [Migrating](https://tanstack.com/charts/latest/docs/guides/migrating)

Una vez reconstruido el gráfico, sí puede exportarse: escena a string SVG sin DOM, SVG montado a SVG, o un gráfico SVG/Canvas montado a PNG, JPEG o WebP en el navegador. Esto resuelve la necesidad futura de descargar una nueva imagen, pero no elimina la necesidad de conservar los gráficos originales si no se dispone de datos/reproducibilidad. [Exporting](https://tanstack.com/charts/latest/docs/guides/exporting)

## Cobertura por unidad

Estados: **Sí** = las visualizaciones de datos detectadas tienen una composición documentada; **Condicional** = son reconstruibles, pero en el MDX no está la receta visual completa o faltan datos preparados; **Parcial** = mezcla charts y raster/mapa especializado; **N/A** = no hay imagen Python embebida actualmente.

| Unidad | Evidencia en el repo | Veredicto | Cómo quedaría |
| --- | --- | --- | --- |
| 01 — Iris | [pairplot, heatmap y boxplots](../../src/content/blog/EDA-y-Fuentes/01-Exploracion-del-Dataset-Iris.mdx) | **Sí** | Scatter facetado, `cell`/heatmap y boxplot compuesto. |
| 02 — publicación Vercel | [MDX](../../src/content/blog/EDA-y-Fuentes/02-Publicacion-del-Portfolio-en-Vercel.mdx) sin imágenes | **N/A** | No hay salida Python que migrar. |
| 03 — EDA Netflix | [barras, heatmap, pie y línea](../../src/content/blog/EDA-y-Fuentes/03-EDA-Netflix-Dataset-con-pandas.mdx) | **Sí** | Barras, heatmap, pie/donut y series temporales son composición documentada. |
| 04 — joins NYC | [MDX](../../src/content/blog/EDA-y-Fuentes/04-EDA-Multi-fuentes-y-Joins.mdx) sin imagen embebida | **N/A** | Podría añadir gráficos nuevos, pero no hay artefacto actual que sustituir. |
| 05 — faltantes | [cuatro imágenes](../../src/content/blog/Calidad-y-Etica/05-Missing-Data-Detective.mdx) y sólo una receta de histogramas superpuestos | **Condicional** | Heatmap de faltantes, distribución y comparaciones son factibles; hace falta recuperar los datos y la especificación de las otras figuras. |
| 06 — escalado | [boxplots e histogramas facetados](../../src/content/blog/Calidad-y-Etica/06-Feature-Scaling-Anti-Leakage-Pipeline.mdx) | **Sí** | Facetas + boxplot/histograma; para KDE se debe preparar la densidad fuera del renderer y dibujarla como línea/área. |
| 07 — Fairlearn | [boxplot, heatmap, histograma, scatter y barras agrupadas](../../src/content/blog/Calidad-y-Etica/07-Detectar-Corregir-Sesgo-Fairlearn.mdx) | **Sí** | Panel facetado con las marcas convencionales. |
| 08 — features derivadas | [seis imágenes de distribución/importancia/modelo](../../src/content/blog/Feature-Engineering/08-Feature-Engineering-con-Pandas.mdx) | **Condicional** | Los títulos describen histogramas, barras y comparaciones reproducibles, pero el MDX no conserva su código de trazado. |
| 09 — encoding | [cinco imágenes de cardinalidad, encoding, importancia y distribución](../../src/content/blog/Feature-Engineering/09-Encoding-Avanzado-y-Target-Encoding.mdx) | **Condicional** | Barras/distribuciones son factibles; recuperar tablas agregadas y la geometría exacta antes de migrar. |
| 10 — PCA | [scree plot y reducción dimensional](../../src/content/blog/Feature-Engineering/10-PCA-y-Feature-Selection.mdx) | **Condicional** | Línea/área para varianza acumulada y scatter para componentes; faltan las instrucciones que produjeron los PNG. |
| 11 — features temporales | [seis imágenes](../../src/content/blog/Feature-Engineering/11-Temporal-Feature-Engineering.mdx) | **Condicional** | Líneas, histogramas y comparaciones temporales se pueden reconstruir con los agregados correctos; no está el código de plot. |
| 12 — GeoPandas | [coropléticos y mapa base](../../src/content/blog/Datos-Especiales/12-Geoespacial-con-GeoPandas.mdx) | **Parcial** | `geoShape` cubre GeoJSON/coropléticos; la capa de teselas OpenStreetMap y el mapa navegable de Folium no los proporciona Charts. |
| 13 — OpenCV | [histograma y paneles `imshow`](../../src/content/blog/Datos-Especiales/13-Imagenes-OpenCV.mdx) | **Parcial** | El histograma sí; imágenes, ecualización, filtros, keypoints y matches deben seguir como raster. |
| 14 — audio | [waveform, FFT, espectrogramas, MFCC/chroma y features](../../src/content/blog/Datos-Especiales/14-Audio-Processing.mdx) | **Parcial** | Waveform/FFT/features: línea; espectrogramas/MFCC/chroma: heatmap con matriz precomputada; la imagen de *data augmentation* no es un chart ordinario. |
| 15 — Google Cloud | [MDX](../../src/content/blog/Pipelines-ETL/15-Google-Cloud.mdx) sin imágenes | **N/A** | No hay salida Python que migrar. |
| 16 — Cloud Dataprep | [MDX](../../src/content/blog/Pipelines-ETL/16-Google-Cloud-Dataprep.mdx) sin imágenes | **N/A** | No hay salida Python que migrar. |

Las equivalencias de las filas **Sí** y **Condicional** están respaldadas por las marcas y ejemplos oficiales de líneas, barras, histogramas, boxplots, scatter, heatmap, pie/donut y facetas. [Marks and Layering](https://tanstack.com/charts/latest/docs/concepts/marks-and-layering) · [Choosing a Chart](https://tanstack.com/charts/latest/docs/guides/choosing-a-chart) · [Catalog](https://tanstack.com/charts/catalog)

## Decisión práctica

1. Mantener como imágenes los outputs de OpenCV y los mapas con teselas/preview de Folium. Son contenido raster o un sistema de mapas, no una gráfica declarativa.
2. Probar una sola isla React en la unidad 03 o 06, usando una copia estática de los agregados producidos por Python y la versión npm `0.11.0` fijada explícitamente. Medir paridad visual y semántica antes de tocar más MDX. La propia guía de migración recomienda ese orden incremental y no usar capturas como especificación completa. [Migrating](https://tanstack.com/charts/latest/docs/guides/migrating)
3. Si el piloto funciona, migrar por familia (barras/líneas primero; luego matrices y facetas), no por todas las unidades a la vez. Dejar las dependencias D3 directas sólo donde sean necesarias (por ejemplo, escalas de tiempo). [Installation](https://tanstack.com/charts/latest/docs/installation#choose-scale-capabilities)
