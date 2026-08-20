# Portfolio de Inteligencia Artificial y Ciencia de Datos

Sitio técnico que documenta prácticas de análisis exploratorio, calidad de datos, ingeniería de variables, procesamiento de datos no estructurados y flujos ETL. Los artículos combinan explicaciones en MDX, implementaciones reproducibles y visualizaciones interactivas.

**Producción:** [ingenieria-de-datos.vercel.app](https://ingenieria-de-datos.vercel.app)

## Contenido

El portfolio está organizado en cinco áreas:

- **EDA y fuentes de datos:** Iris, catálogo de Netflix e integración multifuente de viajes de taxi de NYC.
- **Calidad y ética:** datos faltantes, valores atípicos, prevención de fuga de información y evaluación de sesgos con Fairlearn.
- **Ingeniería de variables:** transformaciones derivadas, codificación categórica, PCA, selección de variables y variables temporales.
- **Datos especiales:** análisis geoespacial con GeoPandas, procesamiento de imágenes con OpenCV y análisis de audio con librosa.
- **Pipelines ETL:** administración básica de Google Cloud y preparación de datos con Dataprep, Dataflow y BigQuery.

## Stack

- [Astro 7](https://astro.build/) para generación estática y enrutamiento.
- [TypeScript](https://www.typescriptlang.org/) para comprobación estática de tipos.
- [MDX](https://mdxjs.com/) para integrar contenido, código y componentes.
- [React 19](https://react.dev/) para componentes interactivos.
- [TanStack Charts](https://tanstack.com/charts) para visualización de datos.
- [Tailwind CSS 4](https://tailwindcss.com/) y componentes shadcn para la interfaz.
- [Vercel](https://vercel.com/) para despliegue continuo desde `main`.

## Requisitos

- Node.js 22.12 o posterior.
- [pnpm](https://pnpm.io/).
- Python y [uv](https://docs.astral.sh/uv/) únicamente para regenerar los datos de las visualizaciones.

## Desarrollo local

```bash
git clone https://github.com/JoaquinBatser/idk.git
cd idk
pnpm install
pnpm dev
```

El servidor de desarrollo estará disponible en `http://localhost:4321`.

## Comandos

| Comando | Función |
| --- | --- |
| `pnpm dev` | Inicia el servidor local de Astro. |
| `pnpm build` | Genera el sitio estático en `dist/`. |
| `pnpm preview` | Sirve localmente la compilación de producción. |
| `pnpm typecheck` | Comprueba tipos y archivos Astro. |
| `pnpm lint` | Ejecuta ESLint sobre el proyecto. |
| `pnpm format` | Formatea archivos TypeScript, TSX y Astro con Prettier. |
| `pnpm generate:chart-data` | Regenera los archivos JSON usados por las visualizaciones. |

## Estructura del proyecto

```text
src/
├── components/        # Componentes Astro, React y visualizaciones
├── content/blog/      # Artículos MDX organizados por categoría
├── data/              # Datos estáticos para los gráficos
├── layouts/           # Estructura HTML y metadatos compartidos
├── lib/               # Categorías, rutas y utilidades
├── pages/             # Rutas del blog y páginas de categoría
└── styles/            # Estilos globales y tipografía documental
scripts/               # Generadores de datos para visualizaciones
public/                # Recursos estáticos y favicon
```

## Publicación de contenido

Los artículos se almacenan en `src/content/blog/`. Cada archivo debe declarar `title` y `description` en el *frontmatter*:

```mdx
---
title: "Título del artículo"
description: "Descripción breve del análisis."
---

## Objetivos del análisis

Contenido del artículo.
```

Astro valida estos campos mediante el esquema definido en `src/content.config.ts`. Las rutas se generan de forma estática desde `src/pages/blog/[...id].astro`.

## Validación

Antes de publicar cambios:

```bash
pnpm typecheck
pnpm lint
pnpm build
```

Los cambios enviados a la rama `main` activan el despliegue de producción en Vercel.
