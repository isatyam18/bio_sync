"use client"

import { useState } from "react"
import { Activity, ArrowUpRight, Menu, X } from "lucide-react"

const navLinks = [
  { label: "Platform", href: "#platform" },
  { label: "Conditions", href: "#conditions" },
  { label: "Approach", href: "#approach" },
  { label: "Trust", href: "#trust" },
]

export function SiteHeader() {
  const [open, setOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 border-b border-border/70 bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-6 px-5 sm:px-8">
        <a href="#top" className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Activity className="h-4.5 w-4.5" strokeWidth={2.5} />
          </span>
          <span className="text-lg font-semibold tracking-tight text-foreground">BioSync</span>
        </a>

        <nav className="hidden items-center gap-8 md:flex">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          <a
            href="/login"
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            Log in
          </a>
          <a
            href="/signup"
            className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Get started
            <ArrowUpRight className="h-4 w-4" />
          </a>
        </div>

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border text-foreground md:hidden"
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {open && (
        <div className="border-t border-border bg-background md:hidden">
          <nav className="mx-auto flex max-w-6xl flex-col gap-1 px-5 py-4 sm:px-8">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                {link.label}
              </a>
            ))}
            <a
              href="/login"
              onClick={() => setOpen(false)}
              className="mt-2 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              Log in
            </a>
            <a
              href="/signup"
              onClick={() => setOpen(false)}
              className="inline-flex items-center justify-center gap-1.5 rounded-full bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground"
            >
              Get started
              <ArrowUpRight className="h-4 w-4" />
            </a>
          </nav>
        </div>
      )}
    </header>
  )
}
