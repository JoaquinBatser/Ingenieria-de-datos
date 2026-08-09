import * as React from "react"
import { RiArticleLine } from "@remixicon/react"
import { prefetch } from "astro:prefetch"
import { navigate } from "astro:transitions/client"

import { Button } from "@/components/ui/button"
import { FileSearchIcon } from "@/components/icons"
import { Kbd } from "@/components/ui/kbd"
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"

export type SearchablePost = {
  title: string
  description: string
  category: string
  href: string
}

type BlogSearchProps = {
  posts: SearchablePost[]
}

export function BlogSearch({ posts }: BlogSearchProps) {
  const [open, setOpen] = React.useState(false)

  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() === "k" && (event.metaKey || event.ctrlKey)) {
        event.preventDefault()
        setOpen((current) => !current)
      }
    }

    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [])

  const navigateTo = (href: string) => {
    setOpen(false)
    void navigate(href)
  }

  return (
    <>
      <Button
        variant="outline"
        size="icon-lg"
        className="size-11 xl:hidden"
        aria-label="Buscar"
        onClick={() => setOpen(true)}
      >
        <FileSearchIcon data-icon="inline-start" />
      </Button>
      <Button
        variant="outline"
        className="hidden xl:inline-flex"
        aria-label="Buscar"
        onClick={() => setOpen(true)}
      >
        <FileSearchIcon data-icon="inline-start" />
        <Kbd aria-hidden="true">⌘K</Kbd>
      </Button>

      <CommandDialog
        open={open}
        onOpenChange={setOpen}
        title="Buscar posts"
        description="Busca por título, descripción o tema"
      >
        <Command>
          <CommandInput autoFocus placeholder="Buscar posts..." />
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
