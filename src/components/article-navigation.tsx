import { RiArrowUpSLine, RiMore2Line } from "@remixicon/react"

import { Button } from "@/components/ui/button"
import { House6FillIcon } from "@/components/icons"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"

type ArticleHeading = {
  depth: number
  slug: string
  text: string
}

type ArticleNavigationProps = {
  title: string
  headings: ArticleHeading[]
}

type ArticleMenuItemsProps = ArticleNavigationProps & {
  showHome?: boolean
  onScrollToTop: () => void
  onScrollToHeading: (slug: string) => void
}

function ArticleMenuItems({
  title,
  headings,
  showHome = false,
  onScrollToTop,
  onScrollToHeading,
}: ArticleMenuItemsProps) {
  return (
    <DropdownMenuGroup>
      {showHome && (
        <>
          <DropdownMenuItem render={<a href="/" data-astro-prefetch="hover" />}>
            <House6FillIcon />
            Inicio
          </DropdownMenuItem>
          <DropdownMenuSeparator />
        </>
      )}
      <DropdownMenuLabel>En este artículo</DropdownMenuLabel>
      <DropdownMenuItem onClick={onScrollToTop}>{title}</DropdownMenuItem>
      {headings.map((heading) => (
        <DropdownMenuItem
          key={heading.slug}
          className={cn(heading.depth > 2 && "pl-5")}
          onClick={() => onScrollToHeading(heading.slug)}
        >
          {heading.text}
        </DropdownMenuItem>
      ))}
    </DropdownMenuGroup>
  )
}

export function ArticleNavigation({ title, headings }: ArticleNavigationProps) {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" })
    window.history.replaceState(null, "", window.location.pathname)
  }

  const scrollToHeading = (slug: string) => {
    const heading = document.getElementById(slug)

    if (!heading) return

    heading.scrollIntoView({ behavior: "smooth", block: "start" })
    window.history.replaceState(null, "", `#${slug}`)
  }

  return (
    <>
      <div className="xl:hidden">
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button
                variant="outline"
                size="icon-lg"
                className="size-11"
                aria-label="Abrir navegación del artículo"
              />
            }
          >
            <RiMore2Line data-icon="inline-start" />
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            side="top"
            className="max-h-[60vh]! w-[min(24rem,calc(100vw-2rem))]! overscroll-contain bg-popover! before:hidden"
          >
            <ArticleMenuItems
              title={title}
              headings={headings}
              showHome
              onScrollToTop={scrollToTop}
              onScrollToHeading={scrollToHeading}
            />
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="hidden max-w-full min-w-0 gap-2 xl:flex">
        <Button
          variant="outline"
          size="icon"
          nativeButton={false}
          render={
            <a href="/" aria-label="Inicio" data-astro-prefetch="hover" />
          }
        >
          <House6FillIcon data-icon="inline-start" />
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger
            render={<Button variant="outline" className="min-w-0 shrink" />}
          >
            <span className="truncate">{title}</span>
            <RiArrowUpSLine data-icon="inline-end" />
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="start"
            side="top"
            className="max-h-[60vh]! w-[min(24rem,calc(100vw-2rem))]! overscroll-contain bg-popover! before:hidden"
          >
            <ArticleMenuItems
              title={title}
              headings={headings}
              onScrollToTop={scrollToTop}
              onScrollToHeading={scrollToHeading}
            />
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </>
  )
}
