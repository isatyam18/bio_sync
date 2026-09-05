"use client"

import { Activity, ArrowUpRight } from "lucide-react"

export function CtaFooter() {
  return (
    <>
      <section id="cta" className="mx-auto max-w-6xl px-5 py-20 sm:px-8 md:py-24">
        <div className="relative overflow-hidden rounded-3xl border border-primary/20 bg-accent/60 px-8 py-14 text-center shadow-sm ring-1 ring-primary/10 sm:px-14 md:py-20">
          <div className="relative">
            <span className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
              Ready when you are
            </span>
            <h2 className="mx-auto mt-4 max-w-2xl text-balance font-serif text-3xl font-semibold leading-tight tracking-tight text-foreground sm:text-4xl">
              Make the next assessment feel effortless.
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-pretty leading-relaxed text-muted-foreground">
              Create an account and bring explainable risk insights into your workflow.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <a
                href="/signup"
                className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
              >
                Get started
                <ArrowUpRight className="h-4 w-4" />
              </a>
              <a
                href="#platform"
                className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-6 py-3 text-sm font-semibold text-foreground transition-colors hover:bg-muted"
              >
                See how it works
              </a>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-border bg-card">
        <div className="mx-auto max-w-6xl px-5 py-14 sm:px-8">
          <div className="flex flex-col gap-8 md:flex-row md:items-start md:justify-between">
            <div className="max-w-sm">
              <a href="#top" className="flex items-center gap-2.5">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                  <Activity className="h-4.5 w-4.5" strokeWidth={2.5} />
                </span>
                <span className="text-lg font-semibold tracking-tight text-foreground">BioSync</span>
              </a>
              <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
                Model-based health risk assessment for research and decision-support workflows.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-10 sm:grid-cols-3">
              <FooterCol
                title="Platform"
                links={[
                  ["Overview", "#top"],
                  ["Conditions", "#conditions"],
                  ["Approach", "#approach"],
                  ["Security", "#trust"],
                ]}
              />
              <FooterCol title="Project" links={[["Research prototype"], ["SIH build"]]} />
              <FooterCol title="Notice" links={[["Privacy-minded design"], ["Decision support"], ["Not a diagnosis"]]} />
            </div>
          </div>

          <div className="mt-12 rounded-xl border border-border bg-muted/60 p-4 text-xs leading-relaxed text-muted-foreground">
            <strong className="font-semibold text-foreground">Decision-support notice:</strong>{" "}
            BioSync provides model-based risk assessment for research and decision support. It is not
            a diagnosis and does not replace professional medical evaluation.
          </div>

          <p className="mt-8 text-xs text-muted-foreground">
            © {new Date().getFullYear()} BioSync. All rights reserved.
          </p>
        </div>
      </footer>
    </>
  )
}

function FooterCol({ title, links }: { title: string; links: [string, string?][] }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-foreground">{title}</p>
      <ul className="mt-4 space-y-2.5">
        {links.map(([label, href]) => (
          <li key={label}>
            {href ? (
              <a href={href} className="text-sm text-muted-foreground transition-colors hover:text-foreground">{label}</a>
            ) : (
              <span className="text-sm text-muted-foreground">{label}</span>
            )}
          </li>
        ))}
      </ul>
    </div>
  )
}
