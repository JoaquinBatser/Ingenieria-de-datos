import * as React from "react"
import { RiArrowLeftSLine, RiArrowRightSLine } from "@remixicon/react"

import { Button } from "@/components/ui/button"
import {
  Item,
  ItemActions,
  ItemContent,
  ItemHeader,
  ItemTitle,
} from "@/components/ui/item"
import { cn } from "@/lib/utils"

type ChartCarouselProps = {
  children: React.ReactNode
  label: string
}

export function ChartCarousel({ children, label }: ChartCarouselProps) {
  const slides = React.Children.toArray(children)
  const viewportRef = React.useRef<HTMLDivElement>(null)
  const scrollTimerRef = React.useRef<number | null>(null)
  const dragRef = React.useRef({
    active: false,
    startX: 0,
    startScrollLeft: 0,
    startIndex: 0,
  })
  const descriptionId = React.useId()
  const [index, setIndex] = React.useState(0)
  const [visibleCount, setVisibleCount] = React.useState(1)
  const [isDragging, setIsDragging] = React.useState(false)

  const lastIndex = Math.max(0, slides.length - visibleCount)
  const currentIndex = Math.min(index, lastIndex)

  const findClosestIndex = React.useCallback(
    (viewport: HTMLDivElement) =>
      Math.min(
        Array.from(viewport.children).reduce(
          (closest, child, childIndex) =>
            Math.abs((child as HTMLElement).offsetLeft - viewport.scrollLeft) <
            Math.abs(
              (viewport.children.item(closest) as HTMLElement).offsetLeft -
                viewport.scrollLeft
            )
              ? childIndex
              : closest,
          0
        ),
        lastIndex
      ),
    [lastIndex]
  )

  const scrollTo = React.useCallback(
    (nextIndex: number, behavior?: ScrollBehavior) => {
      const viewport = viewportRef.current
      if (!viewport) return

      const clampedIndex = Math.min(Math.max(nextIndex, 0), lastIndex)
      const slide = viewport.children.item(clampedIndex) as HTMLElement | null
      if (!slide) return

      const resolvedBehavior =
        behavior ??
        (window.matchMedia("(prefers-reduced-motion: reduce)").matches
          ? "auto"
          : "smooth")

      viewport.scrollTo({ left: slide.offsetLeft, behavior: resolvedBehavior })
      setIndex(clampedIndex)
    },
    [lastIndex]
  )

  React.useEffect(() => {
    const mediaQuery = window.matchMedia("(min-width: 768px)")
    const updateVisibleCount = () => setVisibleCount(mediaQuery.matches ? 2 : 1)

    updateVisibleCount()
    mediaQuery.addEventListener("change", updateVisibleCount)
    return () => mediaQuery.removeEventListener("change", updateVisibleCount)
  }, [])

  React.useEffect(() => {
    scrollTo(currentIndex, "auto")
  }, [currentIndex, scrollTo, visibleCount])

  React.useEffect(
    () => () => {
      if (scrollTimerRef.current !== null) {
        window.clearTimeout(scrollTimerRef.current)
      }
    },
    []
  )

  function syncIndexWithScroll() {
    if (scrollTimerRef.current !== null) {
      window.clearTimeout(scrollTimerRef.current)
    }

    scrollTimerRef.current = window.setTimeout(() => {
      scrollTimerRef.current = null
      const viewport = viewportRef.current
      if (!viewport || dragRef.current.active) return

      setIndex(findClosestIndex(viewport))
    }, 120)
  }

  function handlePointerDown(event: React.PointerEvent<HTMLDivElement>) {
    if (event.pointerType !== "mouse" || event.button !== 0) return

    dragRef.current = {
      active: true,
      startX: event.clientX,
      startScrollLeft: event.currentTarget.scrollLeft,
      startIndex: findClosestIndex(event.currentTarget),
    }
    event.currentTarget.setPointerCapture(event.pointerId)
    setIsDragging(true)
  }

  function handlePointerMove(event: React.PointerEvent<HTMLDivElement>) {
    if (!dragRef.current.active || event.pointerType !== "mouse") return

    event.preventDefault()
    event.currentTarget.scrollLeft =
      dragRef.current.startScrollLeft - (event.clientX - dragRef.current.startX)
  }

  function finishDrag(event: React.PointerEvent<HTMLDivElement>) {
    if (!dragRef.current.active || event.pointerType !== "mouse") return

    const distance = event.clientX - dragRef.current.startX
    let targetIndex = findClosestIndex(event.currentTarget)

    if (Math.abs(distance) >= 48 && targetIndex === dragRef.current.startIndex) {
      targetIndex += distance < 0 ? 1 : -1
    }

    dragRef.current.active = false
    setIsDragging(false)
    if (scrollTimerRef.current !== null) {
      window.clearTimeout(scrollTimerRef.current)
      scrollTimerRef.current = null
    }
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId)
    }
    scrollTo(targetIndex)
  }

  function cancelDrag(event: React.PointerEvent<HTMLDivElement>) {
    if (!dragRef.current.active || event.pointerType !== "mouse") return

    const startIndex = dragRef.current.startIndex
    dragRef.current.active = false
    setIsDragging(false)
    if (scrollTimerRef.current !== null) {
      window.clearTimeout(scrollTimerRef.current)
      scrollTimerRef.current = null
    }
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId)
    }
    scrollTo(startIndex)
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    if (event.key === "ArrowLeft") {
      event.preventDefault()
      scrollTo(currentIndex - 1)
    } else if (event.key === "ArrowRight") {
      event.preventDefault()
      scrollTo(currentIndex + 1)
    } else if (event.key === "Home") {
      event.preventDefault()
      scrollTo(0)
    } else if (event.key === "End") {
      event.preventDefault()
      scrollTo(lastIndex)
    }
  }

  if (slides.length === 0) return null

  const rangeStart = currentIndex + 1
  const rangeEnd = Math.min(currentIndex + visibleCount, slides.length)
  const counter =
    rangeStart === rangeEnd
      ? `${rangeStart} de ${slides.length} gráficos`
      : `${rangeStart}–${rangeEnd} de ${slides.length} gráficos`

  return (
    <Item
      variant="outline"
      className="not-typeset mt-[var(--typeset-flow)] block overflow-hidden bg-muted/50 p-0"
      role="region"
      aria-roledescription="carrusel"
      aria-label={label}
    >
      <ItemHeader className="border-b bg-muted px-4 py-2">
        <ItemTitle
          className="font-mono text-xs text-muted-foreground"
          aria-live="polite"
        >
          {counter}
        </ItemTitle>
        <ItemActions>
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            aria-label="Ver gráfico anterior"
            disabled={currentIndex === 0}
            onClick={() => scrollTo(currentIndex - 1)}
          >
            <RiArrowLeftSLine aria-hidden="true" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            aria-label="Ver gráfico siguiente"
            disabled={currentIndex === lastIndex}
            onClick={() => scrollTo(currentIndex + 1)}
          >
            <RiArrowRightSLine aria-hidden="true" />
          </Button>
        </ItemActions>
      </ItemHeader>
      <p id={descriptionId} className="sr-only">
        Desliza, arrastra o usa las flechas para recorrer los gráficos.
      </p>
      <ItemContent
        ref={viewportRef}
        tabIndex={0}
        aria-describedby={descriptionId}
        className={cn(
          "relative min-w-0 cursor-grab snap-x snap-mandatory flex-row gap-0 overflow-x-auto scroll-smooth overscroll-x-contain [scrollbar-width:none] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset motion-reduce:scroll-auto [&::-webkit-scrollbar]:hidden",
          isDragging && "cursor-grabbing snap-none scroll-auto select-none"
        )}
        onScroll={syncIndexWithScroll}
        onKeyDown={handleKeyDown}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={finishDrag}
        onPointerCancel={cancelDrag}
        onDragStart={(event) => event.preventDefault()}
      >
        {slides.map((slide, slideIndex) => (
          <div
            key={slideIndex}
            className="min-w-0 shrink-0 basis-full snap-start p-4 md:basis-1/2 [&_figcaption]:mb-3 [&_figcaption]:text-sm [&_figcaption]:font-medium [&_figure]:m-0"
            role="group"
            aria-label={`Gráfico ${slideIndex + 1} de ${slides.length}`}
          >
            {slide}
          </div>
        ))}
      </ItemContent>
    </Item>
  )
}
