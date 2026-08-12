import * as React from "react"
import {
  RiArrowDownSLine,
  RiArrowUpSLine,
  RiArticleLine,
} from "@remixicon/react"
import { prefetch } from "astro:prefetch"
import { navigate } from "astro:transitions/client"

import { FileSearchIcon, House6FillIcon } from "@/components/icons"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Kbd } from "@/components/ui/kbd"
import { cn } from "@/lib/utils"

type ArticleHeading = {
  depth: number
  slug: string
  text: string
}

type ArticleNavigation = {
  href: string
  title: string
  category: {
    href: string
    label: string
  }
  headings: ArticleHeading[]
}

export type SearchablePost = {
  title: string
  description: string
  category: string
  href: string
}

type BlogNavigationProps = {
  article?: ArticleNavigation
  posts: SearchablePost[]
}

type ArticleMenuProps = {
  article: ArticleNavigation
  showCategory?: boolean
}

function ArticleMenu({ article, showCategory = false }: ArticleMenuProps) {
  return (
    <DropdownMenuGroup>
      {showCategory && (
        <>
          <DropdownMenuItem
            render={
              <a href={article.category.href} data-astro-prefetch="hover" />
            }
          >
            {article.category.label}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
        </>
      )}
      <DropdownMenuLabel>En este artículo</DropdownMenuLabel>
      <DropdownMenuItem render={<a href={article.href} />}>
        {article.title}
      </DropdownMenuItem>
      {article.headings.map((heading) => (
        <DropdownMenuItem
          key={heading.slug}
          className={cn(heading.depth > 2 && "pl-5")}
          render={<a href={`${article.href}#${heading.slug}`} />}
        >
          {heading.text}
        </DropdownMenuItem>
      ))}
    </DropdownMenuGroup>
  )
}

export function BlogNavigation({ article, posts }: BlogNavigationProps) {
  const [searchOpen, setSearchOpen] = React.useState(false)

  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() === "k" && (event.metaKey || event.ctrlKey)) {
        event.preventDefault()
        setSearchOpen((current) => !current)
      }
    }

    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [])

  const navigateTo = (href: string) => {
    setSearchOpen(false)
    void navigate(href)
  }

  const articleMenu = article && <ArticleMenu article={article} />

  return (
    <>
      <header className="sticky top-0 z-40 hidden backdrop-blur md:block">
        <div className="mx-auto flex max-w-3xl items-center gap-2 py-2 px-6">
          <Breadcrumb
            aria-label="Breadcrumbs"
            className="flex min-w-0 flex-1 items-center"
          >
            <BreadcrumbList className="min-w-0 flex-nowrap gap-1 sm:gap-1">
              <BreadcrumbItem>
                <BreadcrumbLink
                  className="flex size-5 items-center justify-center"
                  render={
                    <a
                      href="/"
                      aria-label="Inicio"
                      data-astro-prefetch="hover"
                    />
                  }
                >
                  <House6FillIcon data-icon="inline-start" />
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              {article ? (
                <>
                  <BreadcrumbItem className="shrink-0">
                    <BreadcrumbLink
                      render={
                        <a
                          href={article.category.href}
                          data-astro-prefetch="hover"
                        />
                      }
                    >
                      {article.category.label}
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem className="min-w-0">
                    <DropdownMenu>
                      <DropdownMenuTrigger
                        render={
                          <Button
                            variant="ghost"
                            size="sm"
                            className="max-w-full min-w-0"
                          />
                        }
                      >
                        <span className="truncate">{article.title}</span>
                        <RiArrowDownSLine data-icon="inline-end" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent
                        align="start"
                        side="bottom"
                        className="max-h-[min(70vh,36rem)]! w-[min(24rem,calc(100vw-2rem))]! overscroll-contain bg-popover! before:hidden"
                      >
                        {articleMenu}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </BreadcrumbItem>
                </>
              ) : (
                <BreadcrumbItem>
                  <BreadcrumbPage>Posts</BreadcrumbPage>
                </BreadcrumbItem>
              )}
            </BreadcrumbList>
          </Breadcrumb>

          <Button
            variant="outline"
            aria-label="Buscar"
            onClick={() => setSearchOpen(true)}
          >
            <FileSearchIcon data-icon="inline-start" />
            <Kbd aria-hidden="true">⌘K</Kbd>
          </Button>
        </div>
      </header>

      <footer className="fixed inset-x-0 bottom-0 z-40 border-t bg-background/90 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden">
        <nav
          aria-label="Navegación del blog"
          className="mx-auto grid max-w-md grid-cols-[2.75rem_minmax(0,1fr)_2.75rem] items-center gap-2 p-3"
        >
          <Button
            variant="ghost"
            size="icon-lg"
            className="size-11"
            nativeButton={false}
            render={
              <a
                href="/"
                aria-label="Inicio"
                aria-current={article ? undefined : "page"}
                data-astro-prefetch="hover"
              />
            }
          >
            <House6FillIcon data-icon="inline-start" />
          </Button>
          <Breadcrumb className="min-w-0">
            <BreadcrumbList className="block min-w-0">
              <BreadcrumbItem className="block min-w-0">
                {article ? (
                  <DropdownMenu>
                    <DropdownMenuTrigger
                      render={
                        <Button
                          variant="outline"
                          className="h-11 w-full min-w-0 justify-between px-3"
                          aria-label="Abrir breadcrumbs y navegación del artículo"
                        />
                      }
                    >
                      <span className="truncate text-xs">
                        {article.category.label} / {article.title}
                      </span>
                      <RiArrowUpSLine data-icon="inline-end" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      align="center"
                      side="top"
                      className="max-h-[60vh]! w-[min(24rem,calc(100vw-2rem))]! overscroll-contain bg-popover! before:hidden"
                    >
                      <ArticleMenu article={article} showCategory />
                    </DropdownMenuContent>
                  </DropdownMenu>
                ) : (
                  <BreadcrumbPage className="flex h-11 items-center justify-center rounded-2xl border px-3 text-sm font-medium">
                    Posts
                  </BreadcrumbPage>
                )}
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
          <Button
            variant="ghost"
            size="icon-lg"
            className="size-11"
            aria-label="Buscar"
            onClick={() => setSearchOpen(true)}
          >
            <FileSearchIcon data-icon="inline-start" />
          </Button>
        </nav>
      </footer>

      <CommandDialog
        open={searchOpen}
        onOpenChange={setSearchOpen}
        title="Buscar"
        description="Busca por título, descripción o tema"
      >
        <Command>
          <CommandInput autoFocus placeholder="Buscar..." />
          <CommandList>
            <CommandEmpty>No se encontraron posts.</CommandEmpty>
            <CommandGroup heading="Posts">
              {posts.map((post) => (
                <CommandItem
                  key={post.href}
                  value={post.title}
                  keywords={[post.description, post.category]}
                  onPointerEnter={() => prefetch(post.href)}
                  onFocus={() => prefetch(post.href)}
                  onSelect={() => navigateTo(post.href)}
                >
                  <RiArticleLine />
                  <span className="flex min-w-0 flex-col">
                    <span>{post.title}</span>
                    <span className="truncate text-xs text-muted-foreground">
                      {post.description}
                    </span>
                  </span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </CommandDialog>
    </>
  )
}
