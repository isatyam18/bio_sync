"use client"

import { Database, Brain, CircleCheck, ArrowRight } from "lucide-react"

const steps = [
  {
    n: "01",
    title: "Right data",
    desc: "Use model-specific patient features, never generic proxies.",
  },
  {
    n: "02",
    title: "Right model",
    desc: "Keep each disease assessment cleanly separated.",
  },
  {
    n: "03",
    title: "Right explanation",
    desc: "Make the important contributors visible and reviewable.",
  },
]

const pipeline = [
  { icon: Database, label: "Data", caption: "Structured inputs" },
  { icon: Brain, label: "Model", caption: "Disease-specific ML" },
  { icon: CircleCheck, label: "Insight", caption: "Explainable output" },
]

export function Approach() {
  return (
    <section id="approach" className="mx-auto max-w-6xl px-5 py-20 sm:px-8 md:py-28">
      <div className="grid items-center gap-14 lg:grid-cols-2 lg:gap-16">
        <div className="max-w-xl">
          <span className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
            Designed for trust
          </span>
          <h2 className="mt-4 text-balance font-serif text-3xl font-semibold leading-tight tracking-tight text-foreground sm:text-4xl">
            Powerful underneath. Simple on the surface.
          </h2>
          <p className="mt-4 text-pretty text-lg leading-relaxed text-muted-foreground">
            Good healthcare technology should make complex systems feel understandable. BioSync
            separates the intelligence from the interface, so the experience stays calm while the
            models do the heavy work.
          </p>

          <ul className="mt-8 space-y-4">
            {steps.map((s) => (
              <li key={s.n} className="flex gap-4">
                <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/12 text-sm font-semibold text-primary">
                  {s.n}
                </span>
                <div>
                  <p className="font-semibold text-foreground">{s.title}</p>
                  <p className="text-sm leading-relaxed text-muted-foreground">{s.desc}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        {/* Pipeline visual */}
        <div className="rounded-3xl border border-border bg-card p-8 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            BioSync intelligence
          </p>
          <div className="mt-8 space-y-4">
            {pipeline.map((p, i) => (
              <div key={p.label}>
                <div className="flex items-center gap-4 rounded-xl border border-border bg-background p-4">
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/12 text-primary">
                    <p.icon className="h-5.5 w-5.5" />
                  </span>
                  <div>
                    <p className="font-semibold text-foreground">{p.label}</p>
                    <p className="text-sm text-muted-foreground">{p.caption}</p>
                  </div>
                </div>
                {i < pipeline.length - 1 && (
                  <div className="flex justify-center py-1.5" aria-hidden>
                    <ArrowRight className="h-4 w-4 rotate-90 text-primary/50" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
